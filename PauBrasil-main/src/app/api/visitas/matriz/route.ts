import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const u = session.user as any
  if (!isSysAdmin(session.user) && !u.isVisitasAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get('month') ?? undefined

  const [operations, users] = await Promise.all([
    prisma.operation.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: { OR: [{ isItinerantLeader: true }, { leaderVisits: { some: {} } }] },
      select: { id: true, name: true, leaderTitle: true, photoUrl: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const where: any = { userId: { in: users.map(u => u.id) } }
  if (month) {
    const [year, m] = month.split('-').map(Number)
    where.checkedInAt = { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) }
  }

  const allVisits = await prisma.leaderVisit.findMany({
    where,
    orderBy: { checkedInAt: 'desc' },
    select: { userId: true, operationSlug: true, checkedInAt: true, status: true },
  })

  // Build visitMap: first occurrence per (userId, operationSlug) = most recent (sorted desc)
  const visitMap: Record<string, Record<string, { date: string; status: string }>> = {}
  for (const visit of allVisits) {
    if (!visitMap[visit.userId]) visitMap[visit.userId] = {}
    if (!visitMap[visit.userId][visit.operationSlug]) {
      visitMap[visit.userId][visit.operationSlug] = {
        date: visit.checkedInAt.toISOString(),
        status: visit.status,
      }
    }
  }

  const rows = users.map(user => ({
    user,
    byOp: Object.fromEntries(
      operations.map(op => [op.slug, visitMap[user.id]?.[op.slug] ?? null])
    ),
  }))

  return NextResponse.json({ operations, rows })
}
