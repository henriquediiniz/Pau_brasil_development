/**
 * Visão de pipeline do plano de sucessão: os indicadores do topo, as cinco
 * trilhas de carreira e a matriz nível × área.
 *
 * As regras de classificação vieram do app do RH (`PipelineSucessaoView`), que
 * deriva tudo do **nome do cargo** — não há campo de nível nem de área
 * normalizado na planilha deles. Manter a derivação aqui, em função pura,
 * permite testar cada regra e ajustar sem mexer na tela.
 */

import { normalizar } from './vaga-importador'

// ─── Trilhas de carreira (os 5 blocos do diagrama) ────────────────────────────

export const TRILHAS = [
  'analistas',
  'coordenadores',
  'gerentes',
  'supervisores',
  'comercial_diretor',
] as const

export type Trilha = (typeof TRILHAS)[number]

export const TRILHA_LABEL: Record<Trilha, string> = {
  analistas: 'Analistas',
  coordenadores: 'Coordenadores',
  gerentes: 'Gerentes',
  supervisores: 'Supervisores',
  comercial_diretor: 'Comercial e Diretor',
}

function contem(texto: string, ...termos: string[]): boolean {
  return termos.some((t) => texto.includes(t))
}

/**
 * Trilha de carreira do mapeamento.
 *
 * A ordem das checagens importa: "Gerente Comercial" é gerente, não comercial.
 * Por isso diretoria e gerência são avaliadas antes dos cargos comerciais.
 */
export function trilhaDoCargo(
  cargoSucessao: string | null | undefined,
  cargoAtual?: string | null,
  area?: string | null
): Trilha {
  const alvo = normalizar(cargoSucessao) || normalizar(cargoAtual)
  const a = normalizar(area)

  if (contem(alvo, 'diretor', 'diretora', 'executivo')) return 'comercial_diretor'
  if (contem(alvo, 'gerente', 'gerencia')) return 'gerentes'
  if (contem(alvo, 'coordenador', 'coordenadora', 'cordenador', 'coord')) return 'coordenadores'
  if (contem(alvo, 'supervisor', 'supervisora', 'superv')) return 'supervisores'

  if (
    contem(
      alvo,
      'analista', 'assistente', 'auxiliar', 'tecnico', 'especialista',
      'aprendiz', 'operador', 'motorista', 'conferente'
    )
  ) {
    return 'analistas'
  }

  if (
    contem(alvo, 'comercial', 'vendedor', 'consultor', 'promotor', 'representante') ||
    contem(a, 'vendas', 'comercial')
  ) {
    return 'comercial_diretor'
  }

  return 'analistas'
}

// ─── Matriz: níveis (linhas) × áreas (colunas) ────────────────────────────────

export const NIVEIS = ['diretor', 'gerencia', 'coordenacao', 'supervisao', 'analista'] as const
export type Nivel = (typeof NIVEIS)[number]

export const NIVEL_LABEL: Record<Nivel, string> = {
  diretor: 'Diretor',
  gerencia: 'Gerência',
  coordenacao: 'Coordenação',
  supervisao: 'Supervisão',
  analista: 'Analista',
}

export function nivelDoCargo(cargo: string | null | undefined): Nivel {
  const c = normalizar(cargo)

  if (contem(c, 'diretor', 'diretoria')) return 'diretor'
  if (contem(c, 'gerente', 'gerencia')) return 'gerencia'
  if (contem(c, 'coordenador', 'coordenadora', 'cordenador', 'cordenadora')) return 'coordenacao'
  if (contem(c, 'supervisor', 'supervisora')) return 'supervisao'
  return 'analista'
}

export const AREAS = [
  'vendas',
  'financeiro',
  'gente',
  'puxada',
  'distribuicao',
  'armazem',
  'frota',
  'outros',
] as const

export type Area = (typeof AREAS)[number]

export const AREA_LABEL: Record<Area, string> = {
  vendas: 'Vendas',
  financeiro: 'Financeiro',
  gente: 'Gente',
  puxada: 'Puxada',
  distribuicao: 'Distribuição Urbana',
  armazem: 'Armazém',
  frota: 'Frota',
  outros: 'Outras áreas',
}

/**
 * Coluna da matriz.
 *
 * O app do RH jogava tudo que não casava em "Armazém", o que enchia aquela
 * coluna de gente de outras áreas sem ninguém perceber. Aqui o que não casa vai
 * para "Outras áreas", que a tela só mostra quando tem alguém — assim o
 * problema fica visível em vez de escondido.
 */
export function areaDoCargo(area: string | null | undefined, cargo?: string | null): Area {
  const a = normalizar(area)
  const c = normalizar(cargo)

  if (contem(c, 'puxada') || contem(a, 'puxada')) return 'puxada'
  if (contem(c, 'frota') || contem(a, 'frota')) return 'frota'
  if (contem(a, 'comercial', 'vendas') || contem(c, 'venda', 'preco')) return 'vendas'
  if (contem(a, 'financeiro') || contem(c, 'finan')) return 'financeiro'
  if (contem(a, 'gente', 'recursos humanos') || contem(c, 'gente', 'tst', 'seguranca')) return 'gente'
  if (contem(a, 'distribuicao', 'operacional') || contem(c, 'distri')) return 'distribuicao'
  if (contem(a, 'armazem', 'logistico') || contem(c, 'armazem')) return 'armazem'

  return 'outros'
}

// ─── Consolidação ─────────────────────────────────────────────────────────────

export interface ItemPipeline {
  id: string
  cargoSucessao: string
  areaCargoSucessao: string | null
  nomeSucessor: string
  cargoAtualSucessor: string | null
  prontoAgora: boolean
  pronto1Ano: boolean
  pronto2Anos: boolean
  houveMovimentacao: boolean | null
  cicloGente: string | null
  ativo: boolean
  operacao: { nome: string } | null
}

export interface ResumoTrilha {
  trilha: Trilha
  label: string
  /** Mapeamentos ativos nesta trilha. */
  noProjeto: number
  promovidos: number
  /** Ativos e prontos agora — dá para mover hoje. */
  disponiveis: number
  desligados: number
}

export interface IndicadoresPipeline {
  totalMapeamentos: number
  /** Ativos e prontos agora. */
  prontosAgora: number
  /** Ativos que ficam prontos em até um ano (inclui os de agora). */
  prontosAte1Ano: number
  /** Ativos ainda em preparação. */
  emPreparacao: number
  /** Cargos distintos sem nenhum sucessor pronto agora. */
  cargosSemSucessorPronto: number
  promovidos: number
  desligados: number
}

export interface Pipeline {
  indicadores: IndicadoresPipeline
  trilhas: ResumoTrilha[]
  /** `matriz[nivel][area]` com os mapeamentos daquela célula. */
  matriz: Record<Nivel, Record<Area, ItemPipeline[]>>
  /** Só as áreas que têm alguém — evita 8 colunas vazias na tela. */
  areasComConteudo: Area[]
  niveisComConteudo: Nivel[]
}

export function montarPipeline(itens: ItemPipeline[]): Pipeline {
  const ativos = itens.filter((i) => i.ativo)

  const semSucessorPronto = ativos.filter((i) => !i.prontoAgora)
  const cargosSemSucessor = new Set(semSucessorPronto.map((i) => normalizar(i.cargoSucessao)))

  const indicadores: IndicadoresPipeline = {
    totalMapeamentos: itens.length,
    prontosAgora: ativos.filter((i) => i.prontoAgora).length,
    prontosAte1Ano: ativos.filter((i) => i.prontoAgora || i.pronto1Ano).length,
    emPreparacao: semSucessorPronto.length,
    cargosSemSucessorPronto: cargosSemSucessor.size,
    promovidos: itens.filter((i) => i.houveMovimentacao).length,
    desligados: itens.filter((i) => !i.ativo).length,
  }

  const trilhas: ResumoTrilha[] = TRILHAS.map((trilha) => {
    const daTrilha = itens.filter(
      (i) => trilhaDoCargo(i.cargoSucessao, i.cargoAtualSucessor, i.areaCargoSucessao) === trilha
    )
    const ativosDaTrilha = daTrilha.filter((i) => i.ativo)

    return {
      trilha,
      label: TRILHA_LABEL[trilha],
      noProjeto: ativosDaTrilha.length,
      promovidos: ativosDaTrilha.filter((i) => i.houveMovimentacao).length,
      disponiveis: ativosDaTrilha.filter((i) => i.prontoAgora).length,
      desligados: daTrilha.filter((i) => !i.ativo).length,
    }
  })

  const matriz = Object.fromEntries(
    NIVEIS.map((n) => [n, Object.fromEntries(AREAS.map((a) => [a, [] as ItemPipeline[]]))])
  ) as Record<Nivel, Record<Area, ItemPipeline[]>>

  for (const item of itens) {
    const nivel = nivelDoCargo(item.cargoSucessao)
    const area = areaDoCargo(item.areaCargoSucessao, item.cargoSucessao)
    matriz[nivel][area].push(item)
  }

  // Dentro da célula: quem está pronto primeiro, desligado por último.
  for (const nivel of NIVEIS) {
    for (const area of AREAS) {
      matriz[nivel][area].sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1
        if (a.prontoAgora !== b.prontoAgora) return a.prontoAgora ? -1 : 1
        return a.nomeSucessor.localeCompare(b.nomeSucessor)
      })
    }
  }

  return {
    indicadores,
    trilhas,
    matriz,
    areasComConteudo: AREAS.filter((a) => NIVEIS.some((n) => matriz[n][a].length > 0)),
    niveisComConteudo: NIVEIS.filter((n) => AREAS.some((a) => matriz[n][a].length > 0)),
  }
}

/** Rótulo curto de prontidão, como aparece no cartão. */
export function rotuloProntidao(item: {
  prontoAgora: boolean
  pronto1Ano: boolean
  pronto2Anos: boolean
}): string {
  if (item.prontoAgora) return 'Pronto já'
  if (item.pronto1Ano) return '1 ano'
  if (item.pronto2Anos) return '2 anos'
  return 'Sem horizonte'
}
