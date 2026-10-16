import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SYSTEM_ADMIN_ROLES } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, hasUpbFunctionAccess } from '@/lib/upb-access'

export async function GET(_req: NextRequest, { params }: { params: { temporadaId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: params.temporadaId },
    select: { empresas: true, unidades: true },
  })

  if (!temporada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessUpbAudience(actor, temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const matricula = await prisma.uPBMatricula.findUnique({
    where: { userId_temporadaId: { userId: actor.id, temporadaId: params.temporadaId } },
  })

  return NextResponse.json({ matricula: matricula ?? null })
}

export async function POST(_req: NextRequest, { params }: { params: { temporadaId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id
  const userName = actor.name ?? 'Colaborador'

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: params.temporadaId },
    select: {
      titulo: true,
      restricaoAcesso: true,
      empresas: true,
      unidades: true,
      funcoesComAcesso: true,
    },
  })

  if (!temporada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessUpbAudience(actor, temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!temporada.restricaoAcesso) {
    return NextResponse.json({ error: 'Este curso nao exige matricula' }, { status: 400 })
  }
  if (hasUpbFunctionAccess(actor, temporada)) {
    return NextResponse.json({ error: 'Este curso ja esta liberado para sua funcao' }, { status: 400 })
  }

  const matricula = await prisma.uPBMatricula.upsert({
    where: { userId_temporadaId: { userId, temporadaId: params.temporadaId } },
    update: {},
    create: { userId, temporadaId: params.temporadaId, status: 'PENDENTE' },
  })

  const isNova = matricula.createdAt.getTime() === matricula.updatedAt.getTime()
  if (!isNova) return NextResponse.json({ matricula })

  const adminWhere = temporada.empresas.length > 0
    ? {
        isActive: true,
        OR: [
          { role: { in: [...SYSTEM_ADMIN_ROLES] } },
          { isUPBAdmin: true, company: { in: temporada.empresas } },
        ],
      }
    : {
        isActive: true,
        OR: [
          { role: { in: [...SYSTEM_ADMIN_ROLES] } },
          { isUPBAdmin: true },
        ],
      }

  const admins = await prisma.user.findMany({ where: adminWhere, select: { id: true } })
  for (const admin of admins) {
    void notify(
      admin.id,
      'Nova solicitacao de acesso',
      `${userName} solicitou acesso ao curso "${temporada.titulo}".`
    )
  }

  return NextResponse.json({ matricula }, { status: 201 })
}
