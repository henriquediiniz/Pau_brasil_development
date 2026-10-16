'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, ChevronLeft, LayoutGrid, Network, Plus, Search, ShieldAlert, Upload,
} from 'lucide-react'
import { PRONTIDAO_LABEL, type Prontidao } from '@/lib/gente/sucessao'

interface Item {
  id: string
  cargoSucessao: string
  areaCargoSucessao: string | null
  nomeSucessor: string
  cargoAtualSucessor: string | null
  planoDesenvolvimento: string | null
  cicloGente: string | null
  horizonte: Prontidao
  editavel: boolean
  operacao: { nome: string } | null
}

interface Cobertura {
  cargo: string
  sucessores: number
  prontosAgora: number
  emRisco: boolean
}

interface Resposta {
  items: Item[]
  total: number
  cobertura: Cobertura[]
  cargosEmRisco: number
  cargosMapeados: number
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const HORIZONTE_CLASSE: Record<Prontidao, string> = {
  agora: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '1_ano': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  '2_anos': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  nao_mapeado: 'text-slate-400 bg-white/5 border-white/10',
}

export default function SucessaoPage() {
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [operacaoId, setOperacaoId] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (buscaAtiva) p.set('q', buscaAtiva)
    if (operacaoId) p.set('operacaoId', operacaoId)
    return p.toString()
  }, [buscaAtiva, operacaoId])

  const { data, isLoading } = useSWR<Resposta>(`/api/gente/sucessao?${qs}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes?escopo=grupo',
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
          <h1 className="text-2xl font-display font-bold text-white">Sucessão — lista</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} mapeamento${data.total === 1 ? '' : 's'}` : 'Carregando…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/gente/sucessao"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Ver pipeline
          </Link>
          <Link href="/gente/sucessao/importar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link href="/gente/sucessao/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Cargos em risco — o número que importa */}
      {data && data.cargosMapeados > 0 && (
        <div
          className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl border ${
            data.cargosEmRisco > 0
              ? 'bg-red-500/5 border-red-500/20'
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className={`w-5 h-5 shrink-0 ${data.cargosEmRisco > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            <div>
              <div className="text-xl font-display font-bold text-white tabular-nums">
                {data.cargosEmRisco} de {data.cargosMapeados}
              </div>
              <div className="text-slate-500 text-[11px]">Cargos em risco</div>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed flex-1 min-w-[240px]">
            Cargo em risco é aquele sem nenhum sucessor pronto agora nem em 1 ano. O que importa não
            é quantos sucessores existem — é quantos cargos ficariam descobertos amanhã.
          </p>
        </div>
      )}

      {data && data.cobertura.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8">
            <p className="text-slate-300 text-xs font-medium">Cobertura por cargo</p>
          </div>
          <div className="divide-y divide-white/5">
            {data.cobertura.map((c) => (
              <div key={c.cargo} className="flex items-center gap-3 px-4 py-2">
                {c.emRisco && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
                <span className={`text-xs flex-1 truncate ${c.emRisco ? 'text-red-400' : 'text-slate-200'}`}>
                  {c.cargo}
                </span>
                <span className="text-slate-500 text-[11px] tabular-nums">
                  {c.prontosAgora} pronto{c.prontosAgora === 1 ? '' : 's'} de {c.sucessores}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Cargo, sucessor ou área…"
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
            <Network className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">Nenhum mapeamento de sucessão</p>
          <p className="text-slate-500 text-sm">Importe a planilha do ciclo de gente para começar.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-white font-medium">{s.cargoSucessao}</div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span className="text-slate-400">{s.nomeSucessor}</span>
                  {s.cargoAtualSucessor && <><span>·</span><span>hoje {s.cargoAtualSucessor}</span></>}
                  <span>·</span>
                  <span>{s.operacao?.nome ?? 'Sem operação'}</span>
                  {s.cicloGente && <><span>·</span><span>ciclo {s.cicloGente}</span></>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${HORIZONTE_CLASSE[s.horizonte]}`}>
                  {PRONTIDAO_LABEL[s.horizonte]}
                </span>
                {/*
                  O plano é visível para o grupo inteiro, mas editar continua
                  preso às operações do usuário. Sem esta checagem o botão
                  apareceria e o salvamento falharia depois.
                */}
                {s.editavel ? (
                  <Link
                    href={`/gente/sucessao/${s.id}/editar`}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                  >
                    Editar
                  </Link>
                ) : (
                  <span
                    className="px-2.5 py-1.5 rounded-lg border border-white/5 text-slate-600 text-xs"
                    title={`Mapeamento de ${s.operacao?.nome ?? 'outra operação'} — você pode consultar, mas não editar`}
                  >
                    Outra operação
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
