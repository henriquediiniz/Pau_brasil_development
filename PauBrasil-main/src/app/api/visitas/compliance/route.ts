import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function canView(user: any) {
  return isSysAdmin(user) || user?.isVisitasAdmin === true
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canView(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const monthParam = req.nextUrl.searchParams.get('month')
  let from: Date, to: Date, monthStr: string
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    from = new Date(y, m - 1, 1)
    to   = new Date(y, m, 1)
    monthStr = monthParam
  } else {
    const now = new Date()
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to   = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const obrigatorias = await prisma.visitaObrigatoria.findMany({
    where: { ativo: true },
    include: { user: { select: { id: true, name: true, leaderTitle: true } } },
    orderBy: [{ user: { name: 'asc' } }, { operationSlug: 'asc' }],
  })

  if (obrigatorias.length === 0) {
    return NextResponse.json({ month: monthStr, rows: [] })
  }

  const ops = await prisma.operation.findMany({
    select: { slug: true, name: true },
  })
  const opMap = new Map(ops.map(o => [o.slug, o.name]))

  const userIds = Array.from(new Set(obrigatorias.map(o => o.userId)))
  const counts = await prisma.leaderVisit.groupBy({
    by: ['userId', 'operationSlug'],
    where: {
      userId:        { in: userIds },
      status:        'valid',
      checkedInAt:   { gte: from, lt: to },
    },
    _count: { id: true },
  })
  const countMap = new Map(counts.map(c => [`${c.userId}|${c.operationSlug}`, c._count.id]))

  const byUser = new Map<string, {
    user: { id: string; name: string; leaderTitle: string | null }
    obligations: { operationSlug: string; operationName: string; quantidadeMinima: number; visitasValidas: number; cumprida: boolean }[]
  }>()

  for (const o of obrigatorias) {
    if (!byUser.has(o.userId)) {
      byUser.set(o.userId, { user: o.user, obligations: [] })
    }
    const visitasValidas = countMap.get(`${o.userId}|${o.operationSlug}`) ?? 0
    byUser.get(o.userId)!.obligations.push({
      operationSlug:    o.operationSlug,
      operationName:    opMap.get(o.operationSlug) ?? o.operationSlug,
      quantidadeMinima: o.quantidadeMinima,
      visitasValidas,
      cumprida:         visitasValidas >= o.quantidadeMinima,
    })
  }

  const rows = Array.from(byUser.values()).map(({ user, obligations }) => ({
    user,
    obligations,
    totalObrigacoes: obligations.length,
    totalCumpridas:  obligations.filter(o => o.cumprida).length,
  }))

  return NextResponse.json({ month: monthStr, rows })
}
