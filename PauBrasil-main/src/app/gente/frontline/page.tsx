'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR, { mutate as revalidar } from 'swr'
import { AlertTriangle, ChevronLeft, Plus, Target, Trash2 } from 'lucide-react'
import {
  DEPARTAMENTOS, DEPARTAMENTO_LABEL,
  type Departamento, type LinhaFrontline, type ResumoSegmento,
} from '@/lib/gente/frontline'

interface Resposta {
  semEscopo?: boolean
  ano: number
  teto: number
  linhas: LinhaFrontline[]
  resumos: ResumoSegmento[]
  geral: { qlpMeta: number; qlpReal: number; vagasAbertas: number; comprometimento: number; acimaDoTeto: boolean }
  operacoes: { id: string; nome: string }[]
  podeEditar: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const pct = (n: number) => `${n.toFixed(2).replace('.', ',')}%`

export default function FrontlinePage() {
  const [operacaoId, setOperacaoId] = useState('')
  const [departamento, setDepartamento] = useState<Departamento>('DPO')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [novoAberto, setNovoAberto] = useState(false)

  const qs = useMemo(() => {
    const p = new URLSearchParams({ ano: String(ano) })
    if (operacaoId) p.set('operacaoId', operacaoId)
    return p.toString()
  }, [ano, operacaoId])

  const chave = `/api/gente/frontline?${qs}`
  const { data, error, isLoading } = useSWR<Resposta>(chave, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const recarregar = () => revalidar(chave)

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

  const doDepartamento = (data?.linhas ?? []).filter((l) => l.departamento === departamento)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/gente" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Vagas Frontline</h1>
          <p className="text-slate-400 text-sm">
            Quanto do quadro previsto está descoberto hoje — QLP meta contra vagas abertas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={operacaoId}
            onChange={(e) => setOperacaoId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Todas as operações</option>
            {data?.operacoes.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
          </select>
          {data?.podeEditar && (
            <button
              onClick={() => setNovoAberto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo cargo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar o acompanhamento.
        </div>
      )}

      {isLoading && !data && (
        <div className="grid lg:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* Resumo por departamento */}
          <div className="grid lg:grid-cols-2 gap-3">
            {data.resumos.map((r) => (
              <CartaoSegmento key={r.departamento} resumo={r} teto={data.teto} />
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white/3 border border-white/8">
            <span className="text-slate-500 text-[11px] uppercase tracking-wide">Departamento</span>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {DEPARTAMENTOS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDepartamento(d)}
                  aria-pressed={departamento === d}
                  className={`px-4 py-1.5 text-sm transition-colors ${
                    departamento === d
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'bg-white/3 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <span className="text-slate-500 text-[11px] uppercase tracking-wide ml-2">Ano</span>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value) || ano)}
              className="w-24 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white tabular-nums focus:outline-none focus:border-brand-500/40"
            />

            <div className="flex-1" />

            <TetoEditavel ano={data.ano} teto={data.teto} podeEditar={data.podeEditar} aoSalvar={recarregar} />
          </div>

          {/* Tabela */}
          <Tabela
            linhas={doDepartamento}
            teto={data.teto}
            podeEditar={data.podeEditar}
            aoMudar={recarregar}
          />
        </>
      )}

      {novoAberto && data && (
        <NovoCargo
          operacoes={data.operacoes}
          departamentoPadrao={departamento}
          onFechar={() => setNovoAberto(false)}
          aoCriar={() => { setNovoAberto(false); recarregar() }}
        />
      )}
    </div>
  )
}

// ─── Resumo ───────────────────────────────────────────────────────────────────

function CartaoSegmento({ resumo, teto }: { resumo: ResumoSegmento; teto: number }) {
  return (
    <div className="p-4 rounded-2xl bg-white/3 border border-white/8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-white font-display font-bold uppercase tracking-wide text-sm">
          {DEPARTAMENTO_LABEL[resumo.departamento]}
        </p>
        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] uppercase tracking-wide">
          {resumo.departamento === 'DPO' ? 'Logística' : 'Vendas / Comercial'}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-display font-bold text-white tabular-nums">
          {resumo.vagasAbertas}
        </span>
        <span className="text-slate-500 text-xs">
          posiç{resumo.vagasAbertas === 1 ? 'ão descoberta' : 'ões descobertas'}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-white/8 grid grid-cols-2 gap-3">
        <div>
          <div className="text-slate-500 text-[10px] uppercase tracking-wide">QLP meta / real</div>
          <div className="text-white text-sm font-medium tabular-nums mt-0.5">
            {resumo.qlpMeta} / {resumo.qlpReal}
          </div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px] uppercase tracking-wide">% de comprometimento</div>
          <div
            className={`text-sm font-bold tabular-nums mt-0.5 ${
              resumo.acimaDoTeto ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {pct(resumo.comprometimento)}
          </div>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-slate-500 text-[10px]">
        <Target className="w-3 h-3 shrink-0" />
        Teto definido: máximo {pct(teto)}
      </p>
    </div>
  )
}

// ─── Teto editável ────────────────────────────────────────────────────────────

/**
 * O teto é o parâmetro que o RH controla. Fica aqui, ao lado dos números que
 * ele pinta de vermelho, e não numa tela de configuração separada — quem olha
 * o indicador é quem discute o limite.
 */
function TetoEditavel({
  ano, teto, podeEditar, aoSalvar,
}: {
  ano: number
  teto: number
  podeEditar: boolean
  aoSalvar: () => void
}) {
  const [valor, setValor] = useState(String(teto))
  const [salvando, setSalvando] = useState(false)

  if (!podeEditar) {
    return <span className="text-slate-500 text-xs">Teto {pct(teto)}</span>
  }

  const salvar = async () => {
    const n = Number(valor.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0 || n > 100) { setValor(String(teto)); return }
    if (n === teto) return

    setSalvando(true)
    try {
      const r = await fetch('/api/gente/frontline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano, percentual: n }),
      })
      if (!r.ok) throw new Error()
      aoSalvar()
    } catch {
      setValor(String(teto))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 uppercase tracking-wide text-[11px]">Teto aceito</span>
      <span className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          disabled={salvando}
          inputMode="decimal"
          aria-label={`Teto de comprometimento aceito em ${ano}, em porcento`}
          className="w-16 px-2.5 py-1.5 bg-transparent text-white text-sm text-right tabular-nums focus:outline-none"
        />
        <span className="pr-2.5 text-slate-500">%</span>
      </span>
    </label>
  )
}

// ─── Tabela ───────────────────────────────────────────────────────────────────

function Tabela({
  linhas, teto, podeEditar, aoMudar,
}: {
  linhas: LinhaFrontline[]
  teto: number
  podeEditar: boolean
  aoMudar: () => void
}) {
  if (linhas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center rounded-2xl bg-white/3 border border-white/8">
        <p className="text-white font-medium">Nenhum cargo neste segmento</p>
        <p className="text-slate-500 text-sm max-w-sm">
          Cadastre os cargos com a QLP prevista para o indicador de comprometimento ganhar base.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th scope="col" className="p-3 text-left text-[11px] font-bold uppercase tracking-wide text-white">Cargo</th>
              <th scope="col" className="p-3 text-left text-[11px] font-bold uppercase tracking-wide text-white">Atividade</th>
              <th scope="col" className="p-3 text-center text-[11px] font-bold uppercase tracking-wide text-white">QLP meta</th>
              <th scope="col" className="p-3 text-center text-[11px] font-bold uppercase tracking-wide text-white">QLP real</th>
              <th scope="col" className="p-3 text-center text-[11px] font-bold uppercase tracking-wide text-white">Abertas</th>
              <th scope="col" className="p-3 text-right text-[11px] font-bold uppercase tracking-wide text-white">Comprometimento</th>
              {podeEditar && <th scope="col" className="p-3 w-10"><span className="sr-only">Ações</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {linhas.map((l) => (
              <Linha key={l.id} linha={l} teto={teto} podeEditar={podeEditar} aoMudar={aoMudar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Linha({
  linha, teto, podeEditar, aoMudar,
}: {
  linha: LinhaFrontline
  teto: number
  podeEditar: boolean
  aoMudar: () => void
}) {
  const [excluindo, setExcluindo] = useState(false)
  /*
    Confirmacao em dois toques na propria linha, em vez de `confirm()` nativo.
    O dialogo do navegador ignora o tema do portal, trava a aba inteira e no
    celular aparece colado no topo, longe do que vai ser excluido. Aqui a
    pergunta fica onde a acao acontece, e Esc desfaz.
  */
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    if (!confirmando) return

    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && setConfirmando(false)
    document.addEventListener('keydown', aoTeclar)
    // Some sozinho: confirmacao pendente esquecida na tela vira armadilha.
    const t = setTimeout(() => setConfirmando(false), 5000)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      clearTimeout(t)
    }
  }, [confirmando])

  const excluir = async () => {
    setExcluindo(true)
    try {
      const r = await fetch(`/api/gente/frontline/${linha.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      aoMudar()
    } finally {
      setExcluindo(false)
      setConfirmando(false)
    }
  }

  return (
    <tr className={excluindo ? 'opacity-50' : undefined}>
      <td className="p-3">
        <div className="text-slate-500 text-[10px] uppercase tracking-wide">
          {linha.operacao?.nome ?? '—'}
        </div>
        <div className="text-white text-sm font-medium">{linha.cargo}</div>
      </td>
      <td className="p-3">
        {linha.atividade ? (
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] uppercase tracking-wide">
            {linha.atividade}
          </span>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>
      <td className="p-3 text-center">
        <NumeroEditavel id={linha.id} campo="qlpMeta" valor={linha.qlpMeta} podeEditar={podeEditar} aoSalvar={aoMudar} />
      </td>
      <td className="p-3 text-center">
        <NumeroEditavel id={linha.id} campo="qlpReal" valor={linha.qlpReal} podeEditar={podeEditar} aoSalvar={aoMudar} />
      </td>
      <td className="p-3 text-center">
        <span
          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full border text-xs font-medium tabular-nums ${
            linha.vagasAbertas > 0
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
          }`}
          title="QLP meta menos QLP real: quantas pessoas faltam para completar o quadro deste cargo"
        >
          {linha.vagasAbertas}
        </span>
      </td>
      <td className={`p-3 text-right text-sm font-bold tabular-nums ${linha.acimaDoTeto ? 'text-red-400' : 'text-emerald-400'}`}>
        {pct(linha.comprometimento)}
        {linha.acimaDoTeto && <span className="sr-only"> — acima do teto de {pct(teto)}</span>}
      </td>
      {podeEditar && (
        <td className="p-3">
          {confirmando ? (
            <button
              onClick={excluir}
              disabled={excluindo}
              autoFocus
              aria-label={`Confirmar exclusão de ${linha.cargo}`}
              className="px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-medium hover:bg-red-500/25 transition-colors whitespace-nowrap"
            >
              {excluindo ? 'Excluindo…' : 'Confirmar'}
            </button>
          ) : (
            <button
              onClick={() => setConfirmando(true)}
              aria-label={`Excluir ${linha.cargo}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

/** Campo numérico que grava ao sair — a tela toda é uma planilha. */
function NumeroEditavel({
  id, campo, valor, podeEditar, aoSalvar,
}: {
  id: string
  campo: 'qlpMeta' | 'qlpReal'
  valor: number
  podeEditar: boolean
  aoSalvar: () => void
}) {
  const [texto, setTexto] = useState(String(valor))

  if (!podeEditar) {
    return <span className="text-white text-sm tabular-nums">{valor}</span>
  }

  const salvar = async () => {
    const n = Number(texto)
    if (!Number.isInteger(n) || n < 0) { setTexto(String(valor)); return }
    if (n === valor) return

    try {
      const r = await fetch(`/api/gente/frontline/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [campo]: n }),
      })
      if (!r.ok) throw new Error()
      aoSalvar()
    } catch {
      setTexto(String(valor))
    }
  }

  return (
    <input
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={salvar}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      inputMode="numeric"
      aria-label={campo === 'qlpMeta' ? 'QLP meta' : 'QLP real'}
      className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center tabular-nums focus:outline-none focus:border-brand-500/40"
    />
  )
}

// ─── Novo cargo ───────────────────────────────────────────────────────────────

function NovoCargo({
  operacoes, departamentoPadrao, onFechar, aoCriar,
}: {
  operacoes: { id: string; nome: string }[]
  departamentoPadrao: Departamento
  onFechar: () => void
  aoCriar: () => void
}) {
  const [form, setForm] = useState({
    operacaoId: operacoes[0]?.id ?? '',
    cargo: '',
    atividade: '',
    departamento: departamentoPadrao,
    qlpMeta: '0',
    qlpReal: '0',
  })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSalvando(true)

    try {
      const r = await fetch('/api/gente/frontline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacaoId: form.operacaoId,
          cargo: form.cargo.trim(),
          atividade: form.atividade.trim() || null,
          departamento: form.departamento,
          qlpMeta: Number(form.qlpMeta) || 0,
          qlpReal: Number(form.qlpReal) || 0,
        }),
      })
      const corpo = await r.json()
      if (!r.ok) throw new Error(corpo.error ?? 'Não foi possível salvar')
      aoCriar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  const campo = 'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <form
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
        aria-label="Novo cargo do Frontline"
        className="relative w-full max-w-lg rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <h2 className="text-lg font-display font-bold text-white">Novo cargo do Frontline</h2>

        {erro && (
          <p className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">{erro}</p>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400 text-xs">Operação</span>
            <select
              value={form.operacaoId}
              onChange={(e) => setForm({ ...form, operacaoId: e.target.value })}
              className={campo}
              required
            >
              {operacoes.map((o) => (<option key={o.id} value={o.id}>{o.nome}</option>))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 text-xs">Departamento</span>
            <select
              value={form.departamento}
              onChange={(e) => setForm({ ...form, departamento: e.target.value as Departamento })}
              className={campo}
            >
              {DEPARTAMENTOS.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-slate-400 text-xs">Cargo</span>
          <input
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            placeholder="Ajudante Armazém"
            className={campo}
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-slate-400 text-xs">Atividade</span>
          <input
            value={form.atividade}
            onChange={(e) => setForm({ ...form, atividade: e.target.value })}
            placeholder="Apoio Logístico"
            className={campo}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400 text-xs">QLP meta</span>
            <input
              type="number"
              min={0}
              value={form.qlpMeta}
              onChange={(e) => setForm({ ...form, qlpMeta: e.target.value })}
              className={campo}
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 text-xs">QLP real</span>
            <input
              type="number"
              min={0}
              value={form.qlpReal}
              onChange={(e) => setForm({ ...form, qlpReal: e.target.value })}
              className={campo}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onFechar}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || !form.cargo.trim()}
            className="px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  )
}
