import { prisma } from './prisma'

export type BadgeCategoria = 'tarefas' | 'pontos' | 'universidade' | 'consistencia'

export interface Badge {
  id: string
  nome: string
  descricao: string
  emoji: string
  ganho: boolean
  categoria: BadgeCategoria
}

export async function computeBadges(userId: string): Promise<Badge[]> {
  const [
    totalAprovadas,
    confirmedPts,
    certificados,
    quizTentativas,
    streakDias,
  ] = await Promise.all([
    prisma.taskInstance.count({ where: { userId, status: 'APPROVED' } }),
    prisma.pointsLedger.aggregate({
      where: { userId, status: 'CONFIRMED', kind: 'EARN' },
      _sum: { points: true },
    }),
    prisma.uPBCertificado.count({ where: { userId } }),
    prisma.uPBQuizTentativa.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { temporadaId: true, aprovado: true },
    }),
    getStreakDias(userId),
  ])

  const pts = confirmedPts._sum.points ?? 0

  const primeirasTentativas: Record<string, boolean> = {}
  for (const t of quizTentativas) {
    if (!(t.temporadaId in primeirasTentativas)) {
      primeirasTentativas[t.temporadaId] = t.aprovado
    }
  }
  const aprovadoDePrimeira = Object.values(primeirasTentativas).some(v => v)

  const badges: Badge[] = [
    // ── Tarefas ───────────────────────────────────────────────
    {
      id: 'primeiros_passos',
      nome: 'Primeiros Passos',
      descricao: 'Concluiu sua primeira tarefa',
      emoji: '🚀',
      categoria: 'tarefas',
      ganho: totalAprovadas >= 1,
    },
    {
      id: 'veterano',
      nome: 'Veterano',
      descricao: '50 tarefas aprovadas',
      emoji: '🎯',
      categoria: 'tarefas',
      ganho: totalAprovadas >= 50,
    },
    {
      id: 'centuriao',
      nome: 'Centurião',
      descricao: '100 tarefas aprovadas',
      emoji: '🏆',
      categoria: 'tarefas',
      ganho: totalAprovadas >= 100,
    },
    {
      id: 'trezentas',
      nome: 'Inabalável',
      descricao: '300 tarefas aprovadas',
      emoji: '🛡️',
      categoria: 'tarefas',
      ganho: totalAprovadas >= 300,
    },
    // ── Pontos ────────────────────────────────────────────────
    {
      id: 'mil_pontos',
      nome: 'Mil Pontos',
      descricao: '1.000 pontos confirmados',
      emoji: '⭐',
      categoria: 'pontos',
      ganho: pts >= 1000,
    },
    {
      id: 'cinco_mil',
      nome: 'Elite',
      descricao: '5.000 pontos confirmados',
      emoji: '💎',
      categoria: 'pontos',
      ganho: pts >= 5000,
    },
    {
      id: 'dez_mil',
      nome: 'Lenda',
      descricao: '10.000 pontos confirmados',
      emoji: '👑',
      categoria: 'pontos',
      ganho: pts >= 10000,
    },
    {
      id: 'vinte_cinco_mil',
      nome: 'Campeão',
      descricao: '25.000 pontos confirmados',
      emoji: '🌟',
      categoria: 'pontos',
      ganho: pts >= 25000,
    },
    // ── Universidade PB ───────────────────────────────────────
    {
      id: 'estudante',
      nome: 'Estudante',
      descricao: 'Primeiro certificado UPB',
      emoji: '🎓',
      categoria: 'universidade',
      ganho: certificados >= 1,
    },
    {
      id: 'academico',
      nome: 'Acadêmico',
      descricao: '3 certificados UPB',
      emoji: '📚',
      categoria: 'universidade',
      ganho: certificados >= 3,
    },
    {
      id: 'mestre_upb',
      nome: 'Mestre UPB',
      descricao: '5 certificados UPB',
      emoji: '🏛️',
      categoria: 'universidade',
      ganho: certificados >= 5,
    },
    {
      id: 'aprovado_primeira',
      nome: 'De Primeira',
      descricao: 'Aprovado no quiz UPB na primeira tentativa',
      emoji: '✨',
      categoria: 'universidade',
      ganho: aprovadoDePrimeira,
    },
    // ── Consistência ──────────────────────────────────────────
    {
      id: 'semana_chamas',
      nome: 'Semana em Chamas',
      descricao: '7 dias seguidos com tarefa concluída',
      emoji: '🔥',
      categoria: 'consistencia',
      ganho: streakDias >= 7,
    },
    {
      id: 'constancia',
      nome: 'Constância',
      descricao: '30 dias seguidos com tarefa concluída',
      emoji: '💪',
      categoria: 'consistencia',
      ganho: streakDias >= 30,
    },
    {
      id: 'incansavel',
      nome: 'Incansável',
      descricao: '100 dias seguidos com tarefa concluída',
      emoji: '🏅',
      categoria: 'consistencia',
      ganho: streakDias >= 100,
    },
  ]

  return badges
}

async function getStreakDias(userId: string): Promise<number> {
  // Longest badge is 100 days — no need to look further back
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 101)
  cutoff.setHours(0, 0, 0, 0)

  const instancias = await prisma.taskInstance.findMany({
    where: { userId, status: { in: ['APPROVED', 'DONE'] }, updatedAt: { gte: cutoff } },
    select: { updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const diasSet = new Set<string>()
  for (const inst of instancias) {
    diasSet.add(inst.updatedAt.toISOString().slice(0, 10))
  }

  let streak = 0
  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  let cur = diasSet.has(todayStr) ? todayStr : diasSet.has(yesterdayStr) ? yesterdayStr : null
  if (!cur) return 0

  const curDate = new Date(cur)
  while (diasSet.has(curDate.toISOString().slice(0, 10))) {
    streak++
    curDate.setDate(curDate.getDate() - 1)
  }

  return streak
}
