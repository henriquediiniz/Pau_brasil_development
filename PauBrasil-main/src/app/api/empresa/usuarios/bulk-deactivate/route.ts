import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageEmpresa, isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'

const bodySchema = z.object({
  ids: z.array(z.string()).min(1, 'Informe ao menos um ID'),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const raw = await req.json().catch(() => null)
  if (raw === null) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const { ids } = parsed.data
  const actorId = actor.id
  const actorName = actor.name ?? 'Admin Empresa'
  const actorIsSysAdmin = isSysAdmin(actor)

  // Remove o próprio admin da lista
  const skippedSelf = ids.filter(id => id === actorId)
  let toDeactivate = ids.filter(id => id !== actorId)

  if (toDeactivate.length === 0) {
    return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 })
  }

  // Admin de empresa só pode desativar usuários da sua própria empresa
  if (!actorIsSysAdmin) {
    const users = await prisma.user.findMany({
      where: { id: { in: toDeactivate } },
      select: { id: true, empresaId: true },
    })
    const valid = users.filter(u => u.empresaId === actor.empresaId).map(u => u.id)
    toDeactivate = valid
  }

  if (toDeactivate.length === 0) {
    return NextResponse.json({ error: 'Nenhum usuário válido para desativar' }, { status: 400 })
  }

  // Busca dados antes de desativar (para o audit log)
  const targets = await prisma.user.findMany({
    where: { id: { in: toDeactivate } },
    select: { id: true, name: true, email: true },
  })

  // Executa desativação e audit em transação — consistência garantida
  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: toDeactivate } },
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
    skipped: skippedSelf.length + (ids.filter(id => id !== actorId).length - toDeactivate.length),
  })
}
