'use client'

import { useEffect, useRef } from 'react'
import { Briefcase, GraduationCap, ListChecks, ShieldCheck, X } from 'lucide-react'

/**
 * O descritivo do cargo, como o candidato vê.
 *
 * Só recebe o que `cargo-publico.ts` já projetou — nunca o registro do RH.
 * Testes, etapas do processo, observações internas e o critério de raio ficam
 * de fora antes de chegar aqui.
 */

export interface DescritivoPublico {
  id: string
  cargo: string
  grupo: string
  turno: string | null
  tipoVaga: string | null
  atividades: string | null
  experiencia: string | null
  formacaoCompleta: string | null
  exigencias: string | null
}

export function DescritivoCargo({
  descritivo,
  selecionado,
  podeSelecionar,
  aoSelecionar,
  aoFechar,
}: {
  descritivo: DescritivoPublico
  selecionado: boolean
  podeSelecionar: boolean
  aoSelecionar: () => void
  aoFechar: () => void
}) {
  const painel = useRef<HTMLDivElement>(null)
  const origem = useRef<HTMLElement | null>(null)

  useEffect(() => {
    origem.current = document.activeElement as HTMLElement | null
    painel.current?.focus()

    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)

    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = anterior
      origem.current?.focus?.()
    }
  }, [aoFechar])

  const temConteudo =
    descritivo.atividades || descritivo.formacaoCompleta || descritivo.exigencias || descritivo.experiencia

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={aoFechar} />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="descritivo-titulo"
        tabIndex={-1}
        className="relative w-full max-w-lg my-8 rounded-2xl bg-[#12121a] border border-white/10 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/8">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-brand-400">{descritivo.grupo}</p>
            <h2 id="descritivo-titulo" className="text-lg font-bold text-white mt-1 break-words">
              {descritivo.cargo}
            </h2>
            {descritivo.tipoVaga && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px]">
                {descritivo.tipoVaga}
              </span>
            )}
          </div>

          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!temConteudo && (
            <p className="text-slate-400 text-sm">
              O descritivo deste cargo ainda está sendo detalhado. Você pode se candidatar
              normalmente — a equipe de Gente entra em contato com os detalhes.
            </p>
          )}

          <Bloco icone={Briefcase} titulo="O que faz" texto={descritivo.atividades} />
          <Bloco icone={GraduationCap} titulo="Formação" texto={descritivo.formacaoCompleta} />
          <Bloco icone={ShieldCheck} titulo="Requisitos" texto={descritivo.exigencias} />
          <Bloco icone={ListChecks} titulo="Experiência" texto={descritivo.experiencia} />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/8">
          <p className="text-slate-500 text-[11px]">
            {selecionado
              ? 'Este cargo já está na sua seleção.'
              : podeSelecionar
              ? 'Gostou? Selecione e siga com a candidatura.'
              : 'Você já escolheu 3 cargos.'}
          </p>

          <button
            onClick={() => { aoSelecionar(); aoFechar() }}
            disabled={!selecionado && !podeSelecionar}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
              selecionado
                ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-40'
            }`}
          >
            {selecionado ? 'Remover' : 'Selecionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Bloco de um campo. Some inteiro quando não há conteúdo — rótulo com "não
 * informado" numa página pública passa a impressão de vaga mal cadastrada.
 */
function Bloco({
  icone: Icone,
  titulo,
  texto,
}: {
  icone: typeof Briefcase
  titulo: string
  texto: string | null
}) {
  if (!texto) return null

  return (
    <section>
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
        <Icone className="w-3.5 h-3.5" />
        {titulo}
      </h3>
      {/* O RH escreve uma atividade por linha; sem pre-wrap vira parágrafo. */}
      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{texto}</p>
    </section>
  )
}
