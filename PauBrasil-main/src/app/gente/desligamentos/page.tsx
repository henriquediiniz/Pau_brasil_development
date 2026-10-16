'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, LogOut, Search, Upload,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { PERIODO_LABEL, PERIODOS, type Periodo } from '@/lib/gente/dashboard'

interface Desligamento {
  id: string
  nome: string
  cargo: string | null
  area: string | null
  setor: 'DPO' | 'SPO' | null
  dataDesligamento: string
  motivo: string | null
  operacao: { id: string; nome: string } | null
}

interface Resposta {
  items: Desligamento[]
  total: number
  page: number
  pages: number
  quadroAtivo: number
  turnover: number | null
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export default function DesligamentosPage() {
  const [page, setPage] = useState(1)
  const [operacaoId, setOperacaoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>('12m')
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), periodo })
    if (operacaoId) p.set('operacaoId', operacaoId)
    if (buscaAtiva) p.set('q', buscaAtiva)
    return p.toString()
  }, [page, periodo, operacaoId, buscaAtiva])

  const { data, error, isLoading } = useSWR<Resposta>(
    `/api/gente/desligamentos?${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = operacoesData?.items ?? []

  async function exportar() {
    try {
      const res = await fetch(`/api/gente/desligamentos?${qs}&export=xlsx`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `desligamentos-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Não foi possível exportar', variant: 'destructive' })
    }
  }

  if (data?.semEscopo) {
    return (
      <div className="max-w-2xl mx-auto flex items-start gap-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</h2>
          <p className="text-slate-400 text-sm mt-1">
            Peça a um administrador para vincular as suas operações.
          </p>
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
          <h1 className="text-2xl font-display font-bold text-white">Desligamentos</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} no período` : 'Carregando…'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportar}
            disabled={!data?.total}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <Link
            href="/gente/desligamentos/importar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Link>
        </div>
      </div>

      {/* Turnover */}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/8">
          <div>
            <div className="text-2xl font-display font-bold text-white tabular-nums">
              {data.turnover === null ? '—' : `${data.turnover}%`}
            </div>
            <div className="text-slate-500 text-[11px]">Turnover no período</div>
          </div>
          <div className="text-slate-400 text-xs leading-relaxed max-w-md">
            {data.total} saída{data.total === 1 ? '' : 's'} sobre um quadro ativo de{' '}
            {data.quadroAtivo}.{' '}
            <span className="text-slate-500">
              É uma aproximação: o sistema ainda não guarda o histórico mensal de headcount, então
              usa o quadro de hoje como base.
            </span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, cargo ou motivo…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>

        <select
          value={periodo}
          onChange={(e) => { setPeriodo(e.target.value as Periodo); setPage(1) }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
        >
          {PERIODOS.map((p) => (
            <option key={p} value={p}>{PERIODO_LABEL[p]}</option>
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
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar os desligamentos.
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="text-white font-medium">Nenhum desligamento neste período</p>
            <p className="text-slate-500 text-sm mt-0.5">
              Amplie o período ou importe o histórico do RH.
            </p>
          </div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium">{d.nome}</span>
                  {d.setor && (
                    <span className="text-[10px] text-slate-400 border border-white/10 rounded px-1.5 py-0.5">
                      {d.setor}
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{d.cargo ?? 'Sem cargo'}</span>
                  <span>·</span>
                  <span>{d.operacao?.nome ?? 'Sem operação'}</span>
                  {d.motivo && <><span>·</span><span className="truncate">{d.motivo}</span></>}
                </div>
              </div>

              <span className="text-slate-400 text-xs tabular-nums shrink-0">
                {new Date(d.dataDesligamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </span>
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
    </div>
  )
}
