import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTeam } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = session.user
  if (!canManageTeam(me)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeFim = new Date(hoje)
  hojeFim.setHours(23, 59, 59, 999)

  const teamFilter = { managerId: me.id, isActive: true }
  const userFilter = { managerId: me.id, isActive: true }

  // Todos os dados da equipe + 3 counts em paralelo
  const [subordinados, aprovacoesPendentes, adhocPendentes, bloqueadas] = await Promise.all([
    prisma.user.findMany({
      where: teamFilter,
      select: {
        id: true, name: true, photoUrl: true,
        function: { select: { name: true } },
        taskInstances: {
          where: { date: { gte: hoje, lte: hojeFim }, status: { not: 'BLOCKED' } },
          select: { id: true, status: true, isAdHoc: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.taskInstance.count({
      where: { status: 'DONE', isAdHoc: false, user: userFilter },
    }),
    prisma.taskInstance.count({
      where: { status: 'DONE', isAdHoc: true, user: userFilter },
    }),
    prisma.taskInstance.count({
      where: { status: 'BLOCKED', date: { gte: hoje, lte: hojeFim }, user: userFilter },
    }),
  ])

  const equipe = subordinados.map(u => {
    const instancias = u.taskInstances
    const total    = instancias.length
    const concluidas = instancias.filter(t => ['DONE', 'APPROVED'].includes(t.status)).length
    const pct = total > 0 ? Math.round((concluidas / total) * 100) : null

    return {
      id: u.id,
      name: u.name,
      photoUrl: u.photoUrl,
      funcao: u.function?.name ?? null,
      total,
      concluidas,
      pct,
      // sem tarefas = nunca acessou hoje
      semTarefas: total === 0,
    }
  })

  // Stats gerais
  const comTarefas  = equipe.filter(u => !u.semTarefas)
  const todos100    = comTarefas.filter(u => u.pct === 100).length
  const parcial     = comTarefas.filter(u => (u.pct ?? 0) > 0 && u.pct! < 100).length
  const zerado      = comTarefas.filter(u => u.pct === 0).length

  return NextResponse.json({
    equipe,
    stats: {
      total: subordinados.length,
      todos100,
      parcial,
      zerado,
      semTarefas: equipe.filter(u => u.semTarefas).length,
      aprovacoesPendentes,
      adhocPendentes,
      bloqueadas,
    },
  })
}
