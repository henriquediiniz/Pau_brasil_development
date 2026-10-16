'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, ArrowRight, Briefcase, CheckCircle2, Clock, TrendingUp, UserPlus, Users,
} from 'lucide-react'
import { type Periodo } from '@/lib/gente/dashboard'
import { SeletorPeriodo, type ValorPeriodo } from './SeletorPeriodo'
import { SITUACAO_LABEL, type OrigemCurriculo, type SituacaoCandidato } from '@/lib/gente/candidato'

interface Painel {
  periodo: Periodo
  /** O recorte em texto, resolvido no servidor. */
  intervalo: string
  semEscopo?: boolean
  candidaturasAguardando: number
  vagasForaDoPeriodo: number
  truncado: boolean
  vagas: {
    total: number
    abertas: number
    fechadas: number
    canceladas: number
    abertasAtrasadas: number
    posicoesAbertas: number
    tempoMedioFechamento: number | null
    percentualNoPrazo: number | null
    porOperacao: { operacaoId: string; nome: string; abertas: number; atrasadas: number; fechadas: number }[]
  }
  candidatos: {
    total: number
    porSituacao: Record<SituacaoCandidato, number>
    prontos: number
    bloqueados: number
    emAndamento: number
    vindosDoSite: number
    porOrigem: { origem: OrigemCurriculo; total: number }[]
    gargalos: { chave: string; label: string; total: number }[]
  }
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export function PainelGente() {
  const [periodo, setPeriodo] = useState<ValorPeriodo>({ periodo: '90d', de: null, ate: null })

  const qs = useMemo(() => {
    const p = new URLSearchParams({ periodo: periodo.periodo })
    if (periodo.de) p.set('de', periodo.de)
    if (periodo.ate) p.set('ate', periodo.ate)
    return p.toString()
  }, [periodo])

  const { data, error, isLoading } = useSWR<Painel>(
    `/api/gente/dashboard?${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  if (data?.semEscopo) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium">Nenhuma operação atribuída ao seu usuário</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Peça a um administrador para vincular as suas operações no cadastro de usuários.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
        Não foi possível carregar o painel.
      </div>
    )
  }

  if (isLoading && !data) {
    // O seletor fica visível durante a carga: esconder o filtro é justamente
    // tirar o controle de quem está esperando para trocar de recorte.
    return (
      <div className="space-y-4">
        <SeletorPeriodo valor={periodo} aoMudar={setPeriodo} />
        <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
          ))}
        </div>
        <div className="h-32 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const semDados = data.vagas.total === 0 && data.candidatos.total === 0

  return (
    <div className="space-y-4">
      <SeletorPeriodo valor={periodo} aoMudar={setPeriodo} resumo={data.intervalo} />

      {semDados ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
          <TrendingUp className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">Ainda não há dados neste período</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {data.vagasForaDoPeriodo > 0
                ? `Existem ${data.vagasForaDoPeriodo} vaga(s) fora deste recorte — experimente "Tudo".`
                : 'Importe a planilha do RH ou cadastre a primeira vaga para o painel ganhar vida.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Indicadores principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Indicador
              icone={Briefcase}
              rotulo="Vagas abertas"
              valor={data.vagas.abertas}
              nota={
                data.vagas.posicoesAbertas !== data.vagas.abertas
                  ? `${data.vagas.posicoesAbertas} postos a preencher`
                  : undefined
              }
            />
            <Indicador
              icone={AlertTriangle}
              rotulo="Abertas vencidas"
              valor={data.vagas.abertasAtrasadas}
              tom={data.vagas.abertasAtrasadas > 0 ? 'alerta' : 'neutro'}
              nota={
                data.vagas.abertas > 0
                  ? `${Math.round((data.vagas.abertasAtrasadas / data.vagas.abertas) * 100)}% das abertas`
                  : undefined
              }
            />
            <Indicador
              icone={Clock}
              rotulo="Tempo médio"
              valor={data.vagas.tempoMedioFechamento ?? '—'}
              sufixo={data.vagas.tempoMedioFechamento !== null ? 'dias' : undefined}
              nota={data.vagas.fechadas > 0 ? `${data.vagas.fechadas} fechadas` : 'nenhuma fechada ainda'}
            />
            <Indicador
              icone={CheckCircle2}
              rotulo="Fechadas no prazo"
              valor={data.vagas.percentualNoPrazo ?? '—'}
              sufixo={data.vagas.percentualNoPrazo !== null ? '%' : undefined}
              tom={
                data.vagas.percentualNoPrazo !== null && data.vagas.percentualNoPrazo < 70
                  ? 'alerta'
                  : 'bom'
              }
            />
          </div>

          {/* Funil de candidatos */}
          {data.candidatos.total > 0 && (
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8">
                <p className="text-slate-300 text-xs font-medium">
                  Candidatos no período ({data.candidatos.total})
                </p>
                <Link
                  href="/gente/candidatos"
                  className="text-brand-400 text-xs hover:underline inline-flex items-center gap-1"
                >
                  ver todos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-3 divide-x divide-white/5">
                <Mini rotulo="Em andamento" valor={data.candidatos.emAndamento} />
                <Mini rotulo="Prontos" valor={data.candidatos.prontos} tom="bom" />
                <Mini rotulo="Bloqueados" valor={data.candidatos.bloqueados} tom="alerta" />
              </div>

              {data.candidatos.gargalos.length > 0 && (
                <div className="px-4 py-3 border-t border-white/8">
                  <p className="text-slate-500 text-[11px] uppercase tracking-wide mb-2">
                    Parados em cada etapa
                  </p>
                  <div className="space-y-1.5">
                    {data.candidatos.gargalos.slice(0, 5).map((g) => (
                      <div key={g.chave} className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs flex-1 truncate">{g.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[140px]">
                          <div
                            className="h-full bg-brand-500/50"
                            style={{
                              width: `${Math.round((g.total / data.candidatos.emAndamento) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs tabular-nums w-6 text-right">
                          {g.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-white/8">
                {(Object.keys(data.candidatos.porSituacao) as SituacaoCandidato[])
                  .filter((s) => data.candidatos.porSituacao[s] > 0)
                  .map((s) => (
                    <span
                      key={s}
                      className="text-[11px] text-slate-400 border border-white/10 rounded-full px-2 py-0.5"
                    >
                      {SITUACAO_LABEL[s]}: {data.candidatos.porSituacao[s]}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Por operação */}
          {data.vagas.porOperacao.length > 1 && (
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/8">
                <p className="text-slate-300 text-xs font-medium">Vagas abertas por operação</p>
              </div>
              <div className="divide-y divide-white/5">
                {data.vagas.porOperacao.map((o) => (
                  <div key={o.operacaoId} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-slate-200 text-xs flex-1 truncate">{o.nome}</span>
                    {o.atrasadas > 0 && (
                      <span className="text-red-400 text-[11px]">{o.atrasadas} vencida{o.atrasadas === 1 ? '' : 's'}</span>
                    )}
                    <span className="text-slate-400 text-xs tabular-nums w-8 text-right">{o.abertas}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/*
            A linha "Origem" (WhatsApp / Portal de carreiras / Outro) saiu a
            pedido do PO em 2026-10-08: os candidatos importados em massa
            distorciam a proporcao. O dado segue na API.
          */}
        </>
      )}

      {/* A ponte com o Banco de Talentos */}
      {data.candidaturasAguardando > 0 && (
        <Link
          href="/gente/candidatos/do-banco-de-talentos"
          className="group flex items-center gap-3 p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 hover:bg-brand-500/10 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">
              {data.candidaturasAguardando} candidatura{data.candidaturasAguardando === 1 ? '' : 's'} do
              site esperando
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Pessoas que se candidataram e ainda não entraram no processo seletivo.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-brand-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </Link>
      )}

      {data.truncado && (
        <p className="text-slate-500 text-[11px]">
          O painel está mostrando uma amostra: há mais registros do que o limite de agregação.
          Estreite o período para números exatos.
        </p>
      )}
    </div>
  )
}

// ─── Peças ────────────────────────────────────────────────────────────────────

function Indicador({
  icone: Icone,
  rotulo,
  valor,
  sufixo,
  nota,
  tom = 'neutro',
}: {
  icone: typeof Briefcase
  rotulo: string
  valor: number | string
  sufixo?: string
  nota?: string
  tom?: 'neutro' | 'alerta' | 'bom'
}) {
  const cor =
    tom === 'alerta' ? 'text-red-400' : tom === 'bom' ? 'text-emerald-400' : 'text-white'

  return (
    <div className="p-3 rounded-2xl bg-white/3 border border-white/8">
      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
        <Icone className="w-3 h-3" />
        {rotulo}
      </div>
      <div className={`mt-1 flex items-baseline gap-1 ${cor}`}>
        <span className="text-2xl font-display font-bold tabular-nums">{valor}</span>
        {sufixo && <span className="text-xs text-slate-400">{sufixo}</span>}
      </div>
      {nota && <div className="text-slate-500 text-[11px] mt-0.5">{nota}</div>}
    </div>
  )
}

function Mini({
  rotulo,
  valor,
  tom = 'neutro',
}: {
  rotulo: string
  valor: number
  tom?: 'neutro' | 'alerta' | 'bom'
}) {
  const cor =
    tom === 'alerta' && valor > 0
      ? 'text-red-400'
      : tom === 'bom' && valor > 0
      ? 'text-emerald-400'
      : 'text-white'

  return (
    <div className="px-4 py-3 text-center">
      <div className={`text-xl font-display font-bold tabular-nums ${cor}`}>{valor}</div>
      <div className="text-slate-500 text-[11px] mt-0.5">{rotulo}</div>
    </div>
  )
}
