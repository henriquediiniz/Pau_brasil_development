'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Filtro por etapa do funil do Banco de Talentos.
 *
 * O funil é `RECEBIDO → TRIAGEM → ENTREVISTA → APROVADO`, com `REJEITADO` e
 * `ARQUIVADO` como saídas. A tela listava todo mundo junto, então "trazer para
 * o processo" oferecia com o mesmo peso quem acabou de se candidatar e quem
 * já passou por tudo — e também quem foi rejeitado.
 *
 * As contagens não são enfeite: sem elas, escolher "Aprovados" e receber uma
 * lista vazia não distingue "ninguém passou" de "o filtro quebrou".
 */

export const ETAPAS = [
  { valor: '', label: 'Todos', cor: 'text-slate-300' },
  { valor: 'RECEBIDO', label: 'Recebidos', cor: 'text-slate-400' },
  { valor: 'TRIAGEM', label: 'Em triagem', cor: 'text-blue-400' },
  { valor: 'ENTREVISTA', label: 'Em entrevista', cor: 'text-violet-400' },
  { valor: 'APROVADO', label: 'Aprovados', cor: 'text-emerald-400' },
  { valor: 'REJEITADO', label: 'Rejeitados', cor: 'text-rose-400' },
  { valor: 'ARQUIVADO', label: 'Arquivados', cor: 'text-slate-500' },
] as const

/** Etapas que significam "saiu do funil" — trazer alguém daqui é exceção. */
export const ETAPAS_DE_SAIDA = ['REJEITADO', 'ARQUIVADO']

export const ETAPA_LABEL: Record<string, string> = {
  RECEBIDO: 'Recebido',
  TRIAGEM: 'Em triagem',
  ENTREVISTA: 'Em entrevista',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
}

export const ETAPA_ESTILO: Record<string, string> = {
  RECEBIDO: 'bg-white/5 text-slate-400 border-white/10',
  TRIAGEM: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ENTREVISTA: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  APROVADO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJEITADO: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  ARQUIVADO: 'bg-white/5 text-slate-500 border-white/8',
}

export function FiltroEtapa({
  etapa,
  porEtapa,
  totalGeral,
  aoMudar,
}: {
  etapa: string
  porEtapa: Record<string, number>
  totalGeral: number
  aoMudar: (etapa: string) => void
}) {
  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Filtrar por etapa do Banco de Talentos"
        className="flex flex-wrap items-center gap-1.5"
      >
        {ETAPAS.map((e) => {
          const n = e.valor === '' ? totalGeral : porEtapa[e.valor] ?? 0
          const ativo = etapa === e.valor

          return (
            <button
              key={e.valor || 'todos'}
              type="button"
              onClick={() => aoMudar(e.valor)}
              aria-pressed={ativo}
              // Etapa sem ninguém continua clicável: some o botão e o RH fica
              // sem saber que a etapa existe.
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                ativo
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-white/3 border-white/8 text-slate-400 hover:text-slate-200'
              }`}
            >
              {e.label}
              <span className={`tabular-nums ${ativo ? '' : n === 0 ? 'text-slate-600' : 'text-slate-500'}`}>
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {ETAPAS_DE_SAIDA.includes(etapa) && (
        <p className="flex items-start gap-1.5 text-amber-400 text-[11px] leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          Estas pessoas saíram do funil do Banco de Talentos. Trazer alguém daqui para o processo é
          uma reconsideração — confira o histórico antes.
        </p>
      )}
    </div>
  )
}
