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
  const userId        = searchParams.get('userId') ?? undefined
  const operationSlug = searchParams.get('operationSlug') ?? undefined
  const month         = searchParams.get('month') ?? undefined
  const status        = searchParams.get('status') ?? undefined
  const page          = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit         = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip          = (page - 1) * limit

  const where: any = {}
  if (userId)        where.userId        = userId
  if (operationSlug) where.operationSlug = operationSlug
  if (status)        where.status        = status
  if (month) {
    const [year, m] = month.split('-').map(Number)
    where.checkedInAt = {
      gte: new Date(year, m - 1, 1),
      lt:  new Date(year, m,     1),
    }
  }

  // Leaders dropdown excludes userId filter so the list stays useful when a leader is selected
  const leadersWhere: any = {}
  if (operationSlug) leadersWhere.operationSlug = operationSlug
  if (status)        leadersWhere.status        = status
  if (month)         leadersWhere.checkedInAt   = where.checkedInAt

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [total, visits, thisMonth, uniqueLeaders] = await Promise.all([
    prisma.leaderVisit.count({ where }),
    prisma.leaderVisit.findMany({
      where,
      orderBy: { checkedInAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, leaderTitle: true, photoUrl: true } },
      },
    }),
    prisma.leaderVisit.count({ where: { checkedInAt: { gte: startOfMonth } } }),
    prisma.leaderVisit.findMany({
      where: leadersWhere,
      select: {
        user: { select: { id: true, name: true, leaderTitle: true, photoUrl: true } },
      },
      distinct: ['userId'],
      orderBy: { checkedInAt: 'desc' },
    }),
  ])

  const leaders = uniqueLeaders.map(r => r.user)

  return NextResponse.json({
    visits,
    total,
    leaders,
    summary: { total, thisMonth, byOperation: [], byLeader: [] },
  })
}
