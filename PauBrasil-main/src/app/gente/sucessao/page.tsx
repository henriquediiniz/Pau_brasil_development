'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ClipboardCheck, Folder, List, Monitor,
  Search, TrendingUp, UserMinus, Users,
} from 'lucide-react'
import {
  AREA_LABEL, NIVEL_LABEL, rotuloProntidao,
  type Area, type ItemPipeline, type Nivel, type ResumoTrilha, type Trilha,
} from '@/lib/gente/pipeline'
import { DetalheSucessor } from './_components/DetalheSucessor'

/** O cartão clicado — o nome vai junto para o título não piscar vazio. */
type Selecionado = { id: string; nome: string }

interface Resposta {
  semEscopo?: boolean
  indicadores: {
    totalMapeamentos: number
    prontosAgora: number
    prontosAte1Ano: number
    emPreparacao: number
    cargosSemSucessorPronto: number
    promovidos: number
    desligados: number
  }
  trilhas: ResumoTrilha[]
  matriz: Record<Nivel, Record<Area, ItemPipeline[]>>
  areasComConteudo: Area[]
  niveisComConteudo: Nivel[]
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

/** Cores das trilhas, no mesmo espírito do diagrama que o RH já conhece. */
const TRILHA_ESTILO: Record<Trilha, { faixa: string; icone: typeof Monitor; anel: string }> = {
  analistas: { faixa: 'bg-violet-500', icone: Monitor, anel: 'border-violet-400 text-violet-400' },
  coordenadores: { faixa: 'bg-blue-600', icone: Search, anel: 'border-blue-500 text-blue-500' },
  gerentes: { faixa: 'bg-blue-500', icone: Users, anel: 'border-blue-400 text-blue-400' },
  supervisores: { faixa: 'bg-rose-400', icone: Folder, anel: 'border-rose-400 text-rose-400' },
  comercial_diretor: { faixa: 'bg-orange-500', icone: ClipboardCheck, anel: 'border-orange-400 text-orange-400' },
}

export default function PipelinePage() {
  const [operacaoId, setOperacaoId] = useState('')
  const [selecionado, setSelecionado] = useState<Selecionado | null>(null)

  const qs = useMemo(() => (operacaoId ? `?operacaoId=${operacaoId}` : ''), [operacaoId])

  const { data, error, isLoading } = useSWR<Resposta>(
    `/api/gente/sucessao/pipeline${qs}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  )

  const { data: operacoesData } = useSWR<{ items: { id: string; nome: string }[] }>(
    '/api/gente/operacoes?escopo=grupo',
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
          <Link
            href="/gente"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Pipeline de Sucessão</h1>
          <p className="text-slate-400 text-sm">
            {data ? `${data.indicadores.totalMapeamentos} mapeamentos` : 'Carregando…'} — quem está
            sendo preparado, por nível e por área
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <Link
            href="/gente/sucessao/lista"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
          >
            <List className="w-4 h-4" />
            Ver em lista
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          Não foi possível carregar o pipeline.
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
        </div>
      )}

      {data && data.indicadores.totalMapeamentos === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-medium">Nenhum mapeamento ainda</p>
          <p className="text-slate-500 text-sm">
            Importe a planilha do ciclo de gente para o pipeline ganhar vida.
          </p>
          <Link
            href="/gente/sucessao/importar"
            className="px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors"
          >
            Importar planilha
          </Link>
        </div>
      )}

      {data && data.indicadores.totalMapeamentos > 0 && (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Indicador
              icone={CheckCircle2}
              rotulo="Prontos agora"
              valor={data.indicadores.prontosAgora}
              tom="bom"
              nota={`${data.indicadores.prontosAte1Ano} prontos em até 1 ano`}
            />
            {/*
              O número grande conta pessoas. O rótulo anterior ("Sem sucessor
              pronto") descrevia cargos: quem lia 40 entendia 40 cargos
              descobertos, quando são 40 pessoas em preparação, em 26 cargos.
            */}
            <Indicador
              icone={AlertTriangle}
              rotulo="Em preparação"
              valor={data.indicadores.emPreparacao}
              tom={data.indicadores.emPreparacao > 0 ? 'alerta' : 'neutro'}
              nota={`em ${data.indicadores.cargosSemSucessorPronto} cargo${data.indicadores.cargosSemSucessorPronto === 1 ? '' : 's'} sem ninguém pronto`}
            />
            <Indicador
              icone={TrendingUp}
              rotulo="Promovidos"
              valor={data.indicadores.promovidos}
              tom="bom"
              nota="com movimentação registrada"
            />
            <Indicador
              icone={UserMinus}
              rotulo="Desligados"
              valor={data.indicadores.desligados}
              tom={data.indicadores.desligados > 0 ? 'alerta' : 'neutro'}
              nota="saíram do pipeline"
            />
          </div>

          {/* Trilhas de carreira */}
          <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 text-center">
              <p className="text-white font-display font-bold">Trilhas de carreira</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Colaboradores do grupo sendo preparados, por nível de destino
              </p>
            </div>

            <div className="grid sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              {data.trilhas.map((t) => {
                const estilo = TRILHA_ESTILO[t.trilha]
                const Icone = estilo.icone

                return (
                  <div key={t.trilha} className="flex flex-col">
                    <div className={`${estilo.faixa} px-3 py-2 text-center`}>
                      <span className="text-white text-xs font-bold uppercase tracking-wide">
                        {t.label}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-2 p-4">
                      <div
                        className={`w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center ${estilo.anel}`}
                      >
                        <Icone className="w-6 h-6" />
                      </div>

                      <dl className="text-center space-y-0.5">
                        <div className="text-sm">
                          <span className="text-white font-bold tabular-nums">{t.noProjeto}</span>{' '}
                          <span className="text-slate-500">no projeto</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-white font-bold tabular-nums">{t.promovidos}</span>{' '}
                          <span className="text-slate-500">promovidos</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-white font-bold tabular-nums">{t.disponiveis}</span>{' '}
                          <span className="text-slate-500">disponíveis</span>
                        </div>
                        {t.desligados > 0 && (
                          <div className="text-xs text-rose-400 pt-0.5">
                            {t.desligados} desligado{t.desligados > 1 ? 's' : ''}
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Matriz nível × área */}
          <Matriz dados={data} onAbrir={setSelecionado} />
        </>
      )}

      {selecionado && (
        <DetalheSucessor
          id={selecionado.id}
          nome={selecionado.nome}
          onFechar={() => setSelecionado(null)}
        />
      )}
    </div>
  )
}

// ─── Matriz ───────────────────────────────────────────────────────────────────

function Matriz({
  dados,
  onAbrir,
}: {
  dados: Resposta
  onAbrir: (s: Selecionado) => void
}) {
  const { matriz, areasComConteudo, niveisComConteudo } = dados

  if (areasComConteudo.length === 0) return null

  return (
    <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-white font-display font-bold">Mapa por nível e área</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Cada cartão é um sucessor, sob o cargo para o qual está sendo preparado.{' '}
            <span className="text-slate-400">Clique para abrir a ficha.</span>
          </p>
        </div>

        {/* A cor da borda do cartão carrega informação — sem legenda, não. */}
        <ul className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <ItemLegenda cor="border-emerald-500/40 bg-emerald-500/10" texto="Promovido" />
          <ItemLegenda cor="border-rose-500/40 bg-rose-500/10" texto="Desligado" />
          <ItemLegenda cor="border-dashed border-white/20" texto="Sem sucessor" />
        </ul>
      </div>

      {/*
        `table-fixed` reparte a largura igualmente entre as áreas em vez de
        deixar cada coluna pedir um mínimo — com min-w por coluna o total
        estourava o container e Armazém e Frota ficavam fora da tela.
        O `min-w` agora é da tabela inteira, só para o celular seguir rolando.
      */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Mapa de sucessão por nível e área"
        tabIndex={0}
      >
        <table className="w-full min-w-[880px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[120px]" />
            {areasComConteudo.map((area) => (
              <col key={area} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-surface border-b border-r border-white/8 p-2 text-left text-[11px] uppercase tracking-wide text-slate-500"
              >
                Nível
              </th>
              {areasComConteudo.map((area) => (
                <th
                  key={area}
                  scope="col"
                  className="border-b border-r border-white/8 bg-white/5 p-2 text-center text-[11px] font-bold uppercase tracking-wide text-white"
                >
                  {AREA_LABEL[area]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {niveisComConteudo.map((nivel) => (
              <tr key={nivel} className="align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface border-b border-r border-white/8 p-2 text-left text-xs font-bold uppercase tracking-wide text-white"
                >
                  {NIVEL_LABEL[nivel]}
                </th>

                {areasComConteudo.map((area) => {
                  const celula = matriz[nivel][area]

                  return (
                    <td key={area} className="border-b border-r border-white/8 p-1.5">
                      {celula.length === 0 ? (
                        /*
                          Célula vazia não é enfeite: num mapa de cobertura ela
                          diz que ninguém está sendo preparado ali. Fica visível,
                          mas baixa — antes ocupava 64px e empurrava a matriz.
                        */
                        <div
                          className="h-7 rounded-md border border-dashed border-white/8"
                          aria-label="Sem sucessores mapeados"
                        />
                      ) : (
                        <div className="space-y-2">
                          {agruparPorCargo(celula).map((grupo) => (
                            <div key={grupo.cargo}>
                              {/*
                                A posição na matriz só diz nível e área. Sem o
                                cargo, dois destinos diferentes na mesma célula
                                (Gerente de Vendas e Gerente Comercial) viravam
                                a mesma pilha de nomes.
                              */}
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight mb-1 break-words">
                                {grupo.cargo}
                              </p>
                              <div className="space-y-1">
                                {grupo.itens.map((item) => (
                                  <CartaoSucessor key={item.id} item={item} onAbrir={onAbrir} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ItemLegenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded border ${cor}`} aria-hidden />
      {texto}
    </li>
  )
}

/** Agrupa os sucessores da célula pelo cargo de destino, preservando a ordem. */
function agruparPorCargo(itens: ItemPipeline[]): { cargo: string; itens: ItemPipeline[] }[] {
  const porCargo = new Map<string, ItemPipeline[]>()

  for (const item of itens) {
    const cargo = item.cargoSucessao?.trim() || 'Cargo não informado'
    const atual = porCargo.get(cargo)
    if (atual) atual.push(item)
    else porCargo.set(cargo, [item])
  }

  return Array.from(porCargo, ([cargo, itens]) => ({ cargo, itens }))
}

function CartaoSucessor({
  item,
  onAbrir,
}: {
  item: ItemPipeline
  onAbrir: (s: Selecionado) => void
}) {
  const desligado = !item.ativo

  return (
    /*
      O cartão inteiro é o alvo, não só o nome: num cartão de 11px a área do
      texto é pequena demais para acertar no toque.
    */
    <button
      type="button"
      onClick={() => onAbrir({ id: item.id, nome: item.nomeSucessor })}
      aria-label={`Ver ficha de ${item.nomeSucessor}`}
      className={`w-full text-left rounded-lg border p-2 transition-colors hover:border-brand-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        desligado
          ? 'border-rose-500/20 bg-rose-500/5'
          : item.houveMovimentacao
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-white/8 bg-white/3'
      }`}
    >
      <div
        className={`text-[11px] font-semibold leading-tight break-words ${
          desligado ? 'text-rose-400 line-through' : 'text-white'
        }`}
      >
        {item.nomeSucessor}
      </div>

      {item.cargoAtualSucessor && (
        <div className="text-[10px] text-slate-500 leading-tight mt-0.5 break-words">
          hoje {item.cargoAtualSucessor}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 mt-1.5">
        <Etiqueta
          texto={rotuloProntidao(item)}
          cor={item.prontoAgora ? 'verde' : item.pronto1Ano ? 'azul' : 'cinza'}
        />
        {item.operacao && <Etiqueta texto={item.operacao.nome.replace(/^Pau Brasil /i, '')} cor="cinza" />}
        {item.cicloGente && (
          <Etiqueta
            texto={item.cicloGente}
            cor={/desligar/i.test(item.cicloGente) ? 'vermelho' : /muito bom|bom/i.test(item.cicloGente) ? 'amarelo' : 'roxo'}
          />
        )}
        {item.houveMovimentacao && !desligado && <Etiqueta texto="Promovido" cor="verde" />}
        {desligado && <Etiqueta texto="Desligado" cor="vermelho" />}
      </div>
    </button>
  )
}

function Etiqueta({
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
    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase ${cores[cor]}`}>
      {texto}
    </span>
  )
}

function Indicador({
  icone: Icone,
  rotulo,
  valor,
  nota,
  tom = 'neutro',
}: {
  icone: typeof Users
  rotulo: string
  valor: number
  nota?: string
  tom?: 'neutro' | 'alerta' | 'bom'
}) {
  const cor = tom === 'alerta' ? 'text-red-400' : tom === 'bom' ? 'text-emerald-400' : 'text-white'

  return (
    <div className="p-3 rounded-2xl bg-white/3 border border-white/8">
      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] uppercase tracking-wide">
        <Icone className="w-3 h-3" />
        {rotulo}
      </div>
      <div className={`mt-1 text-3xl font-display font-bold tabular-nums ${cor}`}>{valor}</div>
      {nota && <div className="text-slate-500 text-[11px] mt-0.5">{nota}</div>}
    </div>
  )
}
