import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function canManage(user: any) {
  return isSysAdmin(user) || user?.isVisitasAdmin === true
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const userId       = searchParams.get('userId') || undefined
  const operationSlug = searchParams.get('operationSlug') || undefined

  const obrigatorias = await prisma.visitaObrigatoria.findMany({
    where: {
      ...(userId        ? { userId }        : {}),
      ...(operationSlug ? { operationSlug } : {}),
    },
    include: {
      user: { select: { id: true, name: true, leaderTitle: true } },
    },
    orderBy: [{ user: { name: 'asc' } }, { operationSlug: 'asc' }],
  })

  const ops = await prisma.operation.findMany({
    select: { slug: true, name: true },
  })
  const opMap = new Map(ops.map(o => [o.slug, o.name]))

  const result = obrigatorias.map(o => ({
    id:               o.id,
    userId:           o.userId,
    operationSlug:    o.operationSlug,
    operationName:    opMap.get(o.operationSlug) ?? o.operationSlug,
    quantidadeMinima: o.quantidadeMinima,
    ativo:            o.ativo,
    criadoEm:         o.criadoEm,
    user:             o.user,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)
  if (!canManage(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, operationSlug, quantidadeMinima } = await req.json()
  if (!userId || !operationSlug) {
    return NextResponse.json({ error: 'userId e operationSlug são obrigatórios' }, { status: 400 })
  }

  const lider = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isItinerantLeader: true },
  })
  if (!lider?.isItinerantLeader) {
    return NextResponse.json({ error: 'Usuário não é líder itinerante' }, { status: 422 })
  }

  const op = await prisma.operation.findUnique({
    where: { slug: operationSlug },
    select: { slug: true, name: true },
  })
  if (!op) {
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
  }

  const saved = await prisma.visitaObrigatoria.upsert({
    where: { userId_operationSlug: { userId, operationSlug } },
    create: {
      userId,
      operationSlug,
      quantidadeMinima: quantidadeMinima ?? 1,
      ativo: true,
      criadoPor: actor.id,
    },
    update: {
      quantidadeMinima: quantidadeMinima ?? 1,
      ativo: true,
    },
  })

  await audit({
    actorId:    actor.id,
    actorName:  actor.name ?? 'Admin',
    action:     'VISITA_OBRIGATORIA_CRIADA',
    targetType: 'VisitaObrigatoria',
    targetId:   saved.id,
    meta:       { userId, operationSlug, quantidadeMinima: saved.quantidadeMinima },
  })

  return NextResponse.json({ ...saved, operationName: op.name })
}
