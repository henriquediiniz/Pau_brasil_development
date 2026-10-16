'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, Link2, Loader2, LogOut,
  Plus, Search, Upload, UsersRound, X, CheckSquare, Square, Trash2,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { formatarCpf } from '@/lib/gente/cpf'

interface Colaborador {
  id: string
  nome: string
  cargo: string | null
  area: string | null
  matricula: string | null
  cpf: string | null
  dataAdmissao: string | null
  ativo: boolean
  operacao: { id: string; nome: string } | null
  user: { id: string; name: string | null; email: string; isActive: boolean } | null
}

/** UTC para a data não recuar um dia no fuso do navegador. */
function formatarData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

interface Resposta {
  items: Colaborador[]
  total: number
  page: number
  pages: number
  ativos: number
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export default function QuadroPage() {
  const [page, setPage] = useState(1)
  const [operacaoId, setOperacaoId] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [desligando, setDesligando] = useState<Colaborador | null>(null)

  /*
    Selecao em massa. Guardamos ids, nao indices: a lista e paginada e
    refiltrada o tempo todo, e indice deixaria de apontar para a mesma pessoa
    na primeira mudanca de filtro.
  */
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [desligandoEmMassa, setDesligandoEmMassa] = useState(false)
  const [executando, setExecutando] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams({ page: String(page) })
    if (operacaoId) p.set('operacaoId', operacaoId)
    if (buscaAtiva) p.set('q', buscaAtiva)
    if (incluirInativos) p.set('incluirInativos', 'true')
    return p.toString()
  }, [page, operacaoId, buscaAtiva, incluirInativos])

  const { data, error, isLoading, mutate } = useSWR<Resposta>(
    `/api/gente/quadro?${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = operacoesData?.items ?? []

  // Trocar filtro ou pagina limpa a selecao: manter marcado quem saiu da tela
  // e o caminho curto para alguem excluir o que nao estava vendo.
  useEffect(() => {
    setSelecionados(new Set())
  }, [qs])

  // Estavel entre renders, senao os callbacks abaixo trocam de identidade a
  // cada ciclo sem motivo.
  const itens = useMemo(() => data?.items ?? [], [data])
  const marcados = useMemo(
    () => itens.filter((c) => selecionados.has(c.id)),
    [itens, selecionados]
  )
  const ativosMarcados = marcados.filter((c) => c.ativo).length
  const todosMarcados = itens.length > 0 && itens.every((c) => selecionados.has(c.id))

  const alternar = useCallback((id: string) => {
    setSelecionados((atual) => {
      const proxima = new Set(atual)
      if (proxima.has(id)) proxima.delete(id)
      else proxima.add(id)
      return proxima
    })
  }, [])

  const alternarTodos = useCallback(() => {
    // "Todos" e sempre o que esta na tela, nunca o total do filtro: marcar
    // centenas num clique sem poder conferir e o tipo de atalho que causa
    // estrago.
    setSelecionados((atual) =>
      itens.every((c) => atual.has(c.id)) ? new Set() : new Set(itens.map((c) => c.id))
    )
  }, [itens])

  const excluirSelecionados = useCallback(async () => {
    setExecutando(true)
    try {
      const res = await fetch('/api/gente/quadro', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selecionados) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível excluir')

      toast({ title: `${json.excluidos} excluído(s) do quadro`, variant: 'success' })
      setSelecionados(new Set())
      setConfirmandoExclusao(false)
      mutate()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Não foi possível excluir',
        variant: 'destructive',
      })
    } finally {
      setExecutando(false)
    }
  }, [selecionados, mutate])

  async function exportar() {
    try {
      const res = await fetch(`/api/gente/quadro?${qs}&export=xlsx`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quadro-${new Date().toISOString().slice(0, 10)}.xlsx`
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
            Peça a um administrador para vincular as suas operações no cadastro de usuários.
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
          <h1 className="text-2xl font-display font-bold text-white">Quadro de pessoal</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.ativos} no quadro ativo` : 'Carregando…'}
            {data && incluirInativos && ` · ${data.total} no total, com os desligados`}
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
            href="/gente/quadro/importar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link
            href="/gente/quadro/novo"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
          >
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
            placeholder="Nome, cargo ou área…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
        </div>

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

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => { setIncluirInativos(e.target.checked); setPage(1) }}
            className="accent-brand-500"
          />
          Mostrar desligados
        </label>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar o quadro.
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <UsersRound className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="text-white font-medium">
              {buscaAtiva || operacaoId ? 'Ninguém com esses filtros' : 'Quadro ainda vazio'}
            </p>
            <p className="text-slate-500 text-sm mt-0.5">
              Importe a planilha de QLP para começar.
            </p>
          </div>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={alternarTodos}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs transition-colors"
          >
            {todosMarcados ? (
              <CheckSquare className="w-4 h-4 text-brand-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {todosMarcados ? 'Desmarcar' : 'Selecionar'} os {data.items.length} desta página
          </button>

          {selecionados.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 text-xs tabular-nums">
                {selecionados.size} selecionado{selecionados.size === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => setSelecionados(new Set())}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={() => setDesligandoEmMassa(true)}
                disabled={ativosMarcados === 0}
                title={
                  ativosMarcados === 0
                    ? 'Os selecionados já estão fora do quadro ativo'
                    : undefined
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desligar {ativosMarcados > 0 ? ativosMarcados : ''}
              </button>
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((c) => (
            <div
              key={c.id}
              className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors ${
                selecionados.has(c.id) ? 'bg-brand-500/8' : ''
              }`}
            >
              <button
                onClick={() => alternar(c.id)}
                aria-pressed={selecionados.has(c.id)}
                aria-label={`Selecionar ${c.nome}`}
                className="text-slate-500 hover:text-brand-400 transition-colors shrink-0"
              >
                {selecionados.has(c.id) ? (
                  <CheckSquare className="w-4 h-4 text-brand-400" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${c.ativo ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {c.nome}
                  </span>
                  {c.user && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] text-brand-400 border border-brand-500/20 bg-brand-500/10 rounded px-1.5 py-0.5"
                      title={`Vinculado ao usuário ${c.user.email}`}
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      portal
                    </span>
                  )}
                  {!c.ativo && (
                    <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
                      desligado
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  {c.matricula && (
                    <>
                      <span className="font-mono text-slate-400">{c.matricula}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>{c.cargo ?? 'Sem cargo'}</span>
                  {c.area && <><span>·</span><span>{c.area}</span></>}
                  <span>·</span>
                  <span>{c.operacao?.nome ?? 'Sem operação'}</span>
                  {c.dataAdmissao && (
                    <>
                      <span>·</span>
                      <span>desde {formatarData(c.dataAdmissao)}</span>
                    </>
                  )}
                  {c.cpf && (
                    <><span>·</span><span className="font-mono">{formatarCpf(c.cpf)}</span></>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href={`/gente/quadro/${c.id}/editar`}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                >
                  Editar
                </Link>
                {c.ativo && (
                  <button
                    onClick={() => setDesligando(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Desligar
                  </button>
                )}
              </div>
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

      <AnimatePresence>
        {desligando && (
          <ModalDesligar
            alvos={[desligando]}
            onFechar={() => setDesligando(null)}
            onDesligado={() => {
              setDesligando(null)
              mutate()
            }}
          />
        )}

        {desligandoEmMassa && ativosMarcados > 0 && (
          <ModalDesligar
            // Só os que ainda estão no quadro: desligar quem já saiu geraria um
            // segundo registro para a mesma saída.
            alvos={marcados.filter((c) => c.ativo)}
            onFechar={() => setDesligandoEmMassa(false)}
            onDesligado={() => {
              setDesligandoEmMassa(false)
              setSelecionados(new Set())
              mutate()
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={confirmandoExclusao}
        loading={executando}
        title={`Excluir ${selecionados.size} do quadro?`}
        description="Apaga o cadastro em definitivo, sem gerar registro de desligamento. Para registrar uma saída com data e motivo, use Desligar — assim a pessoa continua no histórico e no turnover."
        confirmLabel="Excluir cadastros"
        onConfirm={excluirSelecionados}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </div>
  )
}

// ─── Modal de desligamento ────────────────────────────────────────────────────

/**
 * Serve para uma pessoa e para uma leva.
 *
 * É o mesmo formulário porque é a mesma decisão — data, motivo e setor —, e
 * duplicá-lo abriria espaço para as duas telas divergirem no que perguntam.
 */
function ModalDesligar({
  alvos,
  onFechar,
  onDesligado,
}: {
  alvos: Colaborador[]
  onFechar: () => void
  onDesligado: () => void
}) {
  const emMassa = alvos.length > 1
  const comConta = alvos.filter((c) => c.user).length
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [motivo, setMotivo] = useState('')
  const [setor, setSetor] = useState<'' | 'DPO' | 'SPO'>('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onFechar])

  async function confirmar() {
    if (!data) {
      setErro('Informe a data do desligamento')
      return
    }

    setSalvando(true)
    setErro('')
    try {
      const res = emMassa
        ? await fetch('/api/gente/quadro', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              acao: 'desligar',
              ids: alvos.map((c) => c.id),
              dataDesligamento: data,
              motivo: motivo.trim() || null,
              setor: setor || null,
            }),
          })
        : await fetch(`/api/gente/quadro/${alvos[0].id}/desligar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataDesligamento: data,
              motivo: motivo.trim() || null,
              setor: setor || null,
            }),
          })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível desligar')

      toast({
        title: emMassa
          ? `${json.desligados} saíram do quadro`
          : `${alvos[0].nome} saiu do quadro`,
        variant: 'success',
      })
      onDesligado()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível desligar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onFechar}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        role="dialog"
        aria-modal="true"
        aria-label={emMassa ? `Desligar ${alvos.length} do quadro` : `Desligar ${alvos[0].nome}`}
        className="relative w-full max-w-md rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-white">
              {emMassa ? `Desligar ${alvos.length} do quadro` : 'Desligar do quadro'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {emMassa
                ? // Mostra os primeiros para conferir antes de confirmar: uma
                  // contagem sozinha não diz quem vai sair.
                  alvos.slice(0, 3).map((c) => c.nome).join(', ') +
                  (alvos.length > 3 ? ` e mais ${alvos.length - 3}` : '')
                : `${alvos[0].nome} · ${alvos[0].cargo ?? 'sem cargo'} · ${
                    alvos[0].operacao?.nome ?? 'sem operação'
                  }`}
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
          {emMassa
            ? 'A mesma data e o mesmo motivo valem para todos. O cadastro não é apagado — quem saiu continua no histórico e no cálculo de turnover.'
            : 'Isso registra o desligamento e tira a pessoa da lotação, numa operação só. O cadastro não é apagado — quem saiu continua no histórico e no cálculo de turnover.'}
          {comConta > 0 && (
            <span className="block mt-1 text-amber-400">
              {emMassa
                ? `${comConta} têm conta no portal. Os acessos `
                : 'Esta pessoa tem conta no portal. O acesso dela '}
              <strong>não</strong> {emMassa ? 'são' : 'é'} revogado
              {emMassa ? 's' : ''} automaticamente — trate isso no cadastro de usuários.
            </span>
          )}
        </p>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">
            Data do desligamento <span className="text-brand-400">*</span>
          </span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
          />
        </label>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Motivo</span>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Pedido de demissão"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
          />
          <span className="block text-[11px] text-slate-500 mt-1">
            Sem motivo, a análise de turnover fica cega.
          </span>
        </label>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Setor</span>
          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value as '' | 'DPO' | 'SPO')}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
          >
            <option value="">—</option>
            <option value="DPO">DPO</option>
            <option value="SPO">SPO</option>
          </select>
        </label>

        {erro && <p className="text-red-400 text-xs">{erro}</p>}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={confirmar}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Confirmar desligamento
          </button>
          <button
            onClick={onFechar}
            disabled={salvando}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
