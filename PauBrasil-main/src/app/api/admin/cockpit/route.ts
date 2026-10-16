import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isGestorLevel } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, nivel: true },
    })

    const effectiveUser = {
      ...session.user,
      role: me?.role ?? session.user.role,
      nivel: me?.nivel ?? session.user.nivel,
    }

    if (!isGestorLevel(effectiveUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Tasks totals this month
    const [tasksTotal, tasksDone, activeUsers, totalUsers] = await Promise.all([
      prisma.taskInstance.count({ where: { date: { gte: startOfMonth } } }),
      prisma.taskInstance.count({ where: { date: { gte: startOfMonth }, status: { in: ['DONE', 'APPROVED'] } } }),
      prisma.taskInstance.findMany({
        where: { date: { gte: startOfMonth } },
        distinct: ['userId'],
        select: { userId: true }
      }),
      prisma.user.count({ where: { isActive: true } }),
    ])

    // Points earned this month grouped by user unit
    const pointsByUnit = await prisma.$queryRaw<{ unit: string; total: bigint }[]>`
      SELECT unnest(u.units) as unit, SUM(l.points) as total
      FROM "PointsLedger" l
      JOIN "User" u ON u.id = l."userId"
      WHERE l."createdAt" >= ${startOfMonth}
      GROUP BY unit
      ORDER BY total DESC
      LIMIT 10
    `

    // Top 5 users this month
    const topUsers = await prisma.$queryRaw<{ name: string; photoUrl: string | null; pts: bigint }[]>`
      SELECT u.name, u."photoUrl", SUM(l.points) as pts
      FROM "PointsLedger" l
      JOIN "User" u ON u.id = l."userId"
      WHERE l."createdAt" >= ${startOfMonth} AND l.points > 0
      GROUP BY u.id, u.name, u."photoUrl"
      ORDER BY pts DESC
      LIMIT 5
    `

    // UPB (University) completions this month
    const upbCompletions = await prisma.uPBProgresso.count({
      where: { concluidoEm: { not: null, gte: startOfMonth } }
    })

    const engagementRate = totalUsers > 0 ? Math.round((activeUsers.length / totalUsers) * 100) : 0
    const completionRate = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0

    return NextResponse.json({
      engagementRate,
      completionRate,
      activeUsers: activeUsers.length,
      totalUsers,
      tasksTotal,
      tasksDone,
      upbCompletions,
      pointsByUnit: pointsByUnit.map(p => ({ unit: p.unit, total: Number(p.total) })),
      topUsers: topUsers.map(u => ({ name: u.name, photoUrl: u.photoUrl, pts: Number(u.pts) })),
    })
  } catch (error) {
    console.error('Error fetching cockpit data:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
