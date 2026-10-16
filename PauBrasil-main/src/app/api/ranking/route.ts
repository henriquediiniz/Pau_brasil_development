import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRanking, getRankingFiltros } from '@/lib/points'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const period = (req.nextUrl.searchParams.get('period') ?? 'monthly') as 'daily' | 'weekly' | 'monthly'
  const unit = req.nextUrl.searchParams.get('unit') ?? undefined
  const funcaoId = req.nextUrl.searchParams.get('funcaoId') ?? undefined
  const withFiltros = req.nextUrl.searchParams.get('filtros') === '1'

  const [ranking, filtros] = await Promise.all([
    getRanking(period, unit, funcaoId),
    withFiltros ? getRankingFiltros() : Promise.resolve(null),
  ])

  return NextResponse.json(withFiltros ? { ranking, filtros } : ranking)
}
