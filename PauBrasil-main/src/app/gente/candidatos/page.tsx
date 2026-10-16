'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, ExternalLink, FileText,
  Loader2, Plus, Search, Upload, UserPlus, Users, X, Check, Minus, Ban, Trash2, Zap,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { PainelFrontline } from './_components/PainelFrontline'
import {
  ETAPAS_PADRAO,
  definicaoEtapa,
  ordenarEtapas,
  type ResultadoEtapa,
} from '@/lib/gente/etapas'
import { SITUACAO_LABEL, ORIGEM_LABEL, type SituacaoCandidato } from '@/lib/gente/candidato'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EtapaApi {
  chave: string
  resultado: ResultadoEtapa
  observacao: string | null
  avaliadoEm: string | null
  avaliador: { id: string; name: string | null } | null
}

interface ResumoEtapas {
  aplicaveis: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  percentual: number
  proxima: { chave: string; label: string } | null
  bloqueada: boolean
  concluida: boolean
}

interface Candidato {
  id: string
  candidaturaId: string | null
  /** O cargo disputado é de frontline — vem resolvido do servidor. */
  frontline: boolean
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  mesProcesso: string | null
  setor: 'DPO' | 'SPO' | null
  escolaridade: string | null
  habilidades: string | null
  residencia: string | null
  observacao: string | null
  origemCurriculo: keyof typeof ORIGEM_LABEL
  quemIndicou: string | null
  situacao: SituacaoCandidato
  situacaoFinal: SituacaoCandidato | null
  dataSituacaoFinal: string | null
  temCurriculo: boolean
  operacao: { id: string; nome: string } | null
  vaga: { id: string; cargo: string; status: string } | null
  etapas: EtapaApi[]
  resumoEtapas: ResumoEtapas
}

interface Resposta {
  items: Candidato[]
  total: number
  page: number
  pages: number
  semEscopo?: boolean
  /** Opções do filtro de cargo: grafias agrupadas (ver `cargo-agrupado.ts`). */
  cargos?: { chave: string; cargo: string; total: number }[]
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

// ─── Apresentação ─────────────────────────────────────────────────────────────

const SITUACAO_CLASSE: Record<SituacaoCandidato, string> = {
  EM_STAND_BY: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
  EM_ANDAMENTO: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  CONTRATADO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  INDISPONIVEL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  NAO_CONTRATADO: 'text-red-400 bg-red-500/10 border-red-500/20',
}

function SituacaoBadge({ situacao }: { situacao: SituacaoCandidato }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${SITUACAO_CLASSE[situacao]}`}
    >
      {SITUACAO_LABEL[situacao]}
    </span>
  )
}

const RESULTADO_ICONE: Record<ResultadoEtapa, { Icone: typeof Check; classe: string; titulo: string }> = {
  OK: { Icone: Check, classe: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', titulo: 'Aprovado' },
  NAO: { Icone: X, classe: 'text-red-400 bg-red-500/15 border-red-500/30', titulo: 'Reprovado' },
  NA: { Icone: Minus, classe: 'text-slate-500 bg-white/5 border-white/10', titulo: 'Não se aplica' },
}

/** Trilha compacta das etapas, para leitura rápida na lista. */
function TrilhaEtapas({ etapas }: { etapas: EtapaApi[] }) {
  const porChave = new Map(etapas.map((e) => [e.chave, e]))

  return (
    <div className="flex items-center gap-1">
      {ETAPAS_PADRAO.map((def) => {
        const registro = porChave.get(def.chave)
        const cfg = registro ? RESULTADO_ICONE[registro.resultado] : null
        const Icone = cfg?.Icone

        return (
          <span
            key={def.chave}
            title={`${def.label}${registro ? ` — ${cfg!.titulo}` : ' — pendente'}`}
            className={`w-5 h-5 rounded-md border flex items-center justify-center ${
              cfg ? cfg.classe : 'border-dashed border-white/15 bg-transparent'
            }`}
          >
            {Icone ? <Icone className="w-3 h-3" /> : <span className="sr-only">pendente</span>}
          </span>
        )
      })}
    </div>
  )
}

function formatarData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CandidatosPage() {
  const [page, setPage] = useState(1)
  const [situacao, setSituacao] = useState('')
  const [operacaoId, setOperacaoId] = useState('')
  const [cargo, setCargo] = useState('')
  const [apenasFrontline, setApenasFrontline] = useState(false)
  // Seleção para mudar a situação de vários de uma vez.
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [situacaoMassa, setSituacaoMassa] = useState<SituacaoCandidato | ''>('')
  const [aplicando, setAplicando] = useState(false)
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [detalhe, setDetalhe] = useState<Candidato | null>(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  const querystring = useMemo(() => {
    const qs = new URLSearchParams({ page: String(page) })
    if (situacao) qs.set('situacao', situacao)
    if (operacaoId) qs.set('operacaoId', operacaoId)
    if (cargo) qs.set('cargo', cargo)
    if (buscaAtiva) qs.set('q', buscaAtiva)
    if (apenasFrontline) qs.set('frontline', '1')
    return qs.toString()
  }, [page, situacao, operacaoId, cargo, buscaAtiva, apenasFrontline])

  // Seleção vale para o que está na tela: mudar filtro ou página a desfaz,
  // senão a ação em massa atingiria gente que a pessoa não está vendo.
  useEffect(() => { setMarcados(new Set()) }, [querystring])

  const { data, error, isLoading, mutate } = useSWR<Resposta>(
    `/api/gente/candidatos?${querystring}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = operacoesData?.items ?? []

  const exportar = useCallback(async () => {
    setExportando(true)
    try {
      const res = await fetch(`/api/gente/candidatos?${querystring}&export=xlsx`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `candidatos-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Não foi possível exportar', variant: 'destructive' })
    } finally {
      setExportando(false)
    }
  }, [querystring])

  const aplicarSituacao = useCallback(async () => {
    if (!situacaoMassa || marcados.size === 0) return
    setAplicando(true)
    try {
      const res = await fetch('/api/gente/candidatos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(marcados), situacao: situacaoMassa }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível alterar')
      toast({
        title: `${json.alterados} candidato${json.alterados === 1 ? '' : 's'} em "${SITUACAO_LABEL[situacaoMassa]}"`,
        description: json.jaEstavam ? `${json.jaEstavam} já estava${json.jaEstavam === 1 ? '' : 'm'} nessa situação.` : undefined,
        variant: 'success',
      })
      setMarcados(new Set())
      setSituacaoMassa('')
      mutate()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Não foi possível alterar', variant: 'destructive' })
    } finally {
      setAplicando(false)
    }
  }, [situacaoMassa, marcados, mutate])

  const alternar = (id: string) =>
    setMarcados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const temFiltro = !!(situacao || operacaoId || cargo || buscaAtiva)

  if (data?.semEscopo) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</h2>
            <p className="text-slate-400 text-sm mt-1">
              Peça a um administrador para vincular as suas operações no cadastro de usuários.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/gente"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Candidatos</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} candidato${data.total === 1 ? '' : 's'}` : 'Carregando…'}
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
            href="/gente/candidatos/do-banco-de-talentos"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Do Banco de Talentos
          </Link>
          <Link
            href="/gente/candidatos/importar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link
            href="/gente/candidatos/novo"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <PainelFrontline
        apenasFrontline={apenasFrontline}
        aoFiltrar={(a) => { setApenasFrontline(a); setPage(1) }}
        operacaoId={operacaoId}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, cargo, telefone, e-mail…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>

        <select
          value={situacao}
          onChange={(e) => { setSituacao(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          <option value="">Todas as situações</option>
          {(Object.keys(SITUACAO_LABEL) as SituacaoCandidato[]).map((s) => (
            <option key={s} value={s}>{SITUACAO_LABEL[s]}</option>
          ))}
        </select>

        {/*
          As opções juntam as grafias do mesmo cargo ("AJUDANTE DISTRIBUIÇÃO",
          "Ajudante de Distribuição"...) numa só — senão a lista teria quatro
          entradas para a mesma função, cada uma achando uma parte das pessoas.
        */}
        <select
          value={cargo}
          onChange={(e) => { setCargo(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40 max-w-[240px]"
        >
          <option value="">Todos os cargos</option>
          {(data?.cargos ?? []).map((c) => (
            <option key={c.chave} value={c.chave}>{c.cargo} ({c.total})</option>
          ))}
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

        {temFiltro && (
          <button
            onClick={() => { setSituacao(''); setOperacaoId(''); setCargo(''); setBusca(''); setPage(1) }}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar os candidatos. Recarregue a página.
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
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="text-white font-medium">
              {temFiltro ? 'Nenhum candidato com esses filtros' : 'Nenhum candidato ainda'}
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              {temFiltro
                ? 'Ajuste os filtros para ver outros candidatos.'
                : 'Importe a planilha de stand-by ou traga alguém do Banco de Talentos.'}
            </p>
          </div>
          {!temFiltro && (
            <div className="flex items-center gap-2">
              <Link
                href="/gente/candidatos/importar"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Importar planilha
              </Link>
              <Link
                href="/gente/candidatos/do-banco-de-talentos"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Do Banco de Talentos
              </Link>
            </div>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-500"
              checked={marcados.size > 0 && marcados.size === data.items.length}
              ref={(el) => { if (el) el.indeterminate = marcados.size > 0 && marcados.size < data.items.length }}
              onChange={(e) => setMarcados(e.target.checked ? new Set(data.items.map((c) => c.id)) : new Set())}
            />
            Selecionar os {data.items.length} desta página
          </label>

          {marcados.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <span className="text-xs text-slate-300">
                {marcados.size} selecionado{marcados.size === 1 ? '' : 's'} · mudar situação para
              </span>
              <select
                value={situacaoMassa}
                onChange={(e) => setSituacaoMassa(e.target.value as SituacaoCandidato | '')}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-brand-500/40"
              >
                <option value="">Escolha…</option>
                {(Object.keys(SITUACAO_LABEL) as SituacaoCandidato[]).map((s) => (
                  <option key={s} value={s}>{SITUACAO_LABEL[s]}</option>
                ))}
              </select>
              <button
                onClick={aplicarSituacao}
                disabled={!situacaoMassa || aplicando}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {aplicando && <Loader2 className="w-3 h-3 animate-spin" />}
                Aplicar
              </button>
              <button
                onClick={() => setMarcados(new Set())}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
            {/*
              A caixa fica fora do cartão: o cartão inteiro é um <button>, e
              campo dentro de botão é HTML inválido — o clique abriria a ficha.
            */}
            <input
              type="checkbox"
              aria-label={`Selecionar ${c.nome}`}
              className="mt-5 w-4 h-4 shrink-0 accent-brand-500 cursor-pointer"
              checked={marcados.has(c.id)}
              onChange={() => alternar(c.id)}
            />
            <button
              onClick={() => setDetalhe(c)}
              className={`flex-1 min-w-0 text-left p-4 rounded-2xl border transition-all duration-200 ${
                marcados.has(c.id)
                  ? 'bg-brand-500/8 border-brand-500/30'
                  : 'bg-white/3 border-white/8 hover:border-brand-500/25 hover:bg-brand-500/5'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{c.nome}</span>
                    {c.candidaturaId && (
                      <span
                        className="text-[10px] text-brand-400 border border-brand-500/20 bg-brand-500/10 rounded px-1.5 py-0.5"
                        title="Veio do Banco de Talentos"
                      >
                        site
                      </span>
                    )}
                    {/*
                      Frontline em ambar, e nao em verde: verde na lista ja
                      significa etapa aprovada, e repetir a cor faria o selo
                      ser lido como resultado do processo em vez de natureza
                      do cargo.
                    */}
                    {c.frontline && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-500/30 bg-amber-500/15 rounded px-1.5 py-0.5"
                        title="Cargo de frontline: a vaga aberta pesa no índice de comprometimento de QLP"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        frontline
                      </span>
                    )}
                    {c.temCurriculo && <FileText className="w-3 h-3 text-slate-500" />}
                  </div>
                  <div className="text-slate-500 text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{c.cargo ?? 'Sem cargo definido'}</span>
                    <span>·</span>
                    <span>{c.operacao?.nome ?? 'Sem operação'}</span>
                    {c.telefone && <><span>·</span><span>{c.telefone}</span></>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <SituacaoBadge situacao={c.situacao} />
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {c.resumoEtapas.aprovadas}/{c.resumoEtapas.aplicaveis} etapas
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-white/5">
                <TrilhaEtapas etapas={c.etapas} />
                <span className="text-[11px] text-slate-500">
                  {c.resumoEtapas.bloqueada ? (
                    <span className="text-red-400">Reprovado em uma etapa</span>
                  ) : c.resumoEtapas.concluida ? (
                    <span className="text-emerald-400">Todas as etapas aprovadas</span>
                  ) : c.resumoEtapas.proxima ? (
                    <>Próxima: {c.resumoEtapas.proxima.label}</>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </button>
            </div>
          ))}
        </div>
      )}

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
          <span className="text-slate-400 text-sm tabular-nums">{data.page} de {data.pages}</span>
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

      <AnimatePresence>
        {detalhe && (
          <DrawerCandidato
            candidato={detalhe}
            onClose={() => setDetalhe(null)}
            onMudou={(atualizado) => {
              setDetalhe(atualizado)
              mutate()
            }}
            onExcluido={() => {
              setDetalhe(null)
              mutate()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200 mt-0.5 break-words">{valor || '—'}</dd>
    </div>
  )
}

function DrawerCandidato({
  candidato,
  onClose,
  onMudou,
  onExcluido,
}: {
  candidato: Candidato
  onClose: () => void
  onMudou: (c: Candidato) => void
  onExcluido: () => void
}) {
  const [salvandoEtapa, setSalvandoEtapa] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const porChave = new Map(candidato.etapas.map((e) => [e.chave, e]))

  async function marcarEtapa(chave: string, resultado: ResultadoEtapa) {
    setSalvandoEtapa(chave)
    try {
      const res = await fetch(`/api/gente/candidatos/${candidato.id}/etapas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapas: [{ chave, resultado }] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível salvar')

      onMudou(json as Candidato)
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Não foi possível salvar',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEtapa(null)
    }
  }

  async function excluir() {
    setExcluindo(true)
    try {
      const res = await fetch(`/api/gente/candidatos/${candidato.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível excluir')

      toast({ title: 'Candidato excluído', variant: 'success' })
      onExcluido()
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

  const etapasOrdenadas = ordenarEtapas(
    ETAPAS_PADRAO.map((d) => ({ chave: d.chave })).concat(
      candidato.etapas
        .filter((e) => !ETAPAS_PADRAO.some((d) => d.chave === e.chave))
        .map((e) => ({ chave: e.chave }))
    )
  )

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
        aria-label={`Detalhes de ${candidato.nome}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-white/10 z-50 overflow-y-auto"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 p-5 bg-surface border-b border-white/8">
          <div className="min-w-0">
            <h2 className="text-lg font-display font-bold text-white break-words">{candidato.nome}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {candidato.cargo ?? 'Sem cargo'} · {candidato.operacao?.nome ?? 'Sem operação'}
            </p>
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
            <SituacaoBadge situacao={candidato.situacao} />
            {candidato.candidaturaId && (
              <span className="text-[11px] text-brand-400 border border-brand-500/20 bg-brand-500/10 rounded-full px-2 py-0.5">
                Veio do Banco de Talentos
              </span>
            )}
            {candidato.vaga && (
              <Link
                href={`/gente/vagas/${candidato.vaga.id}/editar`}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 border border-white/10 rounded-full px-2 py-0.5 hover:text-white transition-colors"
              >
                Vaga: {candidato.vaga.cargo}
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>

          {/* Etapas — editáveis aqui mesmo */}
          <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
              <p className="text-slate-300 text-xs font-medium">Etapas do processo</p>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {candidato.resumoEtapas.aprovadas}/{candidato.resumoEtapas.aplicaveis} ·{' '}
                {candidato.resumoEtapas.percentual}%
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {etapasOrdenadas.map(({ chave }) => {
                const def = definicaoEtapa(chave)
                const registro = porChave.get(chave)
                const salvando = salvandoEtapa === chave

                return (
                  <div key={chave} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-200">{def.label}</div>
                      <div className="text-[11px] text-slate-500">
                        {/* Sem a data: o PO pediu so quem avaliou (2026-10-07). */}
                        {registro?.avaliador?.name ?? def.dica ?? 'Ainda não avaliada'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {salvando && <Loader2 className="w-3 h-3 text-slate-500 animate-spin mr-1" />}
                      {(['OK', 'NAO', 'NA'] as ResultadoEtapa[]).map((r) => {
                        const cfg = RESULTADO_ICONE[r]
                        const ativo = registro?.resultado === r
                        const Icone = cfg.Icone

                        return (
                          <button
                            key={r}
                            onClick={() => marcarEtapa(chave, r)}
                            disabled={salvando}
                            title={cfg.titulo}
                            aria-label={`${def.label}: ${cfg.titulo}`}
                            aria-pressed={ativo}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors disabled:opacity-40 ${
                              ativo ? cfg.classe : 'border-white/10 text-slate-600 hover:border-white/25 hover:text-slate-400'
                            }`}
                          >
                            <Icone className="w-3 h-3" />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {candidato.resumoEtapas.bloqueada && (
              <div className="flex items-start gap-2 px-4 py-2.5 border-t border-white/8 bg-red-500/5">
                <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">
                  Há etapa reprovada. O processo desta pessoa está interrompido — para retomar,
                  altere o resultado da etapa.
                </p>
              </div>
            )}
          </div>

          {candidato.temCurriculo && (
            <a
              href={`/api/gente/candidatos/${candidato.id}/cv`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Abrir currículo
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}

          <dl className="grid grid-cols-2 gap-4">
            <Campo label="Telefone" valor={candidato.telefone} />
            <Campo label="E-mail" valor={candidato.email} />
            <Campo label="Mês do processo" valor={candidato.mesProcesso} />
            <Campo label="Setor" valor={candidato.setor} />
            <Campo label="Escolaridade" valor={candidato.escolaridade} />
            <Campo label="Residência" valor={candidato.residencia} />
            <Campo label="Origem" valor={ORIGEM_LABEL[candidato.origemCurriculo]} />
            <Campo label="Quem indicou" valor={candidato.quemIndicou} />
            <Campo
              label="Situação final"
              valor={candidato.situacaoFinal ? SITUACAO_LABEL[candidato.situacaoFinal] : null}
            />
            <Campo label="Data da situação final" valor={formatarData(candidato.dataSituacaoFinal)} />
          </dl>

          {candidato.habilidades && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Habilidades</dt>
              <dd className="text-sm text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                {candidato.habilidades}
              </dd>
            </div>
          )}

          {candidato.observacao && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Observação</dt>
              <dd className="text-sm text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                {candidato.observacao}
              </dd>
            </div>
          )}

          <div className="pt-2 border-t border-white/8 space-y-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/gente/candidatos/${candidato.id}/editar`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
              >
                Editar dados
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
                <p className="text-sm text-white">Excluir este candidato em definitivo?</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  As etapas registradas vão junto e não dá para desfazer. Se a pessoa apenas não
                  seguiu no processo, prefira marcar a situação como &ldquo;Não contratado&rdquo;.
                  {candidato.candidaturaId &&
                    ' A candidatura original no Banco de Talentos é preservada.'}
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
