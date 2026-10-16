'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Trophy } from 'lucide-react'
import type { Badge, BadgeCategoria } from '@/lib/badges'

const CATEGORIAS: { key: BadgeCategoria; label: string; emoji: string }[] = [
  { key: 'tarefas',      label: 'Tarefas',          emoji: '✅' },
  { key: 'pontos',       label: 'Pontos',            emoji: '⭐' },
  { key: 'universidade', label: 'Universidade PB',   emoji: '🎓' },
  { key: 'consistencia', label: 'Consistência',      emoji: '🔥' },
]

const CAT_COLORS: Record<BadgeCategoria, string> = {
  tarefas:      'border-brand-500/30 bg-brand-500/5',
  pontos:       'border-yellow-500/30 bg-yellow-500/5',
  universidade: 'border-purple-500/30 bg-purple-500/5',
  consistencia: 'border-orange-500/30 bg-orange-500/5',
}

const CAT_ACCENT: Record<BadgeCategoria, string> = {
  tarefas:      'from-brand-500 to-cyan-500',
  pontos:       'from-yellow-500 to-amber-400',
  universidade: 'from-purple-500 to-indigo-500',
  consistencia: 'from-orange-500 to-red-500',
}

const CAT_HINT: Record<BadgeCategoria, string> = {
  tarefas:      'Complete tarefas diárias para desbloquear',
  pontos:       'Acumule mais pontos para desbloquear',
  universidade: 'Assista episódios da UPB para desbloquear',
  consistencia: 'Mantenha sua streak para desbloquear',
}

export default function ConquistasPage() {
  const router = useRouter()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/conquistas')
      .then(r => r.json())
      .then(data => { setBadges(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const earned  = badges.filter(b => b.ganho)
  const total   = badges.length
  const pct     = total > 0 ? (earned.length / total) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/app/inicio')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Minhas Conquistas
          </h1>
          <p className="text-slate-500 text-sm">
            {loading ? '...' : `${earned.length} de ${total} desbloqueadas`}
          </p>
        </div>
      </div>

      {/* Barra de progresso geral */}
      {!loading && total > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white/3 border border-white/8 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">Progresso geral</span>
            <span className="text-sm font-bold text-brand-400">{pct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-yellow-400"
            />
          </div>
          <div className="flex gap-6 mt-3 text-xs text-slate-500">
            <span><span className="text-white font-bold">{earned.length}</span> desbloqueadas</span>
            <span><span className="text-slate-400 font-bold">{total - earned.length}</span> por desbloquear</span>
          </div>
        </motion.div>
      )}

      {/* Badges por categoria */}
      {CATEGORIAS.map(({ key, label, emoji }, ci) => {
        const catBadges = badges.filter(b => b.categoria === key)
        if (catBadges.length === 0) return null
        const catEarned = catBadges.filter(b => b.ganho).length

        return (
          <motion.div key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + ci * 0.07 }}
            className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{emoji}</span> {label}
              </h2>
              <span className="text-xs text-slate-500">{catEarned}/{catBadges.length}</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden mt-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(catEarned / catBadges.length) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${CAT_ACCENT[key]}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catBadges.map((b, i) => (
                <motion.div key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + ci * 0.07 + i * 0.04 }}
                  className={`relative rounded-2xl border p-4 transition-all
                    ${b.ganho
                      ? `${CAT_COLORS[key]} shadow-sm`
                      : 'border-white/8 bg-white/2 grayscale opacity-60'
                    }`}>

                  {/* Barra de acento no topo */}
                  {b.ganho && (
                    <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${CAT_ACCENT[key]}`} />
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-3xl ${b.ganho ? '' : 'grayscale'}`}>{b.emoji}</span>
                    {!b.ganho && <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />}
                    {b.ganho && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-medium">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white leading-tight">{b.nome}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{b.descricao}</p>
                  {!b.ganho && (
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">{CAT_HINT[b.categoria]}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )
      })}

      {/* Empty state */}
      {!loading && badges.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Nenhuma conquista encontrada.</p>
        </div>
      )}
    </div>
  )
}
