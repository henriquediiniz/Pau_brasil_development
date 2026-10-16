'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Loader2, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

interface AuditEntry {
  id: string
  actorName: string
  action: string
  targetType: string
  targetId?: string
  meta?: Record<string, unknown>
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  USER_CREATED:                 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  USER_UPDATED:                 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  USER_PASSWORD_CHANGED:        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  USER_DEACTIVATED:             'bg-red-500/10 text-red-400 border-red-500/20',
  USER_PHOTO_UPDATED:           'bg-sky-500/10 text-sky-400 border-sky-500/20',
  TASK_COMPLETED:               'bg-brand-500/10 text-brand-400 border-brand-500/20',
  TASK_APPROVED:                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  TASK_REJECTED:                'bg-red-500/10 text-red-400 border-red-500/20',
  REDEEM_REQUESTED:             'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REDEEM_STATUS_CHANGED:        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  POINTS_ADJUSTED:              'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  FUNCTION_CREATED:             'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  FUNCTION_UPDATED:             'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  FUNCTION_DELETED:             'bg-red-500/10 text-red-400 border-red-500/20',
  PRODUCT_CREATED:              'bg-teal-500/10 text-teal-400 border-teal-500/20',
  PRODUCT_UPDATED:              'bg-teal-500/10 text-teal-400 border-teal-500/20',
  OBZ_ESTRUTURA_CRIADA:         'bg-green-500/10 text-green-400 border-green-500/20',
  OBZ_ESTRUTURA_ATUALIZADA:     'bg-green-500/10 text-green-400 border-green-500/20',
  OBZ_ESTRUTURA_DELETADA:       'bg-red-500/10 text-red-400 border-red-500/20',
  OBZ_LANCAMENTO_SALVO:         'bg-lime-500/10 text-lime-400 border-lime-500/20',
  OBZ_JUSTIFICATIVA_APROVADA:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OBZ_JUSTIFICATIVA_REPROVADA:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  OBZ_PERIODO_ABERTO:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OBZ_PERIODO_FECHADO:          'bg-slate-500/10 text-slate-400 border-slate-500/20',
  OBZ_TENDENCIA_LIBERADA:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  OBZ_TENDENCIA_BLOQUEADA:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  OBZ_ANUAL_TRAVADO:            'bg-red-500/10 text-red-400 border-red-500/20',
  OBZ_ANUAL_DESTRAVADO:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OBZ_ANUAL_SUBMETIDO:          'bg-brand-500/10 text-brand-400 border-brand-500/20',
  UPB_TEMPORADA_CRIADA:         'bg-violet-500/10 text-violet-400 border-violet-500/20',
  UPB_TEMPORADA_ATUALIZADA:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
  UPB_TEMPORADA_DELETADA:       'bg-red-500/10 text-red-400 border-red-500/20',
  UPB_EPISODIO_CRIADO:          'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  UPB_EPISODIO_ATUALIZADO:      'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
}

const ACTION_LABELS: Record<string, string> = {
  USER_CREATED:                 'Usuário criado',
  USER_UPDATED:                 'Usuário editado',
  USER_PASSWORD_CHANGED:        'Senha alterada',
  USER_DEACTIVATED:             'Usuário desativado',
  USER_PHOTO_UPDATED:           'Foto atualizada',
  TASK_COMPLETED:               'Tarefa concluída',
  TASK_APPROVED:                'Tarefa aprovada',
  TASK_REJECTED:                'Tarefa reprovada',
  REDEEM_REQUESTED:             'Resgate solicitado',
  REDEEM_STATUS_CHANGED:        'Resgate atualizado',
  POINTS_ADJUSTED:              'Pontos ajustados',
  FUNCTION_CREATED:             'Função criada',
  FUNCTION_UPDATED:             'Função editada',
  FUNCTION_DELETED:             'Função excluída',
  PRODUCT_CREATED:              'Produto criado',
  PRODUCT_UPDATED:              'Produto editado',
  OBZ_ESTRUTURA_CRIADA:         'OBZ: estrutura criada',
  OBZ_ESTRUTURA_ATUALIZADA:     'OBZ: estrutura editada',
  OBZ_ESTRUTURA_DELETADA:       'OBZ: estrutura removida',
  OBZ_LANCAMENTO_SALVO:         'OBZ: lançamento salvo',
  OBZ_JUSTIFICATIVA_APROVADA:   'OBZ: justificativa aprovada',
  OBZ_JUSTIFICATIVA_REPROVADA:  'OBZ: justificativa reprovada',
  OBZ_PERIODO_ABERTO:           'OBZ: período aberto',
  OBZ_PERIODO_FECHADO:          'OBZ: período fechado',
  OBZ_TENDENCIA_LIBERADA:       'OBZ: tendência liberada',
  OBZ_TENDENCIA_BLOQUEADA:      'OBZ: tendência bloqueada',
  OBZ_ANUAL_TRAVADO:            'OBZ: orçamento anual travado',
  OBZ_ANUAL_DESTRAVADO:         'OBZ: orçamento anual destravado',
  OBZ_ANUAL_SUBMETIDO:          'OBZ: orçamento anual submetido',
  UPB_TEMPORADA_CRIADA:         'UPB: temporada criada',
  UPB_TEMPORADA_ATUALIZADA:     'UPB: temporada editada',
  UPB_TEMPORADA_DELETADA:       'UPB: temporada removida',
  UPB_EPISODIO_CRIADO:          'UPB: episódio criado',
  UPB_EPISODIO_ATUALIZADO:      'UPB: episódio editado',
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS)

function metaSummary(action: string, meta?: Record<string, unknown>): string {
  if (!meta) return ''
  switch (action) {
    case 'TASK_COMPLETED':
    case 'TASK_APPROVED':
    case 'TASK_REJECTED':
      return meta.taskTitle ? `"${meta.taskTitle}"${meta.points ? ` · ${meta.points} pts` : ''}` : ''
    case 'USER_CREATED':
    case 'USER_UPDATED':
    case 'USER_DEACTIVATED':
      return meta.targetName ? String(meta.targetName) : ''
    case 'REDEEM_REQUESTED':
      return meta.productTitle ? `${meta.productTitle} · ${meta.pointsCost} pts` : ''
    case 'POINTS_ADJUSTED':
      return meta.reason ? String(meta.reason) : ''
    case 'OBZ_LANCAMENTO_SALVO':
      return meta.linhaId ? `Linha ${String(meta.linhaId).slice(-6)} · ${String(meta.mes).padStart(2, '0')}/${meta.ano}` : ''
    case 'OBZ_JUSTIFICATIVA_APROVADA':
    case 'OBZ_JUSTIFICATIVA_REPROVADA':
      return meta.pacoteNome ? `${meta.pacoteNome} · ${String(meta.mes).padStart(2, '0')}/${meta.ano} — ${meta.dono}` : ''
    case 'OBZ_ESTRUTURA_CRIADA':
    case 'OBZ_ESTRUTURA_ATUALIZADA':
    case 'OBZ_ESTRUTURA_DELETADA':
      return meta.nome ? String(meta.nome) : ''
    case 'OBZ_ANUAL_TRAVADO':
    case 'OBZ_ANUAL_DESTRAVADO':
      return meta.travadoNota ? String(meta.travadoNota) : `Ano ${meta.ano}`
    case 'OBZ_ANUAL_SUBMETIDO':
      return meta.ano ? `Ano ${meta.ano}` : ''
    case 'UPB_TEMPORADA_CRIADA':
    case 'UPB_TEMPORADA_ATUALIZADA':
    case 'UPB_EPISODIO_CRIADO':
    case 'UPB_EPISODIO_ATUALIZADO':
      return meta.titulo ? String(meta.titulo) : ''
    default:
      return ''
  }
}

export default function AuditoriaGestorPage() {
  const [logs, setLogs]         = useState<AuditEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filterAction) params.set('action', filterAction)
      const res = await fetch(`/api/admin/auditoria?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, filterAction])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPage(1) }, [filterAction])

  const filtered = logs.filter(l =>
    !search ||
    l.actorName.toLowerCase().includes(search.toLowerCase()) ||
    (ACTION_LABELS[l.action] ?? l.action).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Auditoria</h1>
          <p className="text-slate-400 text-sm">{total.toLocaleString('pt-BR')} ação{total !== 1 ? 'ões' : ''} registrada{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário ou ação..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all appearance-none cursor-pointer">
            <option value="" className="bg-[#111118]">Todas as ações</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a} className="bg-[#111118]">{ACTION_LABELS[a]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">Nenhum registro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Data/hora', 'Usuário', 'Ação', 'Detalhes'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3 first:pl-5 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 pl-5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-[10px]">{log.actorName[0]}</span>
                        </div>
                        <span className="text-sm text-white">{log.actorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 pr-5 text-xs text-slate-400 max-w-xs truncate">
                      {metaSummary(log.action, log.meta as any)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Página {page} de {pages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3
              if (p < 1 || p > pages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${p === page ? 'gradient-brand text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
