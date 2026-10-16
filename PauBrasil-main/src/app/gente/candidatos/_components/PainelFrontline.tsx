'use client'

import useSWR from 'swr'
import { AlertTriangle, Building2, Hash, Zap } from 'lucide-react'
import type { ResumoFrontline } from '@/lib/gente/painel-frontline'

/**
 * Resumo do frontline no topo de Candidatos.
 *
 * Fica recolhido num bloco só: a tela existe para trabalhar a lista, e um
 * painel que empurre os candidatos para baixo da dobra atrapalha o uso diário.
 */

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export function PainelFrontline({
  apenasFrontline,
  aoFiltrar,
  operacaoId = '',
}: {
  apenasFrontline: boolean
  aoFiltrar: (apenas: boolean) => void
  /** O filtro de operação da lista; o painel acompanha. */
  operacaoId?: string
}) {
  const { data } = useSWR<ResumoFrontline & { semEscopo?: boolean }>(
    `/api/gente/candidatos/resumo-frontline${operacaoId ? `?operacaoId=${encodeURIComponent(operacaoId)}` : ''}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!data || data.semEscopo) return null

  /*
    Nenhum cargo marcado nao e "zero candidatos" — e "ninguem classificou
    ainda". Sao coisas diferentes, e mostrar zeros faria parecer que a operacao
    nao tem frontline nenhum.
  */
  if (data.cargosMarcados === 0) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
        <Zap className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-white text-sm font-medium">Nenhum cargo marcado como frontline</p>
          <p className="text-slate-400 text-xs mt-0.5">
            Marque os cargos em Descrição de Cargos e este painel mostra quantos candidatos estão
            disputando a linha de frente, por operação.
          </p>
        </div>
      </div>
    )
  }

  const semCandidato = data.semCandidato.slice(0, 3)

  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-white/8">
        <p className="flex items-center gap-1.5 text-white text-sm font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Frontline
        </p>

        <button
          type="button"
          onClick={() => aoFiltrar(!apenasFrontline)}
          aria-pressed={apenasFrontline}
          className={`px-2.5 py-1 rounded-full border text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
            apenasFrontline
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-white/3 border-white/8 text-slate-400 hover:text-slate-200'
          }`}
        >
          {apenasFrontline ? 'Mostrando só frontline' : 'Ver só frontline'}
        </button>
      </div>

      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
        {/* Volume */}
        <div className="p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-amber-400 tabular-nums">
              {data.candidatosFrontline}
            </span>
            <span className="text-slate-500 text-xs">
              de {data.totalCandidatos} candidato{data.totalCandidatos === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-1">
            {data.posicoesAbertas > 0
              ? `${data.posicoesAbertas} posiç${data.posicoesAbertas === 1 ? 'ão descoberta' : 'ões descobertas'} em cargos de frontline`
              : 'Nenhuma posição de frontline aberta agora'}
          </p>
          <p className="text-slate-600 text-[10px] mt-1.5">
            {data.cargosMarcados} cargo{data.cargosMarcados === 1 ? '' : 's'} marcado
            {data.cargosMarcados === 1 ? '' : 's'} como frontline
          </p>
        </div>

        {/* Por operação */}
        <div className="p-4">
          <p className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wide mb-2">
            <Building2 className="w-3 h-3" />
            Por operação
          </p>

          {data.porOperacao.length === 0 ? (
            <p className="text-slate-600 text-xs">Nenhum candidato de frontline ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.porOperacao.slice(0, 4).map((o) => (
                <li key={o.operacaoId} className="flex items-center gap-2">
                  <span className="text-slate-300 text-xs flex-1 truncate">{o.nome}</span>
                  {/*
                    Barra proporcional ao maior: comparar operações é a razão de
                    a lista existir, e só o número faz o olho recontar.
                  */}
                  <span
                    className="h-1.5 rounded-full bg-amber-500/40 shrink-0"
                    style={{ width: `${Math.max(8, (o.total / data.porOperacao[0].total) * 56)}px` }}
                    aria-hidden
                  />
                  <span className="text-white text-xs tabular-nums w-6 text-right">{o.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quantidade por cargo */}
        <div className="p-4">
          <p className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wide mb-2">
            <Hash className="w-3 h-3" />
            Quantidade por cargo
          </p>

          {data.porCargo.length === 0 ? (
            <p className="text-slate-600 text-xs">Nenhum candidato de frontline ainda.</p>
          ) : (
            // Todos os cargos, sem corte: sao poucos (so os marcados como
            // frontline), e a rolagem segura o caso de crescer.
            <ul className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {data.porCargo.map((c) => (
                <li key={c.cargo} className="flex items-center gap-2">
                  <span className="text-slate-300 text-xs flex-1 truncate" title={c.cargo}>
                    {c.cargo}
                  </span>
                  <span className="text-white text-xs tabular-nums">{c.candidatos}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/*
        O número que pede ação: posição de frontline aberta sem ninguém no
        funil não se resolve sozinha. Fica por último e só aparece quando
        existe — alerta permanente vira paisagem.
      */}
      {semCandidato.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 border-t border-amber-500/20 bg-amber-500/5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-400 text-[11px] leading-relaxed">
            <span className="font-medium">Sem candidato:</span>{' '}
            {semCandidato.map((c) => `${c.cargo} (${c.posicoesAbertas})`).join(' · ')}
            {data.semCandidato.length > semCandidato.length &&
              ` e mais ${data.semCandidato.length - semCandidato.length}`}
          </p>
        </div>
      )}
    </div>
  )
}
