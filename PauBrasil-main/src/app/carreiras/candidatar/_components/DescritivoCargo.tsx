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
      <div className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm" onClick={aoFechar} />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="descritivo-titulo"
        tabIndex={-1}
        className="relative w-full max-w-lg my-8 rounded-2xl bg-white border border-[#e2d6cb] focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[#e7e1da]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[#7a1520]">{descritivo.grupo}</p>
            <h2 id="descritivo-titulo" className="text-lg font-bold text-[#1a1a1a] mt-1 break-words">
              {descritivo.cargo}
            </h2>
            {descritivo.tipoVaga && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-[#f4efe8] border border-[#e2d6cb] text-[#6f5c4e] text-xs">
                {descritivo.tipoVaga}
              </span>
            )}
          </div>

          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-[#6f5c4e] hover:text-[#7a1520] hover:bg-[#f4efe8] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!temConteudo && (
            <p className="text-[#6f5c4e] text-sm">
              O descritivo deste cargo ainda está sendo detalhado. Você pode se candidatar
              normalmente — a equipe de Gente entra em contato com os detalhes.
            </p>
          )}

          <Bloco icone={Briefcase} titulo="O que faz" texto={descritivo.atividades} />
          <Bloco icone={GraduationCap} titulo="Formação" texto={descritivo.formacaoCompleta} />
          <Bloco icone={ShieldCheck} titulo="Requisitos" texto={descritivo.exigencias} />
          <Bloco icone={ListChecks} titulo="Experiência" texto={descritivo.experiencia} />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#e7e1da]">
          <p className="text-[#6f5c4e] text-xs">
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
                ? 'bg-[#f4efe8] border border-[#e2d6cb] text-[#3f3732] hover:bg-[#f1ebe3]'
                : 'bg-[#7a1520]/10 border border-[#7a1520]/40 text-[#7a1520] hover:bg-[#7a1520]/15 disabled:opacity-40'
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
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#6f5c4e] mb-1.5">
        <Icone className="w-3.5 h-3.5" />
        {titulo}
      </h3>
      {/* O RH escreve uma atividade por linha; sem pre-wrap vira parágrafo. */}
      <p className="text-[#3f3732] text-sm leading-relaxed whitespace-pre-wrap break-words">{texto}</p>
    </section>
  )
}
