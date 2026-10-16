import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user

  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const trimestre = Math.ceil(mes / 3)

  // Find active metas applicable to this user
  const allMetas = await prisma.metaPontuacao.findMany({
    where: { ativo: true, ano },
  })

  // Filter in-memory: supports array fields (units, funcoesMeta)
  const metas = allMetas.filter(m => {
    if (m.units.length > 0 && !m.units.some(u => (user.units ?? []).includes(u))) return false
    if (m.funcaoId && m.funcaoId !== user.functionId) return false
    if (m.funcoesMeta.length > 0 && !m.funcoesMeta.includes(user.functionId ?? '')) return false
    return true
  })

  if (metas.length === 0) return NextResponse.json(null)

  // Pick most specific and matching current period
  const ranked = metas
    .filter(m => {
      if (m.periodo === 'mensal') return m.mes === mes
      if (m.periodo === 'trimestral') return m.trimestre === trimestre
      return false
    })
    .sort((a, b) => {
      const sa = (a.funcaoId ? 2 : 0) + (a.units.length > 0 ? 1 : 0) + (a.funcoesMeta.length > 0 ? 1 : 0)
      const sb = (b.funcaoId ? 2 : 0) + (b.units.length > 0 ? 1 : 0) + (b.funcoesMeta.length > 0 ? 1 : 0)
      return sb - sa
    })

  if (ranked.length === 0) return NextResponse.json(null)
  const meta = ranked[0]

  // Calculate period date range
  let startDate: Date
  let endDate: Date
  if (meta.periodo === 'mensal') {
    const m = meta.mes ?? mes
    startDate = new Date(ano, m - 1, 1)
    endDate = new Date(ano, m, 1)
  } else {
    const t = meta.trimestre ?? trimestre
    startDate = new Date(ano, (t - 1) * 3, 1)
    endDate = new Date(ano, t * 3, 1)
  }

  // Sum confirmed points in period
  const result = await prisma.pointsLedger.aggregate({
    where: {
      userId: user.id,
      status: 'CONFIRMED',
      kind: 'EARN',
      createdAt: { gte: startDate, lt: endDate },
    },
    _sum: { points: true },
  })

  const pontos = result._sum?.points ?? 0
  const pct = Math.min(Math.round((pontos / meta.meta) * 100), 100)

  return NextResponse.json({ meta, pontos, pct, startDate, endDate })
}
