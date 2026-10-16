'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CheckCircle2, Clock, AlertCircle, Loader2,
  Lock, Star, TrendingUp, RefreshCw, Shield,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface MembroEquipe {
  id: string
  name: string
  photoUrl: string | null
  funcao: string | null
  total: number
  concluidas: number
  pct: number | null
  semTarefas: boolean
}

interface Stats {
  total: number
  todos100: number
  parcial: number
  zerado: number
  semTarefas: number
  aprovacoesPendentes: number
  adhocPendentes: number
  bloqueadas: number
}

function PctBar({ pct }: { pct: number }) {
  const cor = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : pct > 0 ? 'bg-yellow-400' : 'bg-red-500'
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

export default function GestorDashboardPage() {
  const [equipe, setEquipe]   = useState<MembroEquipe[]>([])
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState<'todos' | 'zerado' | 'parcial' | '100'>('todos')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/gestor/dashboard')
    if (res.ok) {
      const d = await res.json()
      setEquipe(d.equipe)
      setStats(d.stats)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = equipe.filter(m => {
    if (filtro === 'todos')  return true
    if (filtro === '100')    return m.pct === 100
    if (filtro === 'parcial') return (m.pct ?? 0) > 0 && m.pct! < 100
    if (filtro === 'zerado') return !m.semTarefas && m.pct === 0
    return true
  })

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dashboard da Equipe</h1>
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
      ) : stats && (
        <>
          {/* Cards de resumo */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Concluíram tudo',
                value: stats.todos100,
                total: stats.total,
                icon: CheckCircle2,
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10 border-emerald-400/20',
                filtro: '100' as const,
              },
              {
                label: 'Em andamento',
                value: stats.parcial,
                total: stats.total,
                icon: TrendingUp,
                color: 'text-brand-400',
                bg: 'bg-brand-400/10 border-brand-400/20',
                filtro: 'parcial' as const,
              },
              {
                label: 'Não iniciaram',
                value: stats.zerado,
                total: stats.total,
                icon: AlertCircle,
                color: 'text-red-400',
                bg: 'bg-red-400/10 border-red-400/20',
                filtro: 'zerado' as const,
              },
              {
                label: 'Sem tarefas hoje',
                value: stats.semTarefas,
                total: stats.total,
                icon: Clock,
                color: 'text-slate-400',
                bg: 'bg-white/5 border-white/10',
                filtro: 'todos' as const,
              },
            ].map(card => (
              <button key={card.label} onClick={() => setFiltro(filtro === card.filtro ? 'todos' : card.filtro)}
                className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${card.bg} ${filtro === card.filtro ? 'ring-2 ring-white/20' : ''}`}>
                <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
                <div className={`text-2xl font-display font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
              </button>
            ))}
          </motion.div>

          {/* Alertas de ação */}
          {(stats.aprovacoesPendentes > 0 || stats.adhocPendentes > 0 || stats.bloqueadas > 0) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {stats.aprovacoesPendentes > 0 && (
                <Link href="/gestor/aprovacoes"
                  className="flex items-center gap-3 rounded-2xl bg-yellow-400/5 border border-yellow-400/20 p-4 hover:bg-yellow-400/10 transition-colors">
                  <Shield className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{stats.aprovacoesPendentes} aprovação{stats.aprovacoesPendentes !== 1 ? 'ões' : ''} pendente{stats.aprovacoesPendentes !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500">Tarefas aguardando sua aprovação</p>
                  </div>
                </Link>
              )}
              {stats.adhocPendentes > 0 && (
                <Link href="/gestor/aprovacoes"
                  className="flex items-center gap-3 rounded-2xl bg-indigo-400/5 border border-indigo-400/20 p-4 hover:bg-indigo-400/10 transition-colors">
                  <Star className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{stats.adhocPendentes} atividade{stats.adhocPendentes !== 1 ? 's' : ''} avulsa{stats.adhocPendentes !== 1 ? 's' : ''} para pontuar</p>
                    <p className="text-xs text-slate-500">Aguardando atribuição de pontos</p>
                  </div>
                </Link>
              )}
              {stats.bloqueadas > 0 && (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-700/30 border border-white/10 p-4">
                  <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{stats.bloqueadas} tarefa{stats.bloqueadas !== 1 ? 's' : ''} bloqueada{stats.bloqueadas !== 1 ? 's' : ''} hoje</p>
                    <p className="text-xs text-slate-500">Aguardando encadeamento de tarefas</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Lista da equipe */}
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-medium text-white">
                  {filtro === 'todos' ? `Equipe — ${equipe.length} pessoa${equipe.length !== 1 ? 's' : ''}` : `Filtrado — ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
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
                {filtered.map((membro, i) => (
                  <motion.div key={membro.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/2 transition-colors">
                    <Avatar user={membro} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{membro.name}</span>
                        {membro.funcao && (
                          <span className="text-xs text-slate-600 truncate hidden sm:block">{membro.funcao}</span>
                        )}
                      </div>
                      {membro.semTarefas ? (
                        <p className="text-xs text-slate-600 mt-0.5">Sem tarefas configuradas para hoje</p>
                      ) : (
                        <div className="flex items-center gap-2 mt-1.5">
                          <PctBar pct={membro.pct ?? 0} />
                          <span className={`text-xs font-medium shrink-0 ${
                            membro.pct === 100 ? 'text-emerald-400'
                            : (membro.pct ?? 0) >= 50 ? 'text-brand-400'
                            : (membro.pct ?? 0) > 0 ? 'text-yellow-400'
                            : 'text-red-400'
                          }`}>
                            {membro.concluidas}/{membro.total}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {membro.pct === 100 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : membro.pct === 0 && !membro.semTarefas ? (
                        <AlertCircle className="w-4 h-4 text-red-400/60" />
                      ) : membro.semTarefas ? (
                        <Clock className="w-4 h-4 text-slate-600" />
                      ) : (
                        <span className="text-xs font-bold text-brand-400">{membro.pct}%</span>
                      )}
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
