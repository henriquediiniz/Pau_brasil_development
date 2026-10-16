import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

// POST /api/cron/daily-reminder
// Chamado diariamente (ex: Vercel Cron às 08:00 BRT)
// Protegido por CRON_SECRET no header Authorization
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth   = req.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeFim = new Date(hoje)
  hojeFim.setHours(23, 59, 59, 999)

  // Agrupa instâncias PENDING de hoje por usuário
  const pendentes = await prisma.taskInstance.groupBy({
    by: ['userId'],
    where: {
      status: 'PENDING',
      date: { gte: hoje, lte: hojeFim },
      user: { isActive: true },
    },
    _count: { id: true },
  })

  let enviadas = 0
  for (const { userId, _count } of pendentes) {
    const qtd = _count.id
    await notify(
      userId,
      `📋 Seu checklist de hoje`,
      `Você tem ${qtd} tarefa${qtd !== 1 ? 's' : ''} pendente${qtd !== 1 ? 's' : ''} para hoje. Não deixe passar!`,
      undefined,
      '/app/hoje',
    )
    enviadas++
  }

  // Também avisa gestores sobre aprovações pendentes há mais de 24h
  const aprovacoesSLA = await prisma.taskInstance.groupBy({
    by: ['userId'],
    where: {
      status: 'DONE',
      updatedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      user: {
        isActive: true,
        manager: { isActive: true },
      },
    },
    _count: { id: true },
  })

  // Agrupa por gestor
  const porGestor: Record<string, number> = {}
  if (aprovacoesSLA.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: aprovacoesSLA.map(a => a.userId) } },
      select: { id: true, managerId: true },
    })
    for (const u of users) {
      if (u.managerId) {
        porGestor[u.managerId] = (porGestor[u.managerId] ?? 0) +
          (aprovacoesSLA.find(a => a.userId === u.id)?._count.id ?? 0)
      }
    }
    for (const [gestorId, qtd] of Object.entries(porGestor)) {
      await notify(
        gestorId,
        `⏰ Aprovações aguardando há +24h`,
        `${qtd} tarefa${qtd !== 1 ? 's' : ''} da sua equipe aguarda${qtd === 1 ? '' : 'm'} aprovação há mais de 24 horas.`,
        undefined,
        '/app/aprovar',
      )
    }
  }

  return NextResponse.json({
    ok: true,
    lembretes: enviadas,
    alertasGestor: Object.keys(porGestor).length,
  })
}

// Permite chamada via GET também (Vercel Cron usa GET por padrão)
export async function GET(req: NextRequest) {
  return POST(req)
}
