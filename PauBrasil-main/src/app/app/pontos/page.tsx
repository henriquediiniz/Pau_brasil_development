'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Coins, TrendingUp, TrendingDown, RotateCcw, Loader2, Star, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getLevel, LEVEL_COLORS, LEVEL_BG, LEVEL_THRESHOLDS } from '@/types'

interface LedgerEntry {
  id: string
  kind: 'EARN' | 'REDEEM' | 'ADJUST' | 'REVERSAL'
  status: 'CONFIRMED' | 'PENDING'
  points: number
  label: string
  refType?: string | null
  createdAt: string
}

interface Balance { confirmed: number; pending: number; total: number }

const KIND_CONFIG = {
  EARN:     { icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  REDEEM:   { icon: TrendingDown, color: 'text-rose-400',    bg: 'bg-rose-400/10' },
  ADJUST:   { icon: Coins,        color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  REVERSAL: { icon: RotateCcw,    color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
}

const MESES_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

function formatMes(ym: string) {
  const [y, m] = ym.split('-')
  return `${MESES_LABELS[m] ?? m}/${y}`
}

export default function PontosPage() {
  const [balance, setBalance]   = useState<Balance | null>(null)
  const [ledger, setLedger]     = useState<LedgerEntry[]>([])
  const [hasMore, setHasMore]   = useState(false)
  const [meses, setMeses]       = useState<string[]>([])
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter]     = useState<'all' | 'EARN' | 'REDEEM'>('all')
  const [mesFiltro, setMesFiltro] = useState('')
  const skipRef = useRef(0)

  const fetchLedger = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); skipRef.current = 0 } else setLoadingMore(true)

    const params = new URLSearchParams({ skip: String(skipRef.current) })
    if (mesFiltro) params.set('mes', mesFiltro)

    const res = await fetch(`/api/pontos?${params}`)
    const data = await res.json()

    if (reset) {
      setBalance(data.balance)
      setLedger(data.ledger)
      setMeses(data.meses ?? [])
      setHasMore(data.hasMore)
    } else {
      setLedger(prev => [...prev, ...data.ledger])
      setHasMore(data.hasMore)
    }

    skipRef.current += data.ledger.length
    if (reset) setLoading(false); else setLoadingMore(false)
  }, [mesFiltro])

  useEffect(() => { fetchLedger(true) }, [fetchLedger])

  const level = balance ? getLevel(balance.confirmed) : 'Bronze'
  const nextLevels = { Bronze: 'Prata', Prata: 'Ouro', Ouro: 'Diamante', Diamante: null } as const
  const nextLevel = nextLevels[level]
  const currentThreshold = LEVEL_THRESHOLDS[level]
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : LEVEL_THRESHOLDS['Diamante']
  const progress = nextLevel
    ? Math.min(100, Math.round(((balance?.confirmed ?? 0) - currentThreshold) / (nextThreshold - currentThreshold) * 100))
    : 100

  const filtered = filter === 'all' ? ledger : ledger.filter(e => e.kind === filter)

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Saldo card */}
      <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
      </div>
      {/* Ledger list */}
      <div className="rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-40 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-10 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Minha Carteira</h1>
        <p className="text-slate-400 text-sm">Saldo e extrato de pontos</p>
      </div>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="portal-wallet relative rounded-3xl overflow-hidden p-6"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-slate-400">Saldo Confirmado</span>
          </div>
          <div className="text-5xl font-display font-bold text-white">
            {balance?.confirmed.toLocaleString('pt-BR')}
            <span className="text-2xl text-brand-400 ml-1">pts</span>
          </div>
          {(balance?.pending ?? 0) > 0 && (
            <div className="mt-1 text-sm text-yellow-400">
              +{balance?.pending} pendentes de aprovação
            </div>
          )}
        </div>

        {/* Level progress */}
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${LEVEL_BG[level]} ${LEVEL_COLORS[level]}`}>
              <Star className="w-3 h-3" />{level}
            </div>
            {nextLevel && (
              <span className="text-xs text-slate-500">Próximo: {nextLevel} ({nextThreshold.toLocaleString('pt-BR')} pts)</span>
            )}
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full gradient-brand"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Kind filter */}
        <div className="flex gap-1.5">
          {([['all', 'Todos'], ['EARN', 'Ganhos'], ['REDEEM', 'Resgates']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
                ${filter === key ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Month filter */}
        {meses.length > 0 && (
          <div className="relative ml-auto">
            <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer">
              <option value="">Todos os meses</option>
              {meses.map(m => <option key={m} value={m}>{formatMes(m)}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Nenhuma movimentação encontrada.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((entry, i) => {
              const cfg = KIND_CONFIG[entry.kind]
              const Icon = cfg.icon
              const isPositive = entry.kind !== 'REDEEM'
              return (
                <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-4 py-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{entry.label}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {entry.status === 'PENDING' && (
                        <span className="text-xs text-yellow-400">• Pendente</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : '-'}{Math.abs(entry.points).toLocaleString('pt-BR')}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !mesFiltro && (
        <div className="flex justify-center">
          <button onClick={() => fetchLedger(false)} disabled={loadingMore}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
