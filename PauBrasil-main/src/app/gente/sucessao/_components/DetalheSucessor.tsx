'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Building2, FileText, Lock, Pencil, X } from 'lucide-react'
import { formatarDataBR } from '@/lib/gente/exportacao'
import { PRONTIDAO_LABEL, type Prontidao } from '@/lib/gente/sucessao'

/**
 * Ficha do sucessor, aberta ao clicar num cartão do pipeline.
 *
 * O detalhe **não** vem no payload do pipeline: a matriz carrega dezenas de
 * cartões e habilidade técnica, comportamental e PDI são três campos de texto
 * longo cada. Trazer tudo de antemão encheria a resposta para mostrar o que
 * quase nunca é aberto. A ficha busca por `id` quando abre.
 *
 * É uma ficha de leitura, não um formulário. Editar continua em
 * `/gente/sucessao/[id]/editar`, que já valida e audita — e o botão só aparece
 * para quem pode escrever na operação do registro, porque a leitura aqui é do
 * grupo inteiro mas a caneta continua sendo da unidade.
 */

interface Detalhe {
  id: string
  cargoSucessao: string
  areaCargoSucessao: string | null
  nomeSucessor: string
  cargoAtualSucessor: string | null
  prontoAgora: boolean
  pronto1Ano: boolean
  pronto2Anos: boolean
  habilidadeTecnica: string | null
  habilidadeComportamental: string | null
  planoDesenvolvimento: string | null
  inicioMapeamento: string | null
  houveMovimentacao: boolean | null
  observacao: string | null
  mesAno: string | null
  cicloGente: string | null
  ativo: boolean
  horizonte: Prontidao
  editavel: boolean
  operacao: { id: string; nome: string } | null
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export function DetalheSucessor({
  id,
  nome,
  onFechar,
}: {
  id: string
  /** Nome já conhecido pelo cartão — evita um título vazio enquanto carrega. */
  nome: string
  onFechar: () => void
}) {
  const { data, error, isLoading } = useSWR<Detalhe>(`/api/gente/sucessao/${id}`, fetcher, {
    revalidateOnFocus: false,
  })

  const painel = useRef<HTMLDivElement>(null)
  const origem = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Quem abriu a ficha deve receber o foco de volta ao fechar, senão o
    // teclado volta para o começo da página e a matriz inteira é perdida.
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
        aria-labelledby="ficha-sucessor-titulo"
        tabIndex={-1}
        className="relative w-full max-w-3xl my-8 rounded-2xl bg-surface border border-white/10 focus:outline-none"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5" />
              Ficha do sucessor
            </div>
            <h2
              id="ficha-sucessor-titulo"
              className="text-lg font-display font-bold text-white mt-1 break-words"
            >
              {data?.nomeSucessor ?? nome}
            </h2>
            {data && (
              <p className="text-slate-400 text-sm mt-0.5 break-words">
                sucessor de <span className="text-slate-300">{data.cargoSucessao}</span>
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
              Não foi possível carregar a ficha deste sucessor.
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="p-5 space-y-5">
              {/* Situação — o que muda a leitura de tudo abaixo */}
              <div className="flex flex-wrap items-center gap-2">
                <Selo
                  texto={PRONTIDAO_LABEL[data.horizonte]}
                  cor={
                    data.horizonte === 'agora'
                      ? 'verde'
                      : data.horizonte === '1_ano'
                      ? 'azul'
                      : data.horizonte === '2_anos'
                      ? 'amarelo'
                      : 'cinza'
                  }
                />
                <Selo texto={data.ativo ? 'Ativo' : 'Desligado'} cor={data.ativo ? 'cinza' : 'vermelho'} />
                {data.houveMovimentacao && <Selo texto="Promovido" cor="verde" />}
                {data.cicloGente && <Selo texto={`Ciclo: ${data.cicloGente}`} cor="roxo" />}
              </div>

              <Secao titulo="Posição mapeada">
                <Campo rotulo="Cargo a sucessão" valor={data.cargoSucessao} />
                <Campo rotulo="Área do cargo" valor={data.areaCargoSucessao} />
                <Campo
                  rotulo="Operação / filial"
                  valor={data.operacao?.nome}
                  icone={Building2}
                />
              </Secao>

              <Secao titulo="Sucessor">
                <Campo rotulo="Nome mapeado" valor={data.nomeSucessor} />
                <Campo rotulo="Cargo atual" valor={data.cargoAtualSucessor} />
              </Secao>

              <Secao titulo="Prontidão">
                <Campo rotulo="Pronto agora?" valor={simNao(data.prontoAgora)} />
                <Campo rotulo="Pronto em 1 ano?" valor={simNao(data.pronto1Ano)} />
                <Campo rotulo="Pronto em 2 anos?" valor={simNao(data.pronto2Anos)} />
              </Secao>

              <CampoLongo
                rotulo="Habilidade técnica a potencializar / desenvolver"
                valor={data.habilidadeTecnica}
              />
              <CampoLongo
                rotulo="Habilidade comportamental a potencializar / desenvolver"
                valor={data.habilidadeComportamental}
              />
              <CampoLongo
                rotulo="Plano de desenvolvimento individual (PDI)"
                valor={data.planoDesenvolvimento}
              />

              <Secao titulo="Acompanhamento">
                <Campo rotulo="Início do mapeamento" valor={formatarDataBR(data.inicioMapeamento)} />
                <Campo rotulo="Mês / ano da promoção" valor={data.mesAno} />
                <Campo rotulo="Status atual" valor={data.ativo ? 'Ativo' : 'Desligado'} />
                <Campo rotulo="Houve promoção?" valor={simNao(data.houveMovimentacao)} />
                <Campo rotulo="Ciclo de gente" valor={data.cicloGente} />
              </Secao>

              {data.observacao && (
                <CampoLongo rotulo="Observação / programa" valor={data.observacao} />
              )}
            </div>

            {/* Rodapé */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-white/8">
              {data.editavel ? (
                <Link
                  href={`/gente/sucessao/${data.id}/editar`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Editar mapeamento
                </Link>
              ) : (
                <p
                  className="inline-flex items-center gap-1.5 text-slate-500 text-xs"
                  title={`Mapeamento de ${data.operacao?.nome ?? 'outra operação'}`}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Mapeamento de {data.operacao?.nome ?? 'outra operação'} — consulta apenas
                </p>
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

/** `null` é "não informado"; `false` é "não". A ficha precisa distinguir. */
function simNao(valor: boolean | null | undefined): string | null {
  if (valor === null || valor === undefined) return null
  return valor ? 'Sim' : 'Não'
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wide mb-2">{titulo}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{children}</div>
    </section>
  )
}

function Campo({
  rotulo,
  valor,
  icone: Icone,
}: {
  rotulo: string
  valor: string | null | undefined
  icone?: typeof Building2
}) {
  return (
    <div className="p-3 rounded-xl bg-white/3 border border-white/8">
      <div className="text-slate-500 text-[10px] uppercase tracking-wide">{rotulo}</div>
      <div className="flex items-start gap-1.5 mt-1">
        {Icone && valor && <Icone className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />}
        <span className={`text-sm break-words ${valor ? 'text-white' : 'text-slate-600'}`}>
          {valor || 'Não informado'}
        </span>
      </div>
    </div>
  )
}

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

function Selo({
  texto,
  cor,
}: {
  texto: string
  cor: 'verde' | 'azul' | 'cinza' | 'amarelo' | 'roxo' | 'vermelho'
}) {
  const cores = {
    verde: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    azul: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    cinza: 'bg-white/5 text-slate-400 border-white/10',
    amarelo: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    roxo: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    vermelho: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  } as const

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${cores[cor]}`}>
      {texto}
    </span>
  )
}
