'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft, CheckCircle2, XCircle, Camera, Filter } from 'lucide-react'
import { isSysAdmin } from '@/lib/auth-helpers'

type Visit = {
  id: string
  operationName: string
  operationSlug: string
  checkedInAt: string
  gpsValid: boolean
  faceValid: boolean
  status: string
  photoUrl?: string
}

type Totals = {
  byOperation: { slug: string; name: string; count: number }[]
}

type Obligation = {
  operationSlug: string
  operationName: string
  quantidadeMinima: number
  visitasValidas: number
  cumprida: boolean
}

const STATUS: Record<string, { label: string; border: string; badge: string }> = {
  valid:        { label: 'Válida',       border: 'border-l-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  blocked_gps:  { label: 'GPS inválido', border: 'border-l-orange-500',  badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  blocked_face: { label: 'Face inválida',border: 'border-l-red-500',     badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 border-l-4 border-l-white/10 p-4 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-1/3" />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="w-4 h-4 rounded-full bg-white/10" />
        <div className="w-4 h-4 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

export default function LiderHistoricoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params?.userId as string

  const [visits, setVisits] = useState<Visit[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState('')

  const { status } = useSession()
  const user = session?.user as any
  const canView = (user ? isSysAdmin(user) : false) || user?.isEmpresaAdmin === true || user?.isVisitasAdmin === true || user?.id === userId

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || (session && !canView)) router.replace('/app/hoje')
  }, [status, session, canView, router])

  useEffect(() => {
    if (!canView || !userId) return
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMonth) params.set('month', filterMonth)
    fetch(`/api/visitas/lider/${userId}?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setVisits(d.visits ?? []); setTotals(d.totals ?? null); setObligations(d.obligations ?? []) })
      .finally(() => setLoading(false))
  }, [canView, userId, filterMonth])

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" /> Histórico de Visitas
          </h1>
          <p className="text-slate-500 text-sm">Suas visitas registradas às filiais</p>
        </div>
      </div>

      {/* Filtro de mês */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm"
        />
        {filterMonth && (
          <button onClick={() => setFilterMonth('')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Limpar
          </button>
        )}
      </div>

      {/* Obrigações do mês corrente */}
      {obligations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Obrigações deste mês</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {obligations.map(ob => (
              <motion.div key={ob.operationSlug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-4 flex items-center gap-4 ${ob.cumprida ? 'bg-emerald-500/8 border-emerald-500/25' : 'bg-amber-500/8 border-amber-500/25'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ob.cumprida ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  {ob.cumprida
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <MapPin className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ob.operationName}</p>
                  <p className={`text-xs mt-0.5 ${ob.cumprida ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {ob.visitasValidas}/{ob.quantidadeMinima} visita{ob.quantidadeMinima !== 1 ? 's' : ''} válida{ob.quantidadeMinima !== 1 ? 's' : ''}
                    {ob.cumprida ? ' ✓' : ' pendente'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Totais por operação */}
      {totals && totals.byOperation.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {totals.byOperation.map(op => (
            <motion.div key={op.slug} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold text-white">{op.count}</p>
              <p className="text-slate-400 text-sm mt-1">{op.name}</p>
            </motion.div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <p className="text-slate-400">
            {filterMonth ? 'Nenhuma visita neste mês.' : 'Nenhuma visita registrada ainda.'}
          </p>
          {!filterMonth && (
            <button onClick={() => router.push('/app/visitas/configurar-face')}
              className="mt-4 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium">
              Configurar reconhecimento facial
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => {
            const st = STATUS[v.status] ?? { label: v.status, border: 'border-l-white/20', badge: 'bg-white/10 text-slate-400 border-white/20' }
            return (
              <motion.div key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`rounded-2xl bg-white/5 border border-white/10 border-l-4 ${st.border} p-4 flex items-center gap-4`}>
                {v.photoUrl ? (
                  <img src={v.photoUrl} alt="foto" loading="lazy" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{v.operationName}</p>
                  <p className="text-slate-400 text-sm">{fmtDate(v.checkedInAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${st.badge}`}>{st.label}</span>
                  <div className="flex items-center gap-2">
                    <span title="GPS">
                      {v.gpsValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-orange-400" />}
                    </span>
                    <span title="Face">
                      {v.faceValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
