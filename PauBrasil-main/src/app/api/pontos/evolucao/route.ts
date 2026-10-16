import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  // ── Últimas 8 semanas de pontos ──────────────────────────────────────────
  const oitoSemanasAtras = new Date()
  oitoSemanasAtras.setDate(oitoSemanasAtras.getDate() - 56)
  oitoSemanasAtras.setHours(0, 0, 0, 0)

  const ledger = await prisma.pointsLedger.findMany({
    where: {
      userId,
      status: 'CONFIRMED',
      kind: 'EARN',
      createdAt: { gte: oitoSemanasAtras },
    },
    select: { points: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Agrupa por semana (ISO week starting Monday)
  function getWeekStart(d: Date): string {
    const date = new Date(d)
    const day = date.getDay()
    const diff = day === 0 ? -6 : 1 - day
    date.setDate(date.getDate() + diff)
    date.setHours(0, 0, 0, 0)
    return date.toISOString().slice(0, 10)
  }

  const semanaMap: Record<string, number> = {}
  for (const entry of ledger) {
    const key = getWeekStart(entry.createdAt)
    semanaMap[key] = (semanaMap[key] ?? 0) + entry.points
  }

  // Garante 8 semanas mesmo sem dados
  const semanas: { semana: string; pts: number }[] = []
  const hoje = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i * 7)
    const key = getWeekStart(d)
    semanas.push({ semana: key, pts: semanaMap[key] ?? 0 })
  }

  // ── Streak de dias com ao menos 1 tarefa aprovada ────────────────────────
  // 366 days is enough to detect the highest badge (100-day streak) and record display
  const umAnoAtras = new Date()
  umAnoAtras.setDate(umAnoAtras.getDate() - 366)
  umAnoAtras.setHours(0, 0, 0, 0)

  const instancias = await prisma.taskInstance.findMany({
    where: {
      userId,
      status: { in: ['APPROVED', 'DONE'] },
      updatedAt: { gte: umAnoAtras },
    },
    select: { updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const diasSet = new Set<string>()
  for (const inst of instancias) {
    diasSet.add(inst.updatedAt.toISOString().slice(0, 10))
  }

  // Calcula streak atual
  let streak = 0
  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  // Começa pelo dia mais recente (hoje ou ontem)
  let cur = diasSet.has(todayStr) ? todayStr : diasSet.has(yesterdayStr) ? yesterdayStr : null
  if (cur) {
    const curDate = new Date(cur)
    while (diasSet.has(curDate.toISOString().slice(0, 10))) {
      streak++
      curDate.setDate(curDate.getDate() - 1)
    }
  }

  // Streak recorde
  const diasOrdenados = Array.from(diasSet).sort().reverse()
  let maxStreak = 0
  let tempStreak = 0
  let prev: Date | null = null
  for (const dStr of diasOrdenados) {
    const d = new Date(dStr)
    if (!prev) {
      tempStreak = 1
    } else {
      const diff = Math.round((prev.getTime() - d.getTime()) / 86400000)
      tempStreak = diff === 1 ? tempStreak + 1 : 1
    }
    maxStreak = Math.max(maxStreak, tempStreak)
    prev = d
  }

  return NextResponse.json({ semanas, streak, streakRecord: maxStreak })
}
