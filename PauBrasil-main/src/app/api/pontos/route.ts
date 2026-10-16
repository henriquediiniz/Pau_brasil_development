import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserBalance } from '@/lib/points'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const REF_TYPE_LABELS: Record<string, string> = {
  TaskInstance:    'Tarefa diária',
  AdhocTask:       'Atividade avulsa',
  UPBCertificado:  'Certificado UPB',
  UPBQuiz:         'Prova UPB',
  Convite:         'Reunião/Convite',
  Ajuste:          'Ajuste manual',
  Reversal:        'Estorno',
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const mes   = searchParams.get('mes')   // 'YYYY-MM'
  const skip  = parseInt(searchParams.get('skip') ?? '0')
  const take  = 30

  const balance = await getUserBalance(userId)

  // Build date filter
  let dateFilter: { gte?: Date; lt?: Date } | undefined
  if (mes) {
    const [y, m] = mes.split('-').map(Number)
    dateFilter = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) }
  }

  const ledger = await prisma.pointsLedger.findMany({
    where: { userId, ...(dateFilter ? { createdAt: dateFilter } : {}) },
    orderBy: { createdAt: 'desc' },
    skip,
    take: take + 1, // fetch one extra to know if there's a next page
  })

  const hasMore = ledger.length > take
  const entries = ledger.slice(0, take).map(e => ({
    ...e,
    label: e.note ?? (e.refType ? REF_TYPE_LABELS[e.refType] : null) ?? (
      e.kind === 'EARN'     ? 'Pontos ganhos' :
      e.kind === 'REDEEM'   ? 'Resgate de recompensa' :
      e.kind === 'ADJUST'   ? 'Ajuste de pontos' :
      'Estorno'
    ),
  }))

  // Available months — derive from first and last ledger entry instead of loading all rows
  const [oldest, newest] = await Promise.all([
    prisma.pointsLedger.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.pointsLedger.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ])
  const meses: string[] = []
  if (oldest && newest) {
    const cursor = new Date(newest.createdAt)
    const stop   = new Date(oldest.createdAt)
    cursor.setDate(1); stop.setDate(1)
    while (cursor >= stop) {
      meses.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      cursor.setMonth(cursor.getMonth() - 1)
    }
  }

  return NextResponse.json({ balance, ledger: entries, hasMore, skip, meses })
}
