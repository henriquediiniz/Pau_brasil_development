'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { AlertTriangle, CheckCircle2, ChevronLeft, ClipboardList, Plus, Search, Upload } from 'lucide-react'
import { SITUACAO_INTERNO_LABEL, SITUACOES_INTERNO, type SituacaoInterno } from '@/lib/gente/sucessao'
import { LOTACOES, LOTACAO_LABEL } from '@/lib/gente/matriz-filial'
import { POLOS, operacoesDoPolo } from '@/lib/gente/polos'

interface Interno {
  id: string
  nome: string
  cargoAtual: string | null
  setorAtual: string | null
  cargoPretendido: string | null
  tempoFuncao: string | null
  avaliacaoCiclo: string | null
  possuiRequisitos: boolean
  matrizOuFilial: string | null
  situacao: SituacaoInterno
  futurosCargos: string[]
  operacao: { nome: string } | null
}

interface Resposta {
  items: Interno[]
  total: number
  prontos: number
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const SITUACAO_CLASSE: Record<SituacaoInterno, string> = {
  AGUARDANDO: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PROMOVIDO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  NAO_ATENDE: 'text-slate-400 bg-white/5 border-white/10',
  DESLIGADO: 'text-red-400 bg-red-500/10 border-red-500/20',
  OUTRA: 'text-slate-400 bg-white/5 border-white/10',
}

export default function InternosPage() {
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [situacao, setSituacao] = useState('')
  const [lotacao, setLotacao] = useState('')
  const [polo, setPolo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (buscaAtiva) p.set('q', buscaAtiva)
    if (situacao) p.set('situacao', situacao)
    if (lotacao) p.set('lotacao', lotacao)
    if (polo) p.set('polo', polo)
    return p.toString()
  }, [buscaAtiva, situacao, lotacao, polo])

  const { data, isLoading } = useSWR<Resposta>(`/api/gente/internos?${qs}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string; nomeAbrev: string | null }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )

  // So oferece o polo que tem operacao no escopo do usuario: quem cuida so de
  // Patos nao precisa ver "Brumado + Cacule + Barra" e receber lista vazia.
  const polosVisiveis = useMemo(
    () => POLOS.filter((p) => operacoesDoPolo(p, operacoesData?.items ?? []).length > 0),
    [operacoesData]
  )

  if (data?.semEscopo) {
    return (
      <div className="max-w-2xl mx-auto flex items-start gap-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</h2>
          <p className="text-slate-400 text-sm mt-1">Peça a um administrador para vincular as suas operações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/gente" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Candidatos Internos</h1>
          <p className="text-slate-400 text-sm">
            {data
              ? `${data.total} mapeado${data.total === 1 ? '' : 's'} · ${data.prontos} com requisitos, aguardando`
              : 'Carregando…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/gente/candidatos/internos/importar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link href="/gente/candidatos/internos/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, cargo atual ou pretendido…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>
        <select
          value={situacao}
          onChange={(e) => setSituacao(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          <option value="">Todas as situações</option>
          {SITUACOES_INTERNO.map((s) => (
            <option key={s} value={s}>{SITUACAO_INTERNO_LABEL[s]}</option>
          ))}
        </select>
        {polosVisiveis.length > 1 && (
          <select
            value={polo}
            onChange={(e) => setPolo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Todas as operações</option>
            {polosVisiveis.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
          </select>
        )}
        <select
          value={lotacao}
          onChange={(e) => setLotacao(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          <option value="">Matriz e filial</option>
          {LOTACOES.map((l) => (
            <option key={l} value={l}>{LOTACAO_LABEL[l]}</option>
          ))}
        </select>
      </div>

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">Nenhum candidato interno mapeado</p>
          <p className="text-slate-500 text-sm">
            Importe a planilha do ciclo de gente para começar.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium">{i.nome}</span>
                  {i.possuiRequisitos && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded px-1.5 py-0.5" title="Já possui os requisitos do cargo pretendido">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      requisitos
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{i.cargoAtual ?? 'Sem cargo atual'}</span>
                  {i.cargoPretendido && (
                    <>
                      <span>→</span>
                      <span className="text-slate-400">{i.cargoPretendido}</span>
                    </>
                  )}
                  {i.tempoFuncao && <><span>·</span><span>{i.tempoFuncao} na função</span></>}
                  {i.avaliacaoCiclo && <><span>·</span><span>{i.avaliacaoCiclo}</span></>}
                  {i.operacao && <><span>·</span><span>{i.operacao.nome}</span></>}
                  {/* Mostra o texto como veio da planilha, nao a classificacao:
                      "Filial Sousa" diz mais do que "Filial", e e por ele que o
                      RH percebe uma digitacao que ficou fora dos dois grupos. */}
                  {i.matrizOuFilial && <><span>·</span><span>{i.matrizOuFilial}</span></>}
                  {!i.matrizOuFilial && (
                    <><span>·</span><span className="text-slate-600">sem matriz/filial</span></>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${SITUACAO_CLASSE[i.situacao]}`}>
                  {SITUACAO_INTERNO_LABEL[i.situacao]}
                </span>
                <Link
                  href={`/gente/candidatos/internos/${i.id}/editar`}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
