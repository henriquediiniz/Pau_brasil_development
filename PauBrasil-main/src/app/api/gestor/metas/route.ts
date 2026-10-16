import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isGestorLevel, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isGestorLevel(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const equipe = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(isSysAdmin(actor) ? {} : { managerId: actor.id }),
    },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      functionId: true,
      units: true,
      function: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1
  const trimestre = Math.ceil(mes / 3)

  const metas = await prisma.metaPontuacao.findMany({
    where: { ativo: true, ano },
  })

  if (metas.length === 0) {
    return NextResponse.json({ equipe: [], metaGlobal: null, semMeta: equipe.length })
  }

  function resolveMetaDates(meta: (typeof metas)[0]) {
    if (meta.periodo === 'mensal') {
      const m = meta.mes ?? mes
      return { startDate: new Date(ano, m - 1, 1), endDate: new Date(ano, m, 1) }
    }
    const t = meta.trimestre ?? trimestre
    return { startDate: new Date(ano, (t - 1) * 3, 1), endDate: new Date(ano, t * 3, 1) }
  }

  // Etapa 1: resolver meta de cada membro em JS, sem queries
  const userMetas = equipe.map(user => {
    const meta = metas
      .filter(m => {
        if (m.periodo === 'mensal' && m.mes !== mes) return false
        if (m.periodo === 'trimestral' && m.trimestre !== trimestre) return false
        if (m.units.length > 0 && !m.units.some(u => user.units.includes(u))) return false
        if (m.funcaoId && m.funcaoId !== user.functionId) return false
        if (m.funcoesMeta.length > 0 && !m.funcoesMeta.includes(user.functionId ?? '')) return false
        return true
      })
      .sort((a, b) => {
        const scoreA = (a.funcaoId ? 2 : 0) + (a.units.length > 0 ? 1 : 0)
        const scoreB = (b.funcaoId ? 2 : 0) + (b.units.length > 0 ? 1 : 0)
        return scoreB - scoreA
      })[0] ?? null
    return { user, meta, ...(meta ? resolveMetaDates(meta) : { startDate: null, endDate: null }) }
  })

  // Etapa 2: agrupar usuários por faixa de datas (tipicamente 1-2 grupos)
  const rangeGroups = new Map<string, { startDate: Date; endDate: Date; userIds: string[] }>()
  for (const { user, meta, startDate, endDate } of userMetas) {
    if (!meta || !startDate || !endDate) continue
    const key = `${startDate.getTime()}:${endDate.getTime()}`
    if (!rangeGroups.has(key)) rangeGroups.set(key, { startDate, endDate, userIds: [] })
    rangeGroups.get(key)!.userIds.push(user.id)
  }

  // Etapa 3: 1 groupBy por faixa (em vez de 1 aggregate por usuário)
  const pointsMap = new Map<string, number>()
  await Promise.all(Array.from(rangeGroups.values()).map(async ({ startDate, endDate, userIds }) => {
    const rows = await prisma.pointsLedger.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: 'CONFIRMED', kind: 'EARN', createdAt: { gte: startDate, lt: endDate } },
      _sum: { points: true },
    })
    for (const row of rows) pointsMap.set(row.userId, row._sum.points ?? 0)
  }))

  // Etapa 4: montar resultado final
  const results = userMetas.map(({ user, meta }) => {
    if (!meta) return { ...user, meta: null, pontos: 0, pct: null }
    const pontos = pointsMap.get(user.id) ?? 0
    const pct = Math.min(Math.round((pontos / meta.meta) * 100), 100)
    return { ...user, meta, pontos, pct }
  })

  const comMeta = results.filter(result => result.meta !== null)
  const semMeta = results.filter(result => result.meta === null).length

  const stats = {
    atingiram: comMeta.filter(result => (result.pct ?? 0) >= 100).length,
    emAndamento: comMeta.filter(result => (result.pct ?? 0) > 0 && (result.pct ?? 0) < 100).length,
    naoIniciaram: comMeta.filter(result => (result.pct ?? 0) === 0).length,
    semMeta,
    total: equipe.length,
  }

  return NextResponse.json({ equipe: results, stats })
}
