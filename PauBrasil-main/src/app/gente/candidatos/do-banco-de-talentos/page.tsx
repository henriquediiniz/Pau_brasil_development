'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  ArrowRight, ChevronLeft, ChevronRight, FileText, Loader2, Search, UserPlus, X,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { ETAPA_ESTILO, ETAPA_LABEL, FiltroEtapa } from './_components/FiltroEtapa'

interface Candidatura {
  id: string
  nome: string
  email: string
  telefone: string | null
  cidade: string
  estado: string
  cargosInteresse: string[]
  etapa: string
  createdAt: string
  temCurriculo: boolean
}

interface Resposta {
  items: Candidatura[]
  total: number
  page: number
  pages: number
  porEtapa: Record<string, number>
  totalGeral: number
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

/**
 * Traz quem se candidatou pelo site para dentro do processo seletivo.
 * Antes isso era digitação manual entre dois sistemas.
 */
export default function DoBancoDeTalentosPage() {
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [selecionada, setSelecionada] = useState<Candidatura | null>(null)
  const [etapa, setEtapa] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams({ page: String(page) })
    if (buscaAtiva) p.set('q', buscaAtiva)
    if (etapa) p.set('etapa', etapa)
    return p.toString()
  }, [page, buscaAtiva, etapa])

  const { data, isLoading, mutate } = useSWR<Resposta>(
    `/api/gente/candidatos/disponiveis?${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/candidatos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Candidatos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Do Banco de Talentos</h1>
        <p className="text-slate-400 text-sm">
          Quem se candidatou pelo site e ainda não está no processo seletivo.
          {data ? ` ${data.total} pessoa${data.total === 1 ? '' : 's'}.` : ''}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome, e-mail ou cidade…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
        />
      </div>

      <FiltroEtapa
        etapa={etapa}
        porEtapa={data?.porEtapa ?? {}}
        totalGeral={data?.totalGeral ?? 0}
        aoMudar={(e) => { setEtapa(e); setPage(1) }}
      />

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">
            {buscaAtiva ? 'Ninguém encontrado com essa busca' : 'Todo mundo já está no processo'}
          </p>
          <p className="text-slate-500 text-sm">
            {buscaAtiva
              ? 'Tente outro termo.'
              : 'As candidaturas do site aparecem aqui assim que chegam.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/3 border border-white/8"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{c.nome}</span>
                  {/*
                    A etapa em cada linha: sem ela, "trazer para o processo"
                    oferece com o mesmo peso quem acabou de se candidatar e
                    quem ja passou por tudo.
                  */}
                  <span
                    className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${
                      ETAPA_ESTILO[c.etapa] ?? ETAPA_ESTILO.RECEBIDO
                    }`}
                  >
                    {ETAPA_LABEL[c.etapa] ?? c.etapa}
                  </span>
                  {c.temCurriculo && <FileText className="w-3 h-3 text-slate-500" />}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{c.cidade} - {c.estado}</span>
                  {c.cargosInteresse.length > 0 && (
                    <><span>·</span><span className="truncate">{c.cargosInteresse.join(', ')}</span></>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelecionada(c)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors shrink-0"
              >
                Trazer para o processo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/8 disabled:opacity-30 transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-400 text-sm tabular-nums">{data.page} de {data.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/8 disabled:opacity-30 transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selecionada && (
        <ModalPromover
          candidatura={selecionada}
          onFechar={() => setSelecionada(null)}
          onPromovida={() => {
            setSelecionada(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}

// ─── Modal de promoção ────────────────────────────────────────────────────────

function ModalPromover({
  candidatura,
  onFechar,
  onPromovida,
}: {
  candidatura: Candidatura
  onFechar: () => void
  onPromovida: () => void
}) {
  const [operacaoId, setOperacaoId] = useState('')
  const [cargo, setCargo] = useState(candidatura.cargosInteresse[0] ?? '')
  const [vagaId, setVagaId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  // Memoizado porque o efeito de pré-seleção depende desta lista: sem isso o
  // `?? []` cria um array novo a cada render e o efeito roda sem parar.
  const operacoes = useMemo(() => operacoesData?.items ?? [], [operacoesData])

  // Vagas abertas da operação escolhida, para já vincular a pessoa a uma delas.
  const { data: vagasData } = useSWR<{ items: { id: string; cargo: string }[] }>(
    operacaoId ? `/api/gente/vagas?status=ABERTA&operacaoId=${operacaoId}&limit=100` : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  const vagas = vagasData?.items ?? []

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onFechar])

  // Uma operação só: já vem escolhida.
  useEffect(() => {
    if (operacoes.length === 1 && !operacaoId) setOperacaoId(operacoes[0].id)
  }, [operacoes, operacaoId])

  async function promover() {
    if (!operacaoId) {
      setErro('Escolha a operação')
      return
    }

    setSalvando(true)
    setErro('')
    try {
      const res = await fetch('/api/gente/candidatos/promover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidaturaId: candidatura.id,
          operacaoId,
          cargo: cargo.trim() || null,
          vagaId: vagaId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível trazer para o processo')

      toast({ title: `${candidatura.nome} entrou no processo`, variant: 'success' })
      onPromovida()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível trazer para o processo')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Trazer ${candidatura.nome} para o processo`}
        className="relative w-full max-w-md rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-white">{candidatura.nome}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {candidatura.cidade} - {candidatura.estado} · {candidatura.email}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed">
          A candidatura original continua no Banco de Talentos — ela é o registro de que a pessoa se
          inscreveu, com o consentimento que ela deu. O que nasce aqui é o acompanhamento do processo,
          já com o currículo anexado.
        </p>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">
            Operação <span className="text-brand-400">*</span>
          </span>
          <select
            value={operacaoId}
            onChange={(e) => { setOperacaoId(e.target.value); setVagaId('') }}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Selecione…</option>
            {operacoes.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Cargo</span>
          <input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Cargo no processo"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
          {candidatura.cargosInteresse.length > 0 && (
            <span className="block text-[11px] text-slate-500 mt-1">
              Interesse declarado: {candidatura.cargosInteresse.join(', ')}
            </span>
          )}
        </label>

        {operacaoId && vagas.length > 0 && (
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Vincular a uma vaga aberta</span>
            <select
              value={vagaId}
              onChange={(e) => setVagaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
            >
              <option value="">Sem vaga por enquanto</option>
              {vagas.map((v) => (
                <option key={v.id} value={v.id}>{v.cargo}</option>
              ))}
            </select>
          </label>
        )}

        {erro && <p className="text-red-400 text-xs">{erro}</p>}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={promover}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 transition-colors"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Trazer para o processo
          </button>
          <button
            onClick={onFechar}
            disabled={salvando}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
