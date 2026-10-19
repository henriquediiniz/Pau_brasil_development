'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin, Users, TrendingUp, CheckCircle2, XCircle, Clock, ArrowLeft,
  Camera, Download, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight,
  ClipboardList,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { isSysAdmin } from '@/lib/auth-helpers'

const PAGE_LIMIT = 20

type Visit = {
  id: string
  operationName: string
  operationSlug: string
  checkedInAt: string
  gpsValid: boolean
  faceValid: boolean
  status: string
  photoUrl?: string
  user: { id: string; name: string; leaderTitle: string | null; photoUrl: string | null }
}

type Summary = {
  total: number
  thisMonth: number
  byOperation: { name: string; count: number }[]
  byLeader: { id: string; name: string; leaderTitle: string | null; count: number }[]
}

type MatrixRow = {
  user: { id: string; name: string; leaderTitle: string | null; photoUrl: string | null }
  byOp: Record<string, { date: string; status: string } | null>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  valid:        { label: 'Válida',       color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  blocked_gps:  { label: 'GPS inválido', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  blocked_face: { label: 'Face inválida', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const MATRIX_CELL: Record<string, string> = {
  valid:        'bg-emerald-500/20 text-emerald-300',
  blocked_gps:  'bg-orange-500/20 text-orange-300',
  blocked_face: 'bg-red-500/20 text-red-300',
}

export default function VisitasDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [filterLeader, setFilterLeader] = useState('')
  const [filterOp, setFilterOp] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const pinchRef = useRef<number | null>(null)

  const [activeTab, setActiveTab] = useState<'visitas' | 'matriz' | 'compliance'>('visitas')

  const user = session?.user as any
  const isAdmin = (user ? isSysAdmin(user) : false) || user?.isVisitasAdmin === true

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated' || (session && !isAdmin)) router.replace('/app/inicio')
  }, [status, session, isAdmin, router])

  const fetcher = (url: string) => fetch(url).then(r => r.json())

  const visitParams = new URLSearchParams()
  if (filterLeader) visitParams.set('userId', filterLeader)
  if (filterOp)     visitParams.set('operationSlug', filterOp)
  if (filterMonth)  visitParams.set('month', filterMonth)
  if (filterStatus) visitParams.set('status', filterStatus)
  visitParams.set('page', String(page))
  visitParams.set('limit', String(PAGE_LIMIT))

  const monthParam = filterMonth ? `?month=${filterMonth}` : ''

  const { data: opsData } = useSWR<{ slug: string; name: string }[]>(
    isAdmin ? '/api/visitas/operacoes' : null, fetcher
  )
  const { data: visitData, isLoading: loading } = useSWR(
    isAdmin ? '/api/visitas/dashboard?' + visitParams.toString() : null,
    fetcher, { keepPreviousData: true }
  )
  const { data: matrixData, isLoading: matrixLoading } = useSWR(
    isAdmin && activeTab === 'matriz' ? '/api/visitas/matriz' + (filterMonth ? `?month=${filterMonth}` : '') : null,
    fetcher, { keepPreviousData: true }
  )
  const { data: complianceData, isLoading: complianceLoading } = useSWR(
    isAdmin && activeTab === 'compliance' ? '/api/visitas/compliance' + monthParam : null,
    fetcher, { keepPreviousData: true }
  )

  const allOps:    { slug: string; name: string }[]   = Array.isArray(opsData) ? opsData : []
  const visits:    Visit[]                             = visitData?.visits   ?? []
  const summary:   Summary | null                      = visitData?.summary  ?? null
  const total:     number                              = visitData?.total    ?? 0
  const leaders:   Visit['user'][]                     = visitData?.leaders  ?? []
  const matrixRows: MatrixRow[]                        = matrixData?.rows       ?? []
  const matrixOps:  { slug: string; name: string }[]   = matrixData?.operations ?? []

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function fmtMatrixDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  function closeLightbox() {
    setLightboxUrl(null)
    setZoom(1)
  }

  function handlePinchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      )
    }
  }

  function handlePinchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2 || pinchRef.current === null) return
    const newDist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    )
    setZoom(z => Math.min(3, Math.max(1, z * (newDist / pinchRef.current!))))
    pinchRef.current = newDist
  }

  function exportarXLSX() {
    const wb = XLSX.utils.book_new()

    const visitHeaders = ['Líder', 'Cargo', 'Filial', 'Data/Hora', 'GPS', 'Face', 'Status']
    const visitRows = visits.map(v => [
      v.user.name,
      v.user.leaderTitle ?? '—',
      v.operationName,
      new Date(v.checkedInAt).toLocaleString('pt-BR'),
      v.gpsValid ? 'Válido' : 'Inválido',
      v.faceValid ? 'Válido' : 'Inválido',
      STATUS_LABELS[v.status]?.label ?? v.status,
    ])
    const ws1 = XLSX.utils.aoa_to_sheet([visitHeaders, ...visitRows])
    XLSX.utils.book_append_sheet(wb, ws1, 'Visitas')

    const matrixHeaders = ['Gerente', 'Cargo', ...matrixOps.map(o => o.name)]
    const matrixDataRows = matrixRows.map(row => [
      row.user.name,
      row.user.leaderTitle ?? '—',
      ...matrixOps.map(op => {
        const cell = row.byOp[op.slug]
        if (!cell) return '—'
        return `${new Date(cell.date).toLocaleDateString('pt-BR')} (${STATUS_LABELS[cell.status]?.label ?? cell.status})`
      }),
    ])
    const ws2 = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixDataRows])
    XLSX.utils.book_append_sheet(wb, ws2, 'Matriz')

    const suffix = filterMonth ? `-${filterMonth}` : ''
    XLSX.writeFile(wb, `visitas${suffix}.xlsx`)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))
  const from = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1
  const to = Math.min(page * PAGE_LIMIT, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-400" /> Dashboard de Visitas
          </h1>
          <p className="text-slate-500 text-sm mt-1">Visitas de líderes itinerantes às filiais</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: 'Este mês',       value: summary.thisMonth },
            { icon: MapPin,     label: 'Total',           value: summary.total },
            { icon: Users,      label: 'Líderes únicos', value: leaders.length },
          ].map(({ icon: Icon, label, value }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <Icon className="w-5 h-5 text-brand-400 mb-2" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit">
        {([
          { key: 'visitas',    label: 'Visitas',    icon: MapPin },
          { key: 'matriz',     label: 'Matriz',     icon: Users },
          { key: 'compliance', label: 'Compliance', icon: ClipboardList },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === key ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Compliance tab */}
      {activeTab === 'compliance' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-400" /> Compliance de Visitas Obrigatórias
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {filterMonth
                ? `Mês: ${new Date(filterMonth + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
                : 'Mês corrente — selecione um mês para filtrar'}
            </p>
          </div>
          <div className="px-5 py-3 border-b border-white/8">
            <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm" />
          </div>
          {complianceLoading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />)}</div>
          ) : !complianceData || complianceData.rows.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">Nenhuma obrigação cadastrada para o período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Líder', 'Cargo', 'Obrigações', 'Cumpridas', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {complianceData.rows.map((row: any) => {
                    const pct = row.totalObrigacoes === 0 ? 0 : row.totalCumpridas / row.totalObrigacoes
                    const badge = pct === 1 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : pct > 0  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                           : 'bg-red-500/15 text-red-400 border-red-500/30'
                    const label = pct === 1 ? 'Completo' : pct > 0 ? 'Parcial' : 'Pendente'
                    return (
                      <tr key={row.user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{row.user.name}</td>
                        <td className="px-4 py-3 text-slate-400">{row.user.leaderTitle ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{row.totalObrigacoes}</td>
                        <td className="px-4 py-3 text-slate-300">{row.totalCumpridas}/{row.totalObrigacoes}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs border ${badge}`}>{label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filters (apenas nas abas visitas/matriz) */}
      {activeTab !== 'compliance' && <div className="flex flex-wrap gap-3 items-center">
        <select value={filterLeader} onChange={e => { setFilterLeader(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
          <option value="">Todos os líderes</option>
          {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={filterOp} onChange={e => { setFilterOp(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
          <option value="">Todas as filiais</option>
          {allOps.map(o => <option key={o.slug} value={o.slug}>{o.name}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm">
          <option value="">Todos os status</option>
          <option value="valid">Válidas</option>
          <option value="blocked_gps">GPS inválido</option>
          <option value="blocked_face">Face inválida</option>
        </select>
        <button
          onClick={exportarXLSX}
          disabled={visits.length === 0}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <Download className="w-4 h-4" />
          Exportar XLSX
        </button>
      </div>}

      {/* Matriz Gerentes × Filiais */}
      {activeTab === 'matriz' &&
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-sm">Matriz de Visitas — Gerentes × Filiais</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {filterMonth
              ? `Período: ${new Date(filterMonth + '-02').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`
              : 'Todos os períodos — selecione um mês para filtrar'}
          </p>
        </div>

        {matrixLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-lg bg-white/5 animate-pulse" />)}
          </div>
        ) : matrixRows.length === 0 ? (
          <p className="p-6 text-center text-slate-500 text-sm">Nenhum líder itinerante encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2.5 text-slate-400 font-medium min-w-[180px]">Gerente</th>
                  {matrixOps.map(op => (
                    <th key={op.slug} className="px-2 py-2.5 text-slate-400 font-medium text-center min-w-[72px] max-w-[90px]">
                      <span className="block truncate" title={op.name}>{op.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {matrixRows.map(row => (
                  <tr key={row.user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {row.user.photoUrl
                          ? <img src={row.user.photoUrl} alt="" loading="lazy" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          : <div className="w-6 h-6 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">{row.user.name[0]}</div>
                        }
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{row.user.name}</p>
                          {row.user.leaderTitle && <p className="text-slate-500 truncate">{row.user.leaderTitle}</p>}
                        </div>
                      </div>
                    </td>
                    {matrixOps.map(op => {
                      const cell = row.byOp[op.slug]
                      return (
                        <td key={op.slug} className="px-2 py-2.5 text-center">
                          {cell ? (
                            <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${MATRIX_CELL[cell.status] ?? 'bg-white/10 text-slate-400'}`}>
                              {fmtMatrixDate(cell.date)}
                            </span>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* Tabela de visitas individuais */}
      {activeTab === 'visitas' && <>
      {loading ? (
        <div className="py-16 flex justify-center">
          <Clock className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
          <p className="text-slate-400">Nenhuma visita encontrada para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Líder', 'Cargo', 'Filial', 'Data/Hora', 'GPS', 'Face', 'Status', 'Foto'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visits.map(v => {
                  const st = STATUS_LABELS[v.status] ?? { label: v.status, color: 'bg-white/10 text-slate-400' }
                  return (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {v.user.photoUrl
                            ? <img src={v.user.photoUrl} alt="" loading="lazy" className="w-7 h-7 rounded-full object-cover" />
                            : <div className="w-7 h-7 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">{v.user.name[0]}</div>
                          }
                          <span className="text-white font-medium">{v.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{v.user.leaderTitle ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{v.operationName}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(v.checkedInAt)}</td>
                      <td className="px-4 py-3">
                        {v.gpsValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </td>
                      <td className="px-4 py-3">
                        {v.faceValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs border ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {v.photoUrl ? (
                          <button onClick={() => setLightboxUrl(v.photoUrl!)}
                            className="block hover:opacity-80 transition-opacity">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.photoUrl} alt="foto visita" loading="lazy" className="w-8 h-8 rounded-lg object-cover" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-slate-600" />
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
            <p className="text-slate-500 text-sm">
              {total === 0 ? 'Nenhuma visita' : `Exibindo ${from}–${to} de ${total} visitas`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-slate-500 text-sm px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </>}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoom(z => Math.min(3, +(z + 0.5).toFixed(1)))}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={closeLightbox}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="foto visita"
            onClick={e => e.stopPropagation()}
            onTouchStart={handlePinchStart}
            onTouchMove={handlePinchMove}
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease' }}
            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl touch-none select-none cursor-default"
          />

          {zoom > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
              {zoom.toFixed(1)}×
            </div>
          )}
        </div>
      )}
    </div>
  )
}
