import { prisma } from './prisma'
import { LedgerStatus } from '@prisma/client'

export async function getUserBalance(userId: string) {
  const rows = await prisma.pointsLedger.groupBy({
    by: ['status'],
    where: { userId },
    _sum: { points: true },
  })

  let confirmed = 0
  let pending = 0
  for (const row of rows) {
    if (row.status === LedgerStatus.CONFIRMED) confirmed = row._sum.points ?? 0
    else pending += row._sum.points ?? 0
  }

  return { confirmed, pending, total: confirmed + pending }
}

export async function getRanking(
  period: 'daily' | 'weekly' | 'monthly',
  unit?: string,
  funcaoId?: string,
) {
  const now = new Date()
  let startDate: Date

  if (period === 'daily') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === 'weekly') {
    const day = now.getDay()
    startDate = new Date(now)
    startDate.setDate(now.getDate() - day)
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Filtra usuários se necessário
  let userIdFilter: string[] | undefined
  if (unit || funcaoId) {
    const filtered = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(unit ? { units: { has: unit } } : {}),
        ...(funcaoId ? { functionId: funcaoId } : {}),
      },
      select: { id: true },
    })
    userIdFilter = filtered.map(u => u.id)
    if (userIdFilter.length === 0) return []
  }

  const grouped = await prisma.pointsLedger.groupBy({
    by: ['userId'],
    where: {
      status: LedgerStatus.CONFIRMED,
      createdAt: { gte: startDate },
      points: { gt: 0 },
      ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
    },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: 30,
  })

  const userIds = grouped.map((g) => g.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, company: true, units: true, functionId: true, photoUrl: true,
      function: { select: { name: true } } },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))
  return grouped.map((g, i) => {
    const user = userMap.get(g.userId)!
    return {
      position: i + 1,
      userId: g.userId,
      name: user.name,
      photoUrl: user.photoUrl,
      company: user.company,
      unit: user.units?.[0],
      funcao: user.function?.name ?? null,
      points: g._sum.points ?? 0,
    }
  })
}

export async function getRankingFiltros() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { units: true, function: { select: { id: true, name: true } } },
  })

  const unitsSet = new Set<string>()
  const funcoesMap = new Map<string, string>()

  for (const u of users) {
    for (const unit of u.units) if (unit) unitsSet.add(unit)
    if (u.function) funcoesMap.set(u.function.id, u.function.name)
  }

  return {
    units: Array.from(unitsSet).sort(),
    funcoes: Array.from(funcoesMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
  }
}
