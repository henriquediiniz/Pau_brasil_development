'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { FileText, MapPin, Pencil, X } from 'lucide-react'

/**
 * Ficha do descritivo de cargo, aberta ao clicar na linha da lista.
 *
 * Mesma escolha da ficha do sucessor: o detalhe não vem na listagem. São seis
 * campos de texto longo por cargo (atividades, competências, experiência,
 * exigências, etapas, testes) e a lista traz até 500 — carregar tudo de
 * antemão para mostrar o que se abre um de cada vez encheria a resposta.
 *
 * É ficha de leitura. Editar continua em `/gente/cargos/[id]/editar`, que já
 * valida e audita.
 */

interface Detalhe {
  id: string
  cargo: string
  area: string
  tipoVaga: string | null
  descricaoAtividades: string | null
  competenciasSugeridas: string | null
  experienciaSugerida: string | null
  formacao: string | null
  statusCurso: string | null
  curso: string | null
  exigencias: string | null
  observacoes: string | null
  etapasProcesso: string | null
  testes: string | null
  precisaAderenciaRaio: boolean
  ativo: boolean
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export function DetalheCargo({
  id,
  nome,
  podeEditar,
  onFechar,
}: {
  id: string
  /** Cargo já conhecido pela lista — evita título vazio enquanto carrega. */
  nome: string
  podeEditar: boolean
  onFechar: () => void
}) {
  const { data, error, isLoading } = useSWR<Detalhe>(`/api/gente/cargos/${id}`, fetcher, {
    revalidateOnFocus: false,
  })

  const painel = useRef<HTMLDivElement>(null)
  const origem = useRef<HTMLElement | null>(null)

  useEffect(() => {
    origem.current = document.activeElement as HTMLElement | null
    painel.current?.focus()

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      origem.current?.focus?.()
    }
  }, [onFechar])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ficha-cargo-titulo"
        tabIndex={-1}
        className="relative w-full max-w-3xl my-8 rounded-2xl bg-surface border border-white/10 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5" />
              Descrição de cargo
            </div>
            <h2
              id="ficha-cargo-titulo"
              className="text-lg font-display font-bold text-white mt-1 break-words"
            >
              {data?.cargo ?? nome}
            </h2>
            {data && (
              <p className="text-slate-400 text-sm mt-0.5 break-words">
                {data.area}
                {data.tipoVaga ? ` · ${data.tipoVaga}` : ''}
              </p>
            )}
          </div>

          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && !data && (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/8 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-5">
            <p className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
              Não foi possível carregar este descritivo.
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {!data.ativo && <Selo texto="Desativado" cor="vermelho" />}
                {data.precisaAderenciaRaio && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/15 text-amber-400 text-[11px] font-medium">
                    <MapPin className="w-3 h-3" />
                    Exige residência dentro do raio
                  </span>
                )}
              </div>

              <Secao titulo="Formação exigida">
                <Campo rotulo="Nível" valor={data.formacao} />
                <Campo rotulo="Status do curso" valor={data.statusCurso} />
                <Campo rotulo="Curso" valor={data.curso} />
              </Secao>

              <CampoLongo rotulo="Descrição das atividades" valor={data.descricaoAtividades} />
              <CampoLongo rotulo="Competências sugeridas" valor={data.competenciasSugeridas} />
              <CampoLongo rotulo="Experiência sugerida" valor={data.experienciaSugerida} />
              <CampoLongo rotulo="Exigências" valor={data.exigencias} />

              <div className="grid sm:grid-cols-2 gap-5">
                <CampoLongo rotulo="Etapas do processo" valor={data.etapasProcesso} />
                <CampoLongo rotulo="Testes previstos" valor={data.testes} />
              </div>

              {data.observacoes && (
                <CampoLongo rotulo="Observações" valor={data.observacoes} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-white/8">
              {podeEditar ? (
                <Link
                  href={`/gente/cargos/${data.id}/editar`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar descritivo
                </Link>
              ) : (
                <span />
              )}

              <button
                onClick={onFechar}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wide mb-2">{titulo}</h3>
      <div className="grid sm:grid-cols-3 gap-2">{children}</div>
    </section>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div className="p-3 rounded-xl bg-white/3 border border-white/8">
      <div className="text-slate-500 text-[10px] uppercase tracking-wide">{rotulo}</div>
      <div className={`text-sm mt-1 break-words ${valor ? 'text-white' : 'text-slate-600'}`}>
        {valor || 'Não informado'}
      </div>
    </div>
  )
}

/**
 * Os textos do descritivo são multilinha de propósito — uma competência por
 * linha, uma etapa por linha. `whitespace-pre-wrap` mantém isso; sem ele a
 * planilha do RH viraria um parágrafo corrido.
 */
function CampoLongo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <section>
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wide mb-2">{rotulo}</h3>
      <p
        className={`p-3 rounded-xl bg-white/3 border border-white/8 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          valor ? 'text-slate-200' : 'text-slate-600'
        }`}
      >
        {valor || 'Não informado'}
      </p>
    </section>
  )
}

function Selo({ texto, cor }: { texto: string; cor: 'vermelho' }) {
  const cores = { vermelho: 'bg-rose-500/15 text-rose-400 border-rose-500/20' } as const

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${cores[cor]}`}>
      {texto}
    </span>
  )
}
