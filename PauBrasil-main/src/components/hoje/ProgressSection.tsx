'use client'

import { Trophy, TrendingUp } from 'lucide-react'
import { LEVEL_THRESHOLDS, getLevel, type Level } from '@/types'

interface ProgressSectionProps {
  levelProgress: number
  userPoints: number
  activeGoals: {
    title: string
    progress: number
    target: number
    type: string
  }[]
}

export function ProgressSection({
  levelProgress,
  userPoints,
  activeGoals,
}: ProgressSectionProps) {
  const level = getLevel(userPoints)
  const levels: Level[] = ['Bronze', 'Prata', 'Ouro', 'Diamante']
  const next = levels[levels.indexOf(level) + 1]
  const remaining = next ? Math.max(0, LEVEL_THRESHOLDS[next] - userPoints) : 0
  const goal = activeGoals[0]
  const goalProgress =
    goal?.target > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((goal.progress / goal.target) * 100)),
        )
      : 0
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
      <section className="portal-stat rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-5">
          <Trophy className="text-brand-400" size={25} />
          <span className="text-brand-400 text-xl font-semibold">
            {levelProgress}%
          </span>
        </div>
        <h2 className="text-foreground font-semibold text-sm">
          {next ? `Próximo nível: ${next}` : 'Nível Diamante'}
        </h2>
        <p className="text-muted-foreground text-xs mt-2 mb-5">
          {next
            ? `Faltam ${remaining.toLocaleString('pt-BR')} pontos para o próximo nível.`
            : 'Você alcançou o nível mais alto. Continue construindo sua trajetória.'}
        </p>
        <div
          role="progressbar"
          aria-label="Progresso de nível"
          aria-valuenow={levelProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 bg-accent rounded-full overflow-hidden"
        >
          <div
            className="h-full gradient-brand rounded-full"
            style={{ width: `${levelProgress}%` }}
          />
        </div>
      </section>
      <section className="portal-stat rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-5">
          <TrendingUp className="text-brand-400" size={25} />
          <span className="text-brand-400 text-xl font-semibold">
            {goal ? `${goalProgress}%` : '—'}
          </span>
        </div>
        <h2 className="text-foreground font-semibold text-sm">
          {goal ? goal.title : 'Suas metas'}
        </h2>
        <p className="text-muted-foreground text-xs mt-2 mb-5">
          {goal
            ? `${goal.progress.toLocaleString('pt-BR')} de ${goal.target.toLocaleString('pt-BR')} pontos · ${goal.type}`
            : 'Nenhuma meta ativa no momento. As metas definidas para você aparecerão aqui.'}
        </p>
        {goal && (
          <div
            role="progressbar"
            aria-label="Progresso da meta"
            aria-valuenow={goalProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 bg-accent rounded-full overflow-hidden"
          >
            <div
              className="h-full gradient-brand rounded-full"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        )}
      </section>
    </div>
  )
}
