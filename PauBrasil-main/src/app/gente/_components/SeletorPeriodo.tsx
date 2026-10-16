'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  PERIODOS_RAPIDOS, PERIODO_LABEL, escreverDataIso, lerDataIso,
  type Periodo,
} from '@/lib/gente/dashboard'

/**
 * Seleção de período do painel: atalhos + intervalo escolhido no calendário.
 *
 * O calendário é próprio porque o projeto não tem biblioteca de datas e
 * `<input type="date">` resolve mal um **intervalo**: são dois pickers
 * separados, sem prévia do trecho selecionado e sem relação visível entre as
 * pontas. Aqui um clique marca o início, o segundo marca o fim, e o trecho
 * aparece destacado enquanto o ponteiro percorre os dias.
 */

export interface ValorPeriodo {
  periodo: Periodo
  de: string | null
  ate: string | null
}

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const

function hojeUtc(): Date {
  const agora = new Date()
  return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()))
}

function formatarBr(iso: string | null): string {
  const d = lerDataIso(iso)
  if (!d) return ''
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`
}

export function SeletorPeriodo({
  valor,
  aoMudar,
  resumo,
}: {
  valor: ValorPeriodo
  aoMudar: (v: ValorPeriodo) => void
  /** O recorte em texto ("1 jul – 22 set 2026"), vindo do servidor. */
  resumo?: string
}) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora e no Esc: é um popover, não um modal — prender o
  // foco aqui atrapalharia quem só quer voltar para a lista.
  useEffect(() => {
    if (!aberto) return

    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false)
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }

    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  const personalizado = valor.periodo === 'personalizado'
  const rotuloPersonalizado =
    personalizado && valor.de && valor.ate
      ? `${formatarBr(valor.de)} – ${formatarBr(valor.ate)}`
      : PERIODO_LABEL.personalizado

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          id="rotulo-periodo"
          className="text-slate-500 text-[11px] uppercase tracking-wide mr-0.5"
        >
          Período
        </span>

        {/*
          `group` com role="group" para o leitor de tela anunciar as pílulas
          como um conjunto, e aria-pressed em vez de aria-current: são botões
          de filtro, não navegação.
        */}
        <div role="group" aria-labelledby="rotulo-periodo" className="flex flex-wrap items-center gap-1.5">
          {PERIODOS_RAPIDOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => aoMudar({ periodo: p, de: null, ate: null })}
              aria-pressed={valor.periodo === p}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                valor.periodo === p
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-white/3 border-white/8 text-slate-400 hover:text-slate-200'
              }`}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}

          <div className="relative" ref={caixa}>
            <button
              type="button"
              onClick={() => setAberto((a) => !a)}
              aria-expanded={aberto}
              aria-haspopup="dialog"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                personalizado
                  ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                  : 'bg-white/3 border-white/8 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {rotuloPersonalizado}
            </button>

            {aberto && (
              <Calendario
                de={valor.de}
                ate={valor.ate}
                aoAplicar={(de, ate) => {
                  aoMudar({ periodo: 'personalizado', de, ate })
                  setAberto(false)
                }}
                aoFechar={() => setAberto(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/*
        A pílula diz "90 dias"; ninguém calcula de cabeça que dia foi isso.
        O recorte em data fica visível ao lado dos números que ele explica.
      */}
      {resumo && <p className="text-slate-500 text-[11px]">Contando {resumo}</p>}
    </div>
  )
}

// ─── Calendário de intervalo ──────────────────────────────────────────────────

function Calendario({
  de,
  ate,
  aoAplicar,
  aoFechar,
}: {
  de: string | null
  ate: string | null
  aoAplicar: (de: string | null, ate: string | null) => void
  aoFechar: () => void
}) {
  const hoje = useMemo(hojeUtc, [])

  const [inicio, setInicio] = useState<Date | null>(() => lerDataIso(de))
  const [fim, setFim] = useState<Date | null>(() => lerDataIso(ate))
  /** Dia sob o ponteiro, para pintar o trecho antes do segundo clique. */
  const [previa, setPrevia] = useState<Date | null>(null)

  const [mesVisivel, setMesVisivel] = useState(() => {
    const base = lerDataIso(de) ?? hoje
    return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  })

  const dias = useMemo(() => montarGrade(mesVisivel), [mesVisivel])

  const selecionar = (dia: Date) => {
    // Primeiro clique, ou recomeço depois de um intervalo fechado.
    if (!inicio || (inicio && fim)) {
      setInicio(dia)
      setFim(null)
      return
    }
    // Clicar antes do início é correção de rota, não intervalo invertido.
    if (dia < inicio) {
      setInicio(dia)
      return
    }
    setFim(dia)
  }

  const fimEfetivo = fim ?? previa
  const noTrecho = (dia: Date) => {
    if (!inicio || !fimEfetivo) return false
    const [a, b] = inicio <= fimEfetivo ? [inicio, fimEfetivo] : [fimEfetivo, inicio]
    return dia > a && dia < b
  }

  const ehPonta = (dia: Date) =>
    (inicio && dia.getTime() === inicio.getTime()) || (fim && dia.getTime() === fim.getTime())

  const podeAplicar = Boolean(inicio && fim)

  return (
    <div
      role="dialog"
      aria-label="Escolher intervalo de datas"
      className="absolute right-0 top-full mt-2 z-30 w-[290px] rounded-2xl bg-surface border border-white/10 shadow-xl p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setMesVisivel(somarMeses(mesVisivel, -1))}
          aria-label="Mês anterior"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span aria-live="polite" className="text-white text-sm font-medium">
          {MESES[mesVisivel.getUTCMonth()]} {mesVisivel.getUTCFullYear()}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMesVisivel(somarMeses(mesVisivel, 1))}
            // Não há dado no futuro; avançar além do mês atual só mostra vazio.
            disabled={ehMesmoMes(mesVisivel, hoje)}
            aria-label="Próximo mês"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="text-center text-slate-500 text-[10px] uppercase py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5" onMouseLeave={() => setPrevia(null)}>
        {dias.map((dia, i) => {
          if (!dia) return <span key={`v${i}`} />

          const futuro = dia > hoje
          const ponta = ehPonta(dia)
          const dentro = noTrecho(dia)

          return (
            <button
              key={dia.toISOString()}
              type="button"
              disabled={futuro}
              onClick={() => selecionar(dia)}
              onMouseEnter={() => inicio && !fim && setPrevia(dia)}
              aria-label={`${dia.getUTCDate()} de ${MESES[dia.getUTCMonth()]} de ${dia.getUTCFullYear()}`}
              aria-pressed={Boolean(ponta)}
              className={`h-8 rounded-lg text-xs tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                futuro
                  ? 'text-slate-600 cursor-not-allowed'
                  : ponta
                  ? 'bg-brand-500 text-white font-semibold'
                  : dentro
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {dia.getUTCDate()}
            </button>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between gap-2">
        <p className="text-slate-500 text-[11px] leading-tight">
          {inicio && fim
            ? `${formatarBr(escreverDataIso(inicio))} – ${formatarBr(escreverDataIso(fim))}`
            : inicio
            ? 'Agora escolha o fim'
            : 'Escolha o início'}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          {(inicio || fim) && (
            <button
              type="button"
              onClick={() => { setInicio(null); setFim(null); setPrevia(null) }}
              className="px-2 py-1 rounded-lg text-slate-400 text-xs hover:bg-white/5 transition-colors"
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            disabled={!podeAplicar}
            onClick={() => aoAplicar(escreverDataIso(inicio!), escreverDataIso(fim!))}
            className="px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

/** A grade do mês, com `null` nas casas antes do dia 1. */
function montarGrade(mes: Date): (Date | null)[] {
  const ano = mes.getUTCFullYear()
  const m = mes.getUTCMonth()

  const primeiro = new Date(Date.UTC(ano, m, 1))
  const diasNoMes = new Date(Date.UTC(ano, m + 1, 0)).getUTCDate()

  const grade: (Date | null)[] = Array(primeiro.getUTCDay()).fill(null)
  for (let d = 1; d <= diasNoMes; d++) grade.push(new Date(Date.UTC(ano, m, d)))

  return grade
}

function somarMeses(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
}

function ehMesmoMes(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()
}
