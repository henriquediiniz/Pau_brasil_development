'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, Loader2, Plus, Search,
  Upload, X, Briefcase, CheckCircle2, Clock, Ban, Pencil, Trash2, CheckSquare, Square,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { STATUS_FECHAMENTO_LABEL, type RecStatusFechamentoValue } from '@/lib/gente/vaga-sla'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Sla {
  diasEmAberto: number
  statusFechamento: RecStatusFechamentoValue | null
  atrasada: boolean
  diasDeAtraso: number
  manual: boolean
}

interface Vaga {
  id: string
  codigo: string | null
  cargo: string
  area: string | null
  departamento: 'DPO' | 'SPO' | null
  quantidadeVagas: number
  salario?: number | null
  frontline: string | null
  dataAbertura: string
  dataPrevistaFechamento: string | null
  dataContratacao: string | null
  responsavelVaga: string | null
  solicitanteVaga: string | null
  nomeContratado: string | null
  colaboradorAnterior: string | null
  motivoSolicitacao: string | null
  andamentoProcesso: string | null
  status: 'ABERTA' | 'FECHADA' | 'CANCELADA'
  operacaoId: string | null
  operacao: { id: string; nome: string } | null
  sla: Sla
}

interface Resposta {
  items: Vaga[]
  total: number
  page: number
  pages: number
  semEscopo?: boolean
  podeVerSalario?: boolean
}

interface Operacao {
  id: string
  nome: string
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

// ─── Apresentação ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  ABERTA: { label: 'Aberta', icon: Clock, classe: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  FECHADA: { label: 'Fechada', icon: CheckCircle2, classe: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CANCELADA: { label: 'Cancelada', icon: Ban, classe: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
} as const

function StatusBadge({ status }: { status: Vaga['status'] }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cfg.classe}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

/** O indicador que o RH acompanha: prazo cumprido ou estourado. */
function PrazoBadge({ sla }: { sla: Sla }) {
  if (!sla.statusFechamento) return <span className="text-slate-600 text-xs">—</span>

  const cor = sla.atrasada
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cor}`}>
        {sla.atrasada && <AlertTriangle className="w-3 h-3" />}
        {STATUS_FECHAMENTO_LABEL[sla.statusFechamento]}
      </span>
      {sla.manual && (
        <span
          className="text-[10px] text-amber-400/80 border border-amber-500/20 bg-amber-500/10 rounded px-1"
          title="Situação definida manualmente pelo RH, sobrepondo o cálculo automático"
        >
          manual
        </span>
      )}
    </span>
  )
}

function formatarData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function VagasPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [operacaoId, setOperacaoId] = useState('')
  const [departamento, setDepartamento] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [detalhe, setDetalhe] = useState<Vaga | null>(null)
  const [exportando, setExportando] = useState(false)

  /*
    Selecao em massa. O RH importa uma planilha errada e precisa apagar dezenas
    de vagas de uma vez — uma a uma nao e tarefa que se peca a alguem.

    Guardamos ids, nao indices: a lista e paginada e refiltrada o tempo todo, e
    indice deixaria de apontar para a mesma vaga na primeira mudanca de filtro.
  */
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Debounce da busca para não disparar uma query por tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  const querystring = useMemo(() => {
    const qs = new URLSearchParams({ page: String(page) })
    if (status) qs.set('status', status)
    if (operacaoId) qs.set('operacaoId', operacaoId)
    if (departamento) qs.set('departamento', departamento)
    if (buscaAtiva) qs.set('q', buscaAtiva)
    return qs.toString()
  }, [page, status, operacaoId, departamento, buscaAtiva])

  const { data, error, isLoading, mutate } = useSWR<Resposta>(
    `/api/gente/vagas?${querystring}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  // Trocar filtro ou pagina limpa a selecao: manter marcada uma vaga que saiu
  // da tela e o caminho curto para alguem apagar o que nao estava vendo.
  useEffect(() => {
    setSelecionadas(new Set())
  }, [querystring])

  const alternar = useCallback((id: string) => {
    setSelecionadas((atual) => {
      const proxima = new Set(atual)
      if (proxima.has(id)) proxima.delete(id)
      else proxima.add(id)
      return proxima
    })
  }, [])

  // Estavel entre renders: `alternarTodas` depende dela, e um array novo a
  // cada render trocaria a identidade do callback sem motivo.
  const itens = useMemo(() => data?.items ?? [], [data])
  const todasMarcadas = itens.length > 0 && itens.every((v) => selecionadas.has(v.id))

  const alternarTodas = useCallback(() => {
    // "Todas" e sempre o que esta na tela, nunca o total do filtro: marcar 65
    // vagas com um clique sem poder conferir e o tipo de atalho que causa
    // estrago.
    setSelecionadas((atual) => (itens.every((v) => atual.has(v.id)) ? new Set() : new Set(itens.map((v) => v.id))))
  }, [itens])

  const excluirSelecionadas = useCallback(async () => {
    setExcluindo(true)
    try {
      const res = await fetch('/api/gente/vagas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selecionadas) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível excluir')

      toast({
        title: `${json.removidas} vaga(s) excluída(s)`,
        description:
          json.mantidas?.length > 0
            ? `${json.mantidas.length} continuam no sistema por terem candidato vinculado.`
            : undefined,
        variant: 'success',
      })
      setSelecionadas(new Set())
      setConfirmando(false)
      mutate()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Não foi possível excluir',
        variant: 'destructive',
      })
    } finally {
      setExcluindo(false)
    }
  }, [selecionadas, mutate])

  const { data: operacoesData } = useSWR<{ items: Operacao[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )

  const operacoes = operacoesData?.items ?? []

  const exportar = useCallback(async () => {
    setExportando(true)
    try {
      const res = await fetch(`/api/gente/vagas?${querystring}&export=xlsx`)
      if (!res.ok) throw new Error('Falha na exportação')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vagas-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Não foi possível exportar', variant: 'destructive' })
    } finally {
      setExportando(false)
    }
  }, [querystring])

  const limparFiltros = () => {
    setStatus('')
    setOperacaoId('')
    setDepartamento('')
    setBusca('')
    setPage(1)
  }

  const temFiltro = !!(status || operacaoId || departamento || buscaAtiva)

  // Usuário de RH sem operação atribuída: explica em vez de mostrar lista vazia.
  if (data?.semEscopo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</h2>
            <p className="text-slate-400 text-sm mt-1">
              O módulo Gente mostra dados por operação. Peça a um administrador para vincular as
              suas operações no cadastro de usuários.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/gente"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Controle de Vagas</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} vaga${data.total === 1 ? '' : 's'}` : 'Carregando…'}
            {temFiltro && ' com os filtros aplicados'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportar}
            disabled={exportando || !data?.total}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
          <Link
            href="/gente/vagas/importar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link
            href="/gente/vagas/nova"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova vaga
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Cargo, área, contratado, código…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          <option value="">Todos os status</option>
          <option value="ABERTA">Abertas</option>
          <option value="FECHADA">Fechadas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>

        {operacoes.length > 1 && (
          <select
            value={operacaoId}
            onChange={(e) => { setOperacaoId(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Todas as operações</option>
            {operacoes.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        )}

        <select
          value={departamento}
          onChange={(e) => { setDepartamento(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          <option value="">DPO e SPO</option>
          <option value="DPO">DPO</option>
          <option value="SPO">SPO</option>
        </select>

        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Barra de selecao. So aparece com a lista carregada — antes disso nao
          ha o que marcar, e um controle inerte so confunde. */}
      {data && data.items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={alternarTodas}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs transition-colors"
          >
            {todasMarcadas ? (
              <CheckSquare className="w-4 h-4 text-brand-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {todasMarcadas ? 'Desmarcar' : 'Selecionar'} as {data.items.length} desta página
          </button>

          {selecionadas.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs tabular-nums">
                {selecionadas.size} selecionada{selecionadas.size === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => setSelecionadas(new Set())}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={() => setConfirmando(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir selecionadas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar as vagas. Recarregue a página.
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="text-white font-medium">
              {temFiltro ? 'Nenhuma vaga com esses filtros' : 'Nenhuma vaga cadastrada ainda'}
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              {temFiltro
                ? 'Ajuste os filtros para ver outras vagas.'
                : 'Importe a planilha do RH ou cadastre a primeira vaga.'}
            </p>
          </div>
          {!temFiltro && (
            <Link
              href="/gente/vagas/importar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Importar planilha
            </Link>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((vaga) => {
            const marcada = selecionadas.has(vaga.id)
            return (
            <div
              key={vaga.id}
              className={`flex items-stretch gap-1 rounded-2xl border transition-all duration-200 ${
                marcada
                  ? 'bg-brand-500/8 border-brand-500/35'
                  : 'bg-white/3 border-white/8 hover:border-brand-500/25 hover:bg-brand-500/5'
              }`}
            >
              {/* Fora do botao do card: um checkbox dentro de <button> nao e
                  clicavel de forma confiavel, e marcar nao pode abrir o
                  detalhe. */}
              <button
                onClick={() => alternar(vaga.id)}
                aria-pressed={marcada}
                aria-label={`Selecionar ${vaga.cargo}`}
                className="pl-4 pr-1 flex items-center text-slate-500 hover:text-brand-400 transition-colors"
              >
                {marcada ? (
                  <CheckSquare className="w-4 h-4 text-brand-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

            <button
              onClick={() => setDetalhe(vaga)}
              className="flex-1 min-w-0 text-left p-4 pl-2"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{vaga.cargo}</span>
                    {vaga.quantidadeVagas > 1 && (
                      <span className="text-[11px] text-slate-400 border border-white/10 rounded px-1.5 py-0.5">
                        {vaga.quantidadeVagas} vagas
                      </span>
                    )}
                    {vaga.codigo && (
                      <span className="text-[11px] text-slate-500 font-mono">{vaga.codigo}</span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{vaga.operacao?.nome ?? 'Sem operação'}</span>
                    {vaga.area && <><span>·</span><span>{vaga.area}</span></>}
                    {vaga.departamento && <><span>·</span><span>{vaga.departamento}</span></>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={vaga.status} />
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {vaga.sla.diasEmAberto} dia{vaga.sla.diasEmAberto === 1 ? '' : 's'}
                    {vaga.sla.atrasada && vaga.sla.diasDeAtraso > 0 && (
                      <span className="text-red-400"> · +{vaga.sla.diasDeAtraso} de atraso</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-white/5">
                <PrazoBadge sla={vaga.sla} />
                <span className="text-[11px] text-slate-500">
                  Aberta em {formatarData(vaga.dataAbertura)}
                  {vaga.dataPrevistaFechamento && ` · prevista ${formatarData(vaga.dataPrevistaFechamento)}`}
                </span>
              </div>
            </button>
            </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmando}
        loading={excluindo}
        title={`Excluir ${selecionadas.size} vaga(s)?`}
        description="Não dá para voltar atrás. Vagas com candidato vinculado continuam no sistema — o histórico do processo seletivo não se apaga."
        confirmLabel="Excluir vagas"
        onConfirm={excluirSelecionadas}
        onCancel={() => setConfirmando(false)}
      />

      {/* Paginação */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-400 text-sm tabular-nums">
            {data.page} de {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detalhe */}
      <AnimatePresence>
        {detalhe && (
          <DrawerDetalhe
            vaga={detalhe}
            onClose={() => setDetalhe(null)}
            onExcluida={() => {
              setDetalhe(null)
              mutate()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Drawer de detalhe ────────────────────────────────────────────────────────

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200 mt-0.5 break-words">{valor || '—'}</dd>
    </div>
  )
}

function DrawerDetalhe({
  vaga,
  onClose,
  onExcluida,
}: {
  vaga: Vaga
  onClose: () => void
  onExcluida: () => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Esc fecha o painel.
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  async function excluir() {
    setExcluindo(true)
    try {
      const res = await fetch(`/api/gente/vagas/${vaga.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível excluir')

      toast({ title: 'Vaga excluída', variant: 'success' })
      onExcluida()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Não foi possível excluir',
        variant: 'destructive',
      })
      setConfirmando(false)
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da vaga ${vaga.cargo}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-white/10 z-50 overflow-y-auto"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 p-5 bg-surface border-b border-white/8">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-bold text-white break-words">{vaga.cargo}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{vaga.operacao?.nome ?? 'Sem operação'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={vaga.status} />
            <PrazoBadge sla={vaga.sla} />
          </div>

          <div className="p-4 rounded-2xl bg-white/3 border border-white/8">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-white tabular-nums">
                {vaga.sla.diasEmAberto}
              </span>
              <span className="text-slate-400 text-sm">
                dia{vaga.sla.diasEmAberto === 1 ? '' : 's'} em aberto
              </span>
            </div>
            {vaga.sla.atrasada && vaga.sla.diasDeAtraso > 0 && (
              <p className="text-red-400 text-xs mt-1">
                {vaga.sla.diasDeAtraso} dia{vaga.sla.diasDeAtraso === 1 ? '' : 's'} além do prazo previsto
              </p>
            )}
            {!vaga.dataPrevistaFechamento && (
              <p className="text-slate-500 text-xs mt-1">
                Sem previsão de fechamento — o prazo padrão de 30 dias está sendo usado.
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <Campo label="Código" valor={vaga.codigo} />
            <Campo label="Departamento" valor={vaga.departamento} />
            <Campo label="Área" valor={vaga.area} />
            <Campo label="Quantidade" valor={vaga.quantidadeVagas} />
            {vaga.salario !== undefined && (
              <Campo
                label="Salário"
                valor={
                  vaga.salario === null
                    ? null
                    : vaga.salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
              />
            )}
            <Campo label="Frontline" valor={vaga.frontline} />
            <Campo label="Abertura" valor={formatarData(vaga.dataAbertura)} />
            <Campo label="Previsão de fechamento" valor={formatarData(vaga.dataPrevistaFechamento)} />
            <Campo label="Contratação" valor={formatarData(vaga.dataContratacao)} />
            <Campo label="Responsável" valor={vaga.responsavelVaga} />
            <Campo label="Solicitante" valor={vaga.solicitanteVaga} />
            <Campo label="Contratado" valor={vaga.nomeContratado} />
            <Campo label="Colaborador anterior" valor={vaga.colaboradorAnterior} />
            <Campo label="Motivo" valor={vaga.motivoSolicitacao} />
          </dl>

          {vaga.andamentoProcesso && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Andamento</dt>
              <dd className="text-sm text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                {vaga.andamentoProcesso}
              </dd>
            </div>
          )}

          {/* Ações */}
          <div className="pt-2 border-t border-white/8 space-y-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/gente/vagas/${vaga.id}/editar`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Link>
              {!confirmando && (
                <button
                  onClick={() => setConfirmando(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
            </div>

            {confirmando && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-white">Excluir esta vaga em definitivo?</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Não dá para desfazer. Se a vaga apenas não seguiu adiante, prefira editá-la e marcar
                  como Cancelada — assim o histórico de prazo é preservado.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={excluir}
                    disabled={excluindo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                  >
                    {excluindo && <Loader2 className="w-3 h-3 animate-spin" />}
                    Sim, excluir
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    disabled={excluindo}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                  >
                    Manter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
