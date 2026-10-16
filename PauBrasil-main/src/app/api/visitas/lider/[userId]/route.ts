import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = params
  const u = session.user as any
  const canView = isSysAdmin(session.user) || u.isEmpresaAdmin === true || u.isVisitasAdmin === true || session.user.id === userId
  if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get('month') ?? undefined

  const where: any = { userId }
  if (month) {
    const [year, m] = month.split('-').map(Number)
    where.checkedInAt = { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) }
  }

  const visits = await prisma.leaderVisit.findMany({
    where,
    orderBy: { checkedInAt: 'desc' },
  })

  const byOperation: Record<string, { slug: string; name: string; count: number }> = {}
  for (const v of visits) {
    if (!byOperation[v.operationSlug]) {
      byOperation[v.operationSlug] = { slug: v.operationSlug, name: v.operationName, count: 0 }
    }
    byOperation[v.operationSlug].count++
  }

  // Obrigações do mês corrente para este líder
  const now = new Date()
  const obrigFrom = new Date(now.getFullYear(), now.getMonth(), 1)
  const obrigTo   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const obrigatorias = await prisma.visitaObrigatoria.findMany({
    where: { userId, ativo: true },
    orderBy: { operationSlug: 'asc' },
  })

  let obligations: { operationSlug: string; operationName: string; quantidadeMinima: number; visitasValidas: number; cumprida: boolean }[] = []
  if (obrigatorias.length > 0) {
    const ops = await prisma.operation.findMany({
      where: { slug: { in: obrigatorias.map(o => o.operationSlug) } },
      select: { slug: true, name: true },
    })
    const opMap = new Map(ops.map(o => [o.slug, o.name]))

    const counts = await prisma.leaderVisit.groupBy({
      by: ['operationSlug'],
      where: {
        userId,
        status: 'valid',
        checkedInAt: { gte: obrigFrom, lt: obrigTo },
        operationSlug: { in: obrigatorias.map(o => o.operationSlug) },
      },
      _count: { id: true },
    })
    const countMap = new Map(counts.map(c => [c.operationSlug, c._count.id]))

    obligations = obrigatorias.map(o => {
      const visitasValidas = countMap.get(o.operationSlug) ?? 0
      return {
        operationSlug:    o.operationSlug,
        operationName:    opMap.get(o.operationSlug) ?? o.operationSlug,
        quantidadeMinima: o.quantidadeMinima,
        visitasValidas,
        cumprida:         visitasValidas >= o.quantidadeMinima,
      }
    })
  }

  return NextResponse.json({
    visits,
    totals:      { byOperation: Object.values(byOperation).sort((a, b) => b.count - a.count) },
    obligations,
  })
}
