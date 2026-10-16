import { prisma } from './prisma'
import { Frequency } from '@prisma/client'

export async function generateDailyChecklist(userId: string, date: Date) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  // ── 1) User + task definitions em paralelo ────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { functionId: true, isActive: true },
  })

  if (!user?.functionId || !user.isActive) return []

  const dayOfWeek = date.getDay()

  // ── 2) Busca definições de tarefas + instâncias existentes hoje em paralelo
  const [taskDefs, existingToday] = await Promise.all([
    prisma.taskDefinition.findMany({
      where: {
        functionId: user.functionId,
        active: true,
        OR: [
          { frequency: Frequency.DAILY,   daysOfWeek: { has: dayOfWeek } },
          { frequency: Frequency.WEEKLY,  daysOfWeek: { has: dayOfWeek } },
          { frequency: Frequency.MONTHLY },
        ],
      },
      include: { prevTasks: { select: { id: true } } },
    }),
    prisma.taskInstance.findMany({
      where: { userId, isAdHoc: false, date: { gte: dayStart, lte: dayEnd } },
      select: { taskDefinitionId: true },
    }),
  ])

  // Cria instâncias que ainda não existem hoje
  const existingIds = new Set(existingToday.map(e => e.taskDefinitionId))
  const toCreate = taskDefs.filter(td => !existingIds.has(td.id))
  if (toCreate.length > 0) {
    await prisma.taskInstance.createMany({
      data: toCreate.map(td => ({
        userId,
        taskDefinitionId: td.id,
        date: dayStart,
        status: td.prevTasks.length > 0 ? 'BLOCKED' : 'PENDING',
      })),
      skipDuplicates: true,
    })
  }

  // ── 3) Pendências + tarefas de hoje + ad-hocs em paralelo ─────────────────
  const [rolledOver, todayRegular, todayAdhoc] = await Promise.all([
    prisma.taskInstance.findMany({
      where: { userId, status: 'PENDING', date: { lt: dayStart } },
      include: { taskDefinition: true },
      orderBy: { date: 'asc' },
    }),
    prisma.taskInstance.findMany({
      where: { userId, isAdHoc: false, date: { gte: dayStart, lte: dayEnd } },
      include: {
        taskDefinition: {
          include: {
            prevTasks: { select: { id: true, title: true, function: { select: { name: true } } } },
          },
        },
        triggeredByInstance: {
          select: {
            id: true,
            user: { select: { name: true } },
            taskDefinition: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.taskInstance.findMany({
      where: {
        userId,
        isAdHoc: true,
        date: { gte: dayStart, lte: dayEnd },
        OR: [{ conviteDeId: null }, { conviteStatus: 'ACEITO' }],
      },
      include: {
        taskDefinition: true,
        conviteDe: {
          select: {
            id: true, adHocTitle: true, requestedPoints: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return [...rolledOver, ...todayRegular, ...todayAdhoc]
}
