'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, GraduationCap, Plus, Search, Upload,
} from 'lucide-react'
import { SITUACAO_VIGENCIA_LABEL, type SituacaoVigencia } from '@/lib/gente/cotas'

interface Aprendiz {
  id: string
  nome: string
  funcao: string | null
  departamento: string | null
  fundacao: string | null
  gestorNome: string | null
  inicioContrato: string | null
  terminoContrato: string | null
  situacao: 'VIGENTE' | 'ENCERRADO' | 'DESLIGADO'
  operacao: { id: string; nome: string } | null
  vigencia: { situacao: SituacaoVigencia; diasRestantes: number | null }
}

interface Resposta {
  items: Aprendiz[]
  total: number
  cota: {
    quadro: number
    minimo: number
    maximo: number
    contratados: number
    emDia: boolean
    acimaDoTeto: boolean
    faltam: number
  }
  vencendo: number
  vencidos: number
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const VIGENCIA_CLASSE: Record<SituacaoVigencia, string> = {
  vigente: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  vencendo: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  vencido: 'text-red-400 bg-red-500/10 border-red-500/20',
  sem_contrato: 'text-slate-400 bg-white/5 border-white/10',
}

export default function AprendizesPage() {
  const [operacaoId, setOperacaoId] = useState('')
  const [soVencendo, setSoVencendo] = useState(false)
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (operacaoId) p.set('operacaoId', operacaoId)
    if (buscaAtiva) p.set('q', buscaAtiva)
    if (soVencendo) p.set('vencendo', 'true')
    return p.toString()
  }, [operacaoId, buscaAtiva, soVencendo])

  const { data, error, isLoading } = useSWR<Resposta>(`/api/gente/aprendizes?${qs}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = operacoesData?.items ?? []

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
          <h1 className="text-2xl font-display font-bold text-white">Jovens Aprendizes</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} contrato${data.total === 1 ? '' : 's'}` : 'Carregando…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/gente/aprendizes/importar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link href="/gente/aprendizes/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Cota legal + alerta de vencimento */}
      {data && (
        <div className="grid sm:grid-cols-2 gap-2">
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl border ${
              data.cota.emDia
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {data.cota.emDia ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-xl font-display font-bold text-white tabular-nums">
                {data.cota.contratados} / {data.cota.minimo}–{data.cota.maximo}
              </div>
              <div className="text-slate-500 text-[11px] leading-relaxed">
                Faixa legal (5% a 15% de {data.cota.quadro}).{' '}
                {data.cota.acimaDoTeto
                  ? 'Acima do teto legal.'
                  : data.cota.faltam > 0
                  ? `Faltam ${data.cota.faltam}.`
                  : 'Dentro da faixa.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSoVencendo((v) => !v)}
            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors ${
              soVencendo
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-white/3 border-white/8 hover:bg-white/5'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 shrink-0 ${
                data.vencendo + data.vencidos > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            />
            <div className="min-w-0">
              <div className="text-xl font-display font-bold text-white tabular-nums">
                {data.vencendo + data.vencidos}
              </div>
              <div className="text-slate-500 text-[11px] leading-relaxed">
                Contratos vencendo em até 60 dias ou já vencidos.
                {soVencendo ? ' Clique para ver todos.' : ' Clique para filtrar.'}
              </div>
            </div>
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, função, fundação ou gestor…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>
        {operacoes.length > 1 && (
          <select
            value={operacaoId}
            onChange={(e) => setOperacaoId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Todas as operações</option>
            {operacoes.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
          </select>
        )}
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar.
        </div>
      )}

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
            <GraduationCap className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">
            {soVencendo ? 'Nenhum contrato vencendo' : 'Nenhum aprendiz cadastrado'}
          </p>
          <p className="text-slate-500 text-sm">
            {soVencendo ? 'Bom sinal.' : 'Importe a planilha do RH para começar.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-white font-medium">{a.nome}</div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{a.funcao ?? 'Sem função'}</span>
                  <span>·</span>
                  <span>{a.operacao?.nome ?? 'Sem operação'}</span>
                  {a.fundacao && <><span>·</span><span>{a.fundacao}</span></>}
                  {a.gestorNome && <><span>·</span><span>Gestor: {a.gestorNome}</span></>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${VIGENCIA_CLASSE[a.vigencia.situacao]}`}
                  title={
                    a.terminoContrato
                      ? `Término em ${new Date(a.terminoContrato).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                      : 'Sem data de término cadastrada'
                  }
                >
                  {SITUACAO_VIGENCIA_LABEL[a.vigencia.situacao]}
                  {a.vigencia.diasRestantes !== null && a.vigencia.situacao === 'vencendo' &&
                    ` · ${a.vigencia.diasRestantes}d`}
                  {a.vigencia.diasRestantes !== null && a.vigencia.situacao === 'vencido' &&
                    ` · há ${Math.abs(a.vigencia.diasRestantes)}d`}
                </span>
                <Link
                  href={`/gente/aprendizes/${a.id}/editar`}
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
