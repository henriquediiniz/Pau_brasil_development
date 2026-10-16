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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)
  if (!canManage(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.visitaObrigatoria.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await req.json()
  const data: { quantidadeMinima?: number; ativo?: boolean } = {}
  if (body.quantidadeMinima != null) data.quantidadeMinima = Number(body.quantidadeMinima)
  if (body.ativo != null) data.ativo = Boolean(body.ativo)

  const updated = await prisma.visitaObrigatoria.update({
    where: { id: params.id },
    data,
  })

  await audit({
    actorId:    actor.id,
    actorName:  actor.name ?? 'Admin',
    action:     'VISITA_OBRIGATORIA_ATUALIZADA',
    targetType: 'VisitaObrigatoria',
    targetId:   params.id,
    meta:       data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)
  if (!canManage(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await prisma.visitaObrigatoria.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.visitaObrigatoria.delete({ where: { id: params.id } })

  await audit({
    actorId:    actor.id,
    actorName:  actor.name ?? 'Admin',
    action:     'VISITA_OBRIGATORIA_DELETADA',
    targetType: 'VisitaObrigatoria',
    targetId:   params.id,
    meta:       { userId: existing.userId, operationSlug: existing.operationSlug },
  })

  return NextResponse.json({ ok: true })
}
