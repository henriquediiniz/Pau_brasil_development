import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isRhAdmin, isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const bodySchema = z.object({
  ids: z.array(z.string()).min(1, 'Informe ao menos um ID'),
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const raw = await req.json().catch(() => null)
  if (raw === null) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const { ids } = parsed.data
  const actorId = actor.id
  const actorName = actor.name ?? 'Admin'
  const actorIsSysAdmin = isSysAdmin(actor)

  // Remove o próprio admin da lista (não pode desativar a si mesmo)
  const skipped = ids.filter(id => id === actorId)
  const toDeactivate = ids.filter(id => id !== actorId)

  if (toDeactivate.length === 0) {
    return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 })
  }

  // Busca os usuários antes de desativar (para o audit log)
  const targets = await prisma.user.findMany({
    where: {
      id: { in: toDeactivate },
      ...(!actorIsSysAdmin ? { role: 'USER' as const } : {}),
    },
    select: { id: true, name: true, email: true },
  })

  if (targets.length === 0) {
    return NextResponse.json({ error: 'Nenhum colaborador válido para desativar' }, { status: 400 })
  }

  // Executa desativação e audit em transação — consistência garantida
  const targetIds = targets.map(u => u.id)

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: targetIds } },
      data: { isActive: false },
    }),
    ...targets.map(u =>
      prisma.auditLog.create({
        data: {
          actorId,
          actorName,
          action: 'USER_DEACTIVATED',
          targetType: 'User',
          targetId: u.id,
          meta: { targetName: u.name, email: u.email, bulk: true },
        },
      })
    ),
  ])

  return NextResponse.json({
    deactivated: targets.length,
    skipped: skipped.length + (toDeactivate.length - targets.length),
  })
})
