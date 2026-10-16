'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Loader2, CheckCircle2, TrendingUp, AlertCircle, Users, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface MembroMeta {
  id: string
  name: string
  photoUrl: string | null
  function: { name: string } | null
  meta: { titulo: string; meta: number; periodo: string } | null
  pontos: number
  pct: number | null
}

interface Stats {
  atingiram: number
  emAndamento: number
  naoIniciaram: number
  semMeta: number
  total: number
}

function PctBar({ pct }: { pct: number }) {
  const cor = pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : pct > 0 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex-1">
      <motion.div className={`h-full rounded-full ${cor}`}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
    </div>
  )
}

function Avatar({ user }: { user: { name: string; photoUrl: string | null } }) {
  return (
    <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-brand-500/20 flex items-center justify-center">
      {user.photoUrl
        ? <Image src={user.photoUrl} alt={user.name} width={36} height={36} className="w-full h-full object-cover" />
        : <span className="text-sm font-bold text-white">{user.name[0]}</span>
      }
    </div>
  )
}

export default function GestorMetasPage() {
  const [equipe, setEquipe] = useState<MembroMeta[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | '100' | 'parcial' | 'zerado' | 'semMeta'>('todos')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/gestor/metas')
    if (res.ok) {
      const d = await res.json()
      setEquipe(d.equipe ?? [])
      setStats(d.stats ?? null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const filtered = equipe.filter(m => {
    if (filtro === 'todos')    return true
    if (filtro === '100')      return (m.pct ?? 0) >= 100
    if (filtro === 'parcial')  return (m.pct ?? 0) > 0 && (m.pct ?? 0) < 100
    if (filtro === 'zerado')   return m.meta !== null && (m.pct ?? 0) === 0
    if (filtro === 'semMeta')  return m.meta === null
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Metas da Equipe</h1>
          <p className="text-slate-400 text-sm capitalize mt-0.5">{hoje}</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </motion.div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : !stats ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-12 text-center">
          <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Nenhuma meta ativa no momento</p>
          <p className="text-slate-600 text-sm mt-1">Configure metas em Admin → Metas de Pontuação</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Atingiram a meta', value: stats.atingiram, total: stats.total,
                icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20',
                key: '100' as const,
              },
              {
                label: 'Em andamento', value: stats.emAndamento, total: stats.total,
                icon: TrendingUp, color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20',
                key: 'parcial' as const,
              },
              {
                label: 'Não iniciaram', value: stats.naoIniciaram, total: stats.total,
                icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20',
                key: 'zerado' as const,
              },
              {
                label: 'Sem meta', value: stats.semMeta, total: stats.total,
                icon: Users, color: 'text-slate-400', bg: 'bg-white/5 border-white/10',
                key: 'semMeta' as const,
              },
            ].map(card => (
              <button key={card.label}
                onClick={() => setFiltro(filtro === card.key ? 'todos' : card.key)}
                className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${card.bg} ${filtro === card.key ? 'ring-2 ring-white/20' : ''}`}>
                <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
                <div className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
              </button>
            ))}
          </motion.div>

          {/* Team list */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-white">
                  {filtro === 'todos'
                    ? `Equipe — ${equipe.length} pessoa${equipe.length !== 1 ? 's' : ''}`
                    : `Filtrado — ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              {filtro !== 'todos' && (
                <button onClick={() => setFiltro('todos')} className="text-xs text-slate-500 hover:text-white transition-colors">
                  Limpar filtro ×
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">Nenhum colaborador neste filtro.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {filtered
                  .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))
                  .map((membro, i) => (
                    <motion.div key={membro.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                      <Avatar user={membro} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{membro.name}</span>
                          {membro.function && (
                            <span className="text-xs text-slate-600 truncate hidden sm:block">{membro.function.name}</span>
                          )}
                        </div>
                        {membro.meta === null ? (
                          <p className="text-xs text-slate-600 mt-0.5">Sem meta configurada</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mt-1.5">
                              <PctBar pct={membro.pct ?? 0} />
                              <span className={`text-xs font-medium shrink-0 tabular-nums ${
                                (membro.pct ?? 0) >= 100 ? 'text-emerald-400'
                                : (membro.pct ?? 0) >= 50 ? 'text-brand-400'
                                : (membro.pct ?? 0) > 0 ? 'text-yellow-400'
                                : 'text-red-400'
                              }`}>
                                {membro.pontos.toLocaleString('pt-BR')}/{membro.meta.meta.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-0.5">{membro.meta.titulo}</p>
                          </>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {membro.meta === null ? null
                          : (membro.pct ?? 0) >= 100 ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          : (membro.pct ?? 0) === 0 ? <AlertCircle className="w-4 h-4 text-red-400/60" />
                          : <span className="text-xs font-bold text-brand-400">{membro.pct}%</span>
                        }
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
