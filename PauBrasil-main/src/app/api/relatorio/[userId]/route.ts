import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageTeam, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const isSelf = params.userId === actor.id
  if (!isSelf && !canManageTeam(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      units: true,
      company: true,
      nivel: true,
      role: true,
      photoUrl: true,
      createdAt: true,
      managerId: true,
      function: { select: { name: true } },
    },
  })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!isSelf && !isSysAdmin(actor) && target.managerId !== actor.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const mesStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const semanaStart = new Date(now)
  semanaStart.setDate(now.getDate() - now.getDay())

  const [totalPts, mesPts, semanaPts] = await Promise.all([
    prisma.pointsLedger.aggregate({
      where: { userId: params.userId, status: 'CONFIRMED', kind: 'EARN' },
      _sum: { points: true },
    }),
    prisma.pointsLedger.aggregate({
      where: { userId: params.userId, status: 'CONFIRMED', kind: 'EARN', createdAt: { gte: mesStart } },
      _sum: { points: true },
    }),
    prisma.pointsLedger.aggregate({
      where: { userId: params.userId, status: 'CONFIRMED', kind: 'EARN', createdAt: { gte: semanaStart } },
      _sum: { points: true },
    }),
  ])

  const tarefas = await prisma.taskInstance.findMany({
    where: {
      userId: params.userId,
      status: { in: ['DONE', 'APPROVED'] },
      conviteDeId: null,
    },
    orderBy: { date: 'desc' },
    take: 50,
    select: {
      id: true,
      date: true,
      status: true,
      adHocTitle: true,
      requestedPoints: true,
      taskDefinition: { select: { title: true, points: true, function: { select: { name: true } } } },
    },
  })

  const certificados = await prisma.uPBCertificado.findMany({
    where: { userId: params.userId },
    orderBy: { emitidoEm: 'desc' },
    select: {
      id: true,
      emitidoEm: true,
      temporada: { select: { titulo: true } },
    },
  })

  const totalTarefas = await prisma.taskInstance.count({
    where: { userId: params.userId, status: { in: ['DONE', 'APPROVED'] } },
  })

  return NextResponse.json({
    usuario: {
      ...target,
      unit: target.units[0] ?? null,
    },
    pontos: {
      total: totalPts._sum?.points ?? 0,
      mes: mesPts._sum?.points ?? 0,
      semana: semanaPts._sum?.points ?? 0,
    },
    tarefas: {
      total: totalTarefas,
      historico: tarefas.map(tarefa => ({
        id: tarefa.id,
        date: tarefa.date,
        status: tarefa.status,
        pointsEarned: tarefa.taskDefinition?.points ?? tarefa.requestedPoints ?? 0,
        taskDefinition: {
          title: tarefa.taskDefinition?.title ?? tarefa.adHocTitle ?? 'Atividade avulsa',
          function: tarefa.taskDefinition?.function ?? null,
        },
      })),
    },
    certificados,
    geradoEm: now.toISOString(),
  })
}
