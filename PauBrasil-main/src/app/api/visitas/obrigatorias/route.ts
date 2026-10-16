import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const obrigatorias = await prisma.visitaObrigatoria.findMany({
    where: { userId, ativo: true },
    orderBy: { operationSlug: 'asc' },
  })

  if (obrigatorias.length === 0) return NextResponse.json([])

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
      checkedInAt: { gte: from, lt: to },
      operationSlug: { in: obrigatorias.map(o => o.operationSlug) },
    },
    _count: { id: true },
  })
  const countMap = new Map(counts.map(c => [c.operationSlug, c._count.id]))

  const result = obrigatorias.map(o => {
    const visitasValidas = countMap.get(o.operationSlug) ?? 0
    return {
      id:               o.id,
      operationSlug:    o.operationSlug,
      operationName:    opMap.get(o.operationSlug) ?? o.operationSlug,
      quantidadeMinima: o.quantidadeMinima,
      visitasValidas,
      cumprida:         visitasValidas >= o.quantidadeMinima,
    }
  })

  return NextResponse.json(result)
}
