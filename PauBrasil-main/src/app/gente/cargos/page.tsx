'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, Briefcase, CheckCircle2, ChevronLeft, FileText, Globe, Loader2, Plus, Search, ShieldCheck,
  Upload,
} from 'lucide-react'
import { DetalheCargo } from './_components/DetalheCargo'
import { PublicarNoSite } from './_components/PublicarNoSite'
import { grupoDoCargo } from '@/lib/gente/cargo-publico'


interface Cargo {
  id: string
  cargo: string
  area: string
  tipoVaga: string | null
  formacao: string | null
  exigencias: string | null
  testes: string | null
  precisaAderenciaRaio: boolean
  publicarNoSite: boolean
  grupoPublico: string | null
}

interface Vaga {
  id: string
  cargo: string
  operacao: { nome: string } | null
  status: string
}

interface Divergencia {
  campo: string
  rotulo: string
  severidade: 'alta' | 'media' | 'baixa'
  mensagem: string
  esperado?: string | null
  encontrado?: string | null
}

interface Aderencia {
  pontuacao: number
  divergencias: Divergencia[]
  itensAvaliados: number
  temDescritivo: boolean
  descritivo: { cargo: string; area: string } | null
  vaga: { cargo: string; operacao?: string }
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const SEVERIDADE = {
  alta: { label: 'Crítico', classe: 'text-red-400 bg-red-500/10 border-red-500/20' },
  media: { label: 'Atenção', classe: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  baixa: { label: 'Aviso', classe: 'text-slate-400 bg-white/5 border-white/10' },
} as const

export default function CargosPage() {
  const [selecionado, setSelecionado] = useState<{ id: string; cargo: string } | null>(null)
  const [busca, setBusca] = useState('')
  const [buscaAtiva, setBuscaAtiva] = useState('')
  const [vagaId, setVagaId] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const qs = useMemo(() => (buscaAtiva ? `?q=${encodeURIComponent(buscaAtiva)}` : ''), [buscaAtiva])

  const { data, isLoading, mutate } = useSWR<{ items: Cargo[]; total: number; semEmpresa?: boolean }>(
    `/api/gente/cargos${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  /*
    Conta o que o candidato realmente vê, não o que está marcado. Marcado sem
    o nome existir na lista da página não aparece para ninguém, e um contador
    que some os dois mentiria — foi o que aconteceu ao publicar o primeiro.
  */
  const publicados =
    data?.items.filter(
      (c) => c.publicarNoSite && c.grupoPublico && Boolean(grupoDoCargo(c))
    ).length ?? 0

  const marcadosSemAparecer =
    data?.items.filter(
      (c) => c.publicarNoSite && c.grupoPublico && !Boolean(grupoDoCargo(c))
    ).length ?? 0

  const { data: vagasData } = useSWR<{ items: Vaga[] }>(
    '/api/gente/vagas?status=ABERTA&limit=200',
    fetcher,
    { revalidateOnFocus: false }
  )
  const vagas = vagasData?.items ?? []

  const { data: aderencia, isLoading: analisando } = useSWR<Aderencia>(
    vagaId ? `/api/gente/vagas/${vagaId}/aderencia` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/gente" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Descritivos de Cargo</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.total} descritivo${data.total === 1 ? '' : 's'}` : 'Carregando…'} — o
            padrão que as vagas devem seguir
          </p>
          {/*
            Quantos estão no ar, ao lado do total. Sem esse número a pessoa que
            acabou de publicar dez não tem como saber se publicou dez.
          */}
          {data && (
            <p className="flex items-center gap-1.5 text-xs mt-1">
              <Globe className={`w-3.5 h-3.5 ${publicados > 0 ? 'text-brand-400' : 'text-slate-500'}`} />
              <span className={publicados > 0 ? 'text-brand-400' : 'text-slate-500'}>
                {publicados === 0
                  ? 'Nenhum cargo aparece na página de carreiras ainda'
                  : `${publicados} ${publicados === 1 ? 'cargo aparece' : 'cargos aparecem'} na página de carreiras`}
              </span>
              {marcadosSemAparecer > 0 && (
                <span className="text-amber-400">
                  · {marcadosSemAparecer} marcado{marcadosSemAparecer === 1 ? '' : 's'} mas ainda
                  não listado{marcadosSemAparecer === 1 ? '' : 's'} no site
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/gente/cargos/importar" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
            <Upload className="w-4 h-4" />
            Importar
          </Link>
          <Link href="/gente/cargos/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" />
            Novo descritivo
          </Link>
        </div>
      </div>

      {/* Verificador de aderência */}
      <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <p className="text-white text-sm font-medium">Verificador de aderência</p>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-slate-400 text-xs leading-relaxed">
            Escolha uma vaga aberta e veja onde ela se afasta do descritivo padrão do cargo. A
            conferência é campo a campo, com regra explícita — dá para mostrar ao solicitante
            exatamente o que corrigir.
          </p>

          <select
            value={vagaId}
            onChange={(e) => setVagaId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40"
          >
            <option value="">Selecione uma vaga aberta…</option>
            {vagas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.cargo} — {v.operacao?.nome ?? 'sem operação'}
              </option>
            ))}
          </select>

          {vagas.length === 0 && (
            <p className="text-slate-500 text-xs">
              Nenhuma vaga aberta para conferir.{' '}
              <Link href="/gente/vagas" className="text-brand-400 hover:underline">
                Ver o controle de vagas
              </Link>
              .
            </p>
          )}

          {analisando && (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Conferindo…
            </div>
          )}

          {aderencia && !analisando && (
            <div className="space-y-3 pt-1">
              {!aderencia.temDescritivo ? (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Não há descritivo cadastrado para <strong>{aderencia.vaga.cargo}</strong>. Sem o
                    padrão não dá para avaliar a vaga — cadastre o descritivo primeiro.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`text-2xl font-display font-bold tabular-nums ${
                        aderencia.pontuacao >= 80
                          ? 'text-emerald-400'
                          : aderencia.pontuacao >= 50
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {aderencia.pontuacao}%
                    </div>
                    <div className="text-slate-500 text-xs">
                      de aderência ao descritivo de {aderencia.descritivo?.cargo}
                      <br />
                      {aderencia.itensAvaliados} ponto(s) conferido(s)
                    </div>
                  </div>

                  {aderencia.divergencias.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <p className="text-emerald-400 text-xs">
                        A vaga está alinhada ao descritivo padrão.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {aderencia.divergencias.map((d) => (
                        <div key={d.campo} className="p-3 rounded-xl bg-white/3 border border-white/8">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">{d.rotulo}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${SEVERIDADE[d.severidade].classe}`}>
                              {SEVERIDADE[d.severidade].label}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">{d.mensagem}</p>
                          {d.esperado && (
                            <p className="text-slate-500 text-[11px] mt-1.5">
                              <span className="text-slate-400">Padrão:</span> {d.esperado}
                            </p>
                          )}
                          {d.encontrado && (
                            <p className="text-slate-500 text-[11px]">
                              <span className="text-slate-400">Na vaga:</span> {d.encontrado}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de descritivos */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Cargo ou área…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/40"
        />
      </div>

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">Nenhum descritivo cadastrado</p>
          <p className="text-slate-500 text-sm max-w-sm">
            Sem descritivo, o verificador não tem contra o que comparar as vagas.
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden divide-y divide-white/5">
          {data.items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {/*
                A linha inteira abre a ficha. O botao Editar fica fora dele,
                como irmao, senao seria um botao dentro de outro botao.
              */}
              <button
                type="button"
                onClick={() => setSelecionado({ id: c.id, cargo: c.cargo })}
                aria-label={`Ver descritivo de ${c.cargo}`}
                className="min-w-0 flex-1 text-left rounded-lg -m-1 p-1 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium">{c.cargo}</span>
                  {c.precisaAderenciaRaio && (
                    <span className="text-[10px] text-slate-400 border border-white/10 rounded px-1.5 py-0.5" title="Exige residência dentro do raio da unidade">
                      raio
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>{c.area}</span>
                  {c.formacao && <><span>·</span><span>{c.formacao}</span></>}
                  {c.testes && <><span>·</span><span className="truncate max-w-[200px]">{c.testes}</span></>}
                </div>
              </button>

              <PublicarNoSite
                cargoId={c.id}
                cargo={c.cargo}
                publicado={c.publicarNoSite}
                grupo={c.grupoPublico}
                area={c.area}
                aoMudar={() => mutate()}
              />

              {/*
                Abrir vaga daqui, olhando o cargo, em vez de ir ao Controle de
                Vagas e redigitar o que ja esta cadastrado. Leva o cargoId, que
                e o que liga a vaga ao descritivo sem depender de digitacao.
              */}
              <Link
                href={`/gente/vagas/nova?cargoId=${c.id}`}
                title={`Abrir uma vaga para ${c.cargo}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors shrink-0"
              >
                <Briefcase className="w-3.5 h-3.5" />
                Abrir vaga
              </Link>

              <Link
                href={`/gente/cargos/${c.id}/editar`}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/8 transition-colors shrink-0"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>
      )}

      {selecionado && (
        <DetalheCargo
          id={selecionado.id}
          nome={selecionado.cargo}
          podeEditar
          onFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  )
}
