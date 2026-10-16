'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Loader2, Crown, MapPin, ChevronDown, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

interface RankEntry {
  position: number; userId: string; name: string
  company?: string; unit?: string | null; points: number
  photoUrl?: string | null; funcao?: string | null
}

interface Filtros {
  units: string[]
  funcoes: { id: string; name: string }[]
}

type Period = 'daily' | 'weekly' | 'monthly'

interface DropdownOption { value: string; label: string }

function Dropdown({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 pl-3.5 pr-3 py-1.5 rounded-xl border text-sm transition-all
          ${open ? 'bg-white/10 border-brand-500/50 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/8'}`}>
        <span className="max-w-[160px] truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1.5 left-0 min-w-full w-max max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-white/10 shadow-xl shadow-black/40 py-1">
            {[{ value: '', label: placeholder }, ...options].map(opt => (
              <button key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-sm text-left transition-colors
                  ${opt.value === value ? 'text-white bg-brand-500/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
const MEDAL_COLORS = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
const MEDAL_BG = ['bg-yellow-400/10 border-yellow-400/30', 'bg-slate-400/10 border-slate-400/30', 'bg-amber-600/10 border-amber-600/30']

function Avatar({ name, photoUrl, size = 10 }: { name: string; photoUrl?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full shrink-0 overflow-hidden gradient-brand flex items-center justify-center`
  return (
    <div className={cls}>
      {photoUrl
        ? <Image src={photoUrl} alt={name} width={size * 4} height={size * 4} className="w-full h-full object-cover" />
        : <span className="text-white font-bold text-sm">{name[0]}</span>
      }
    </div>
  )
}

export default function RankingPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [period, setPeriod] = useState<Period>('monthly')
  const [unit, setUnit] = useState('')
  const [funcaoId, setFuncaoId] = useState('')

  const fetcher = (url: string) => fetch(url).then(r => r.json())

  const { data: filtrosData } = useSWR<{ filtros: Filtros }>(
    '/api/ranking?filtros=1&period=monthly', fetcher, { revalidateOnFocus: false }
  )
  const filtros = filtrosData?.filtros ?? null

  const rankParams = new URLSearchParams({ period })
  if (unit) rankParams.set('unit', unit)
  if (funcaoId) rankParams.set('funcaoId', funcaoId)

  const { data: rankData, isLoading: loading } = useSWR(
    `/api/ranking?${rankParams}`, fetcher, { keepPreviousData: true }
  )

  const ranking: RankEntry[] = Array.isArray(rankData) ? rankData : rankData?.ranking ?? []
  const myPosition = ranking.findIndex(r => r.userId === userId) + 1
  const myEntry = ranking.find(r => r.userId === userId)
  const entryAbove = myPosition > 1 ? ranking[myPosition - 2] : null
  const gap = entryAbove && myEntry ? entryAbove.points - myEntry.points : 0
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Ranking</h1>
          <p className="text-slate-400 text-sm">Top colaboradores por pontos</p>
        </div>
        {myPosition > 0 && (
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-brand-400">#{myPosition}</div>
            <div className="text-xs text-slate-500">Sua posição</div>
            {myPosition === 1 ? (
              <div className="text-xs text-brand-400 mt-0.5">Você lidera! 🏆</div>
            ) : gap > 0 ? (
              <div className="text-xs text-slate-500 mt-0.5">Faltam {gap.toLocaleString('pt-BR')} pts para #{myPosition - 1}</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {([{ key: 'daily', label: 'Hoje' }, { key: 'weekly', label: 'Semana' }, { key: 'monthly', label: 'Mês' }] as const).map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${period === p.key ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {filtros && (filtros.units.length > 0 || filtros.funcoes.length > 0) && (
        <div className="flex gap-2 flex-wrap items-center">
          {filtros.units.length > 0 && (
            <Dropdown
              value={unit}
              onChange={setUnit}
              placeholder="Todas as unidades"
              options={filtros.units.map(u => ({ value: u, label: u }))}
            />
          )}
          {filtros.funcoes.length > 0 && (
            <Dropdown
              value={funcaoId}
              onChange={setFuncaoId}
              placeholder="Todas as funções"
              options={filtros.funcoes.map(f => ({ value: f.id, label: f.name }))}
            />
          )}
          {(unit || funcaoId) && (
            <button onClick={() => { setUnit(''); setFuncaoId('') }}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-white bg-white/5 border border-white/10 transition-colors">
              Limpar ×
            </button>
          )}
        </div>
      )}

      {loading ? (
        <>
          {/* Top 3 skeleton */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-3 sm:p-4 flex flex-col items-center gap-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-3 w-10 rounded-full" />
              </div>
            ))}
          </div>
          {/* List skeleton */}
          <div className="rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-2.5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-14 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </>
      ) : ranking.length === 0 ? (
        <div className="text-center py-12 text-slate-500">Sem dados para o período.</div>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => {
                const pos = entry.position - 1
                const isFirst = pos === 0
                return (
                  <motion.div key={entry.userId} initial={{ opacity: 0, y: isFirst ? -10 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className={`rounded-2xl border p-2 sm:p-4 text-center ${MEDAL_BG[pos]} ${isFirst ? 'col-start-2 -mt-2' : ''} ${entry.userId === userId ? 'ring-2 ring-brand-500' : ''}`}>
                    {isFirst && <Crown className="w-5 h-5 text-yellow-400 mx-auto mb-2" />}
                    <Avatar name={entry.name} photoUrl={entry.photoUrl} size={10} />
                    <div className="text-xs text-white font-medium truncate mt-2">{entry.name.split(' ')[0]}</div>
                    {entry.funcao && (
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">{entry.funcao}</div>
                    )}
                    {!entry.funcao && entry.unit && (
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center justify-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{entry.unit.replace('Pau Brasil ', '')}
                      </div>
                    )}
                    <div className={`text-xs font-bold mt-1 ${MEDAL_COLORS[pos]}`}>{entry.points.toLocaleString('pt-BR')} pts</div>
                    <div className={`text-lg font-display font-black mt-1 ${MEDAL_COLORS[pos]}`}>#{entry.position}</div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {rest.length > 0 && (
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="divide-y divide-white/5">
                {rest.map((entry, i) => (
                  <motion.div key={entry.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 px-4 py-3 ${entry.userId === userId ? 'bg-brand-500/10' : ''}`}>
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">{entry.position}</div>
                    <Avatar name={entry.name} photoUrl={entry.photoUrl} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{entry.name}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        {entry.funcao ? (
                          <span className="truncate">{entry.funcao}</span>
                        ) : entry.unit ? (
                          <><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{entry.unit}</span></>
                        ) : entry.company ? (
                          <span className="truncate">{entry.company}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-400 shrink-0">{entry.points.toLocaleString('pt-BR')} pts</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
