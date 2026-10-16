'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Accessibility, AlertTriangle, CheckCircle2, ChevronLeft, ExternalLink, FileText,
  Loader2, Plus, Search, ShieldAlert, Trash2, Upload, X, FileUp,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { LaudosEmLote } from './_components/LaudosEmLote'

interface Pcd {
  id: string
  nome: string
  funcao: string | null
  tipo: string | null
  deficiencia: string | null
  admissao: string | null
  ativo: boolean
  temLaudo: boolean
  laudoOriginalFilename: string | null
  operacao: { id: string; nome: string } | null
}

interface Cota {
  quadro: number
  percentual: number
  exigido: number
  ocupado: number
  faltam: number
  emDia: boolean
  aplicavel: boolean
}

interface Resposta {
  items: Pcd[]
  total: number
  cota: Cota
  semEscopo?: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export default function PcdPage() {
  const [operacaoId, setOperacaoId] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [anexando, setAnexando] = useState<Pcd | null>(null)
  const [removendo, setRemovendo] = useState<Pcd | null>(null)
  const [anexandoEmLote, setAnexandoEmLote] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (operacaoId) p.set('operacaoId', operacaoId)
    if (buscaAtiva) p.set('q', buscaAtiva)
    return p.toString()
  }, [operacaoId, buscaAtiva])

  const { data, error, isLoading, mutate } = useSWR<Resposta>(
    `/api/gente/pcd?${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

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
          <h1 className="text-2xl font-display font-bold text-white">Gestão PCD</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} colaborador${data.total === 1 ? '' : 'es'} PCD` : 'Carregando…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAnexandoEmLote(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <FileUp className="w-4 h-4" />
            Anexar laudos
          </button>
          <Link href="/gente/pcd/importar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link href="/gente/pcd/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            Novo
          </Link>
        </div>
      </div>

      {/* Cota legal */}
      {data && <CartaoCota cota={data.cota} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, função ou deficiência…"
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
            <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Accessibility className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">Nenhum colaborador PCD cadastrado</p>
          <p className="text-slate-500 text-sm">Importe a planilha do RH para começar.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-white font-medium">{p.nome}</div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{p.funcao ?? 'Sem função'}</span>
                  <span>·</span>
                  <span>{p.operacao?.nome ?? 'Sem operação'}</span>
                  {p.deficiencia && <><span>·</span><span>{p.deficiencia}</span></>}
                </div>
                {/*
                  O nome do arquivo, à vista. É o que permite perceber um laudo
                  anexado na pessoa errada sem abrir o arquivo — e abrir é um
                  acesso a dado de saúde, que fica registrado em auditoria.
                  O nome do arquivo não é o laudo: é o rótulo que o RH recebeu.
                */}
                {p.temLaudo && p.laudoOriginalFilename && (
                  <div className="text-slate-600 text-[11px] mt-1 flex items-center gap-1 min-w-0">
                    <FileText className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{p.laudoOriginalFilename}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {p.temLaudo ? (
                  <>
                    <a
                      href={`/api/gente/pcd/${p.id}/laudo`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                      title="Abrir laudo — o acesso fica registrado em auditoria"
                    >
                      <FileText className="w-3 h-3" />
                      Laudo
                      <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                    </a>
                    <button
                      onClick={() => setAnexando(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                      title="Enviar outro arquivo no lugar deste"
                    >
                      Trocar
                    </button>
                    <button
                      onClick={() => setRemovendo(p)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-colors"
                      title="Remover o laudo desta pessoa"
                      aria-label={`Remover laudo de ${p.nome}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setAnexando(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-dashed border-white/15 text-slate-400 text-xs hover:bg-white/8 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Anexar laudo
                  </button>
                )}
                <Link
                  href={`/gente/pcd/${p.id}/editar`}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-slate-500 text-xs leading-relaxed">
        O laudo é dado de saúde (art. 11 da LGPD). Ele fica em armazenamento privado, nunca aparece
        numa listagem, e cada abertura é registrada em auditoria com quem acessou e quando.
      </p>

      {anexando && (
        <ModalLaudo
          pcd={anexando}
          onFechar={() => setAnexando(null)}
          onAnexado={() => { setAnexando(null); mutate() }}
        />
      )}

      {removendo && (
        <ModalRemoverLaudo
          pcd={removendo}
          onFechar={() => setRemovendo(null)}
          onRemovido={() => { setRemovendo(null); mutate() }}
        />
      )}

      {anexandoEmLote && (
        <LaudosEmLote
          // A lista carregada, que já respeita o escopo e os filtros da tela:
          // não dá para anexar em quem o usuário não enxerga.
          pessoas={(data?.items ?? []).map((p) => ({ id: p.id, nome: p.nome }))}
          onFechar={() => setAnexandoEmLote(false)}
          onConcluido={() => mutate()}
        />
      )}
    </div>
  )
}

function CartaoCota({ cota }: { cota: Cota }) {
  if (!cota.aplicavel) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-slate-400 text-xs leading-relaxed">
          Com {cota.quadro} colaborador{cota.quadro === 1 ? '' : 'es'} na base de cálculo, a cota
          do art. 93 da Lei 8.213/91 ainda não se aplica — ela começa a partir de 100.
          {cota.ocupado > 0 && ` Há ${cota.ocupado} colaborador(es) PCD cadastrado(s).`}
        </p>
      </div>
    )
  }

  // Classes escritas por extenso: o Tailwind não gera o que só existe
  // concatenado em tempo de execução.
  const caixa = cota.emDia
    ? 'bg-emerald-500/5 border-emerald-500/20'
    : 'bg-red-500/5 border-red-500/20'

  return (
    <div className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl border ${caixa}`}>
      <div className="flex items-center gap-3">
        {cota.emDia ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
        )}
        <div>
          <div className="text-xl font-display font-bold text-white tabular-nums">
            {cota.ocupado} / {cota.exigido}
          </div>
          <div className="text-slate-500 text-[11px]">Cota legal ({cota.percentual}%)</div>
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed flex-1 min-w-[240px]">
        {cota.emDia ? (
          <>Cota cumprida sobre uma base de {cota.quadro} colaboradores.</>
        ) : (
          <>
            <span className="text-red-400 font-medium">
              Faltam {cota.faltam} contratação{cota.faltam === 1 ? '' : 'ões'}
            </span>{' '}
            para cumprir a cota sobre uma base de {cota.quadro} colaboradores.
          </>
        )}{' '}
        <span className="text-slate-500">
          O exigido é calculado pelo art. 93 da Lei 8.213/91 e arredondado para cima.
        </span>
      </p>
    </div>
  )
}

function ModalLaudo({
  pcd,
  onFechar,
  onAnexado,
}: {
  pcd: Pcd
  onFechar: () => void
  onAnexado: () => void
}) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onFechar])

  async function enviar(file: File) {
    setEnviando(true)
    setErro('')
    try {
      const form = new FormData()
      form.append('arquivo', file)

      const res = await fetch(`/api/gente/pcd/${pcd.id}/laudo`, { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível anexar')

      toast({ title: 'Laudo anexado', variant: 'success' })
      onAnexado()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível anexar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Anexar laudo de ${pcd.nome}`}
        className="relative w-full max-w-md rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-white">
              {pcd.temLaudo ? 'Trocar laudo' : 'Anexar laudo'}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">{pcd.nome}</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 text-xs leading-relaxed">
            Laudo é dado de saúde. O arquivo vai para armazenamento privado, não aparece em nenhuma
            listagem, e toda abertura fica registrada com quem acessou.
            {pcd.temLaudo && (
              <> O arquivo <span className="text-slate-200">{pcd.laudoOriginalFilename ?? 'atual'}</span> será
              apagado e substituído por este.</>
            )}
          </p>
        </div>

        <label
          htmlFor="laudo"
          className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl bg-white/3 border border-dashed border-white/15 hover:border-brand-500/40 cursor-pointer transition-colors"
        >
          {enviando ? (
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-slate-500" />
          )}
          <span className="text-slate-300 text-sm">{enviando ? 'Enviando…' : 'Escolher arquivo'}</span>
          <span className="text-slate-500 text-xs">PDF, JPEG, PNG ou WebP — até 10 MB</span>
        </label>
        <input
          id="laudo"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={enviando}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) enviar(f)
          }}
        />

        {erro && <p className="text-red-400 text-xs">{erro}</p>}
      </div>
    </div>
  )
}

/**
 * Remover o laudo de uma pessoa.
 *
 * O caso que traz o RH até aqui é o mais delicado do módulo: o laudo foi
 * anexado na pessoa errada, e o dado de saúde de alguém está no cadastro de
 * outro. Por isso a confirmação mostra o nome da pessoa e o nome do arquivo
 * lado a lado — é a conferência que evita trocar um erro por outro — e o
 * arquivo é apagado do armazenamento, não apenas desvinculado.
 */
function ModalRemoverLaudo({
  pcd,
  onFechar,
  onRemovido,
}: {
  pcd: Pcd
  onFechar: () => void
  onRemovido: () => void
}) {
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onFechar])

  async function remover() {
    setRemovendo(true)
    setErro('')
    try {
      const res = await fetch(`/api/gente/pcd/${pcd.id}/laudo`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível remover')

      toast({ title: 'Laudo removido', variant: 'success' })
      onRemovido()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível remover')
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Remover laudo de ${pcd.nome}`}
        className="relative w-full max-w-md rounded-2xl bg-surface border border-white/10 p-5 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-display font-bold text-white">Remover laudo</h2>
            <p className="text-slate-500 text-xs mt-0.5">{pcd.nome}</p>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-white/3 border border-white/8 space-y-1.5">
          <div className="text-slate-500 text-[11px]">Arquivo anexado hoje neste cadastro</div>
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-200 text-sm truncate">
              {pcd.laudoOriginalFilename ?? 'Arquivo sem nome'}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 text-xs leading-relaxed">
            O arquivo é apagado do armazenamento e não dá para desfazer. Se ele foi anexado na
            pessoa errada, remova aqui e anexe de novo no cadastro certo. A remoção fica registrada
            em auditoria.
          </p>
        </div>

        {erro && <p className="text-red-400 text-xs">{erro}</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onFechar}
            disabled={removendo}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={remover}
            disabled={removendo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {removendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {removendo ? 'Removendo…' : 'Remover laudo'}
          </button>
        </div>
      </div>
    </div>
  )
}
