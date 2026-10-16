/**
 * Acompanhamento Frontline: índice de comprometimento de QLP.
 *
 * A pergunta que a tela responde é "quanto do quadro previsto está descoberto
 * agora". A conta vem do app do RH e é simples de propósito:
 *
 *     comprometimento (%) = vagas abertas ÷ QLP meta × 100
 *
 * Duas coisas que não são óbvias e valem registro:
 *
 * 1. O denominador é a **meta**, não o real. Usar o real faria o índice
 *    melhorar sozinho quando a unidade perde gente: some um posto do quadro
 *    real e o percentual cai, mesmo com a vaga continuando aberta. A meta é
 *    estável, que é o que um indicador de cobertura precisa.
 *
 * 2. As vagas abertas são a diferença entre o QLP meta e o QLP real
 *    (decisão do PO em 2026-10-07): meta 43 e real 42 é uma posição aberta.
 *    Até então vinham do Controle de Vagas, e como o RH não lança cada falta
 *    como requisição, a coluna ficava zerada com gente faltando no quadro.
 *    Quadro acima da meta não vira vaga negativa: conta zero.
 *
 * O teto (3,00% na Ambev) é parâmetro, não constante: meta corporativa muda, e
 * chumbar no código obrigaria deploy para acompanhar.
 */

export type Departamento = 'DPO' | 'SPO'

export const DEPARTAMENTOS: readonly Departamento[] = ['DPO', 'SPO'] as const

export const DEPARTAMENTO_LABEL: Record<Departamento, string> = {
  DPO: 'Frontline DPO',
  SPO: 'Frontline SPO',
}

/** Teto usado quando a empresa ainda não definiu o seu. */
export const TETO_PADRAO = 3

export const MESES_LABEL = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const

export interface CargoFrontline {
  id: string
  cargo: string
  atividade: string | null
  departamento: Departamento
  qlpMeta: number
  qlpReal: number
  operacaoId: string
  operacao?: { nome: string } | null
}

export interface LinhaFrontline extends CargoFrontline {
  /** Posições descobertas: QLP meta − QLP real, nunca negativo. */
  vagasAbertas: number
  comprometimento: number
  acimaDoTeto: boolean
}

export interface ResumoSegmento {
  departamento: Departamento
  qlpMeta: number
  qlpReal: number
  vagasAbertas: number
  comprometimento: number
  acimaDoTeto: boolean
}

/**
 * Normalização para casar o cargo do Controle de Vagas com o cargo do
 * Frontline. São dois cadastros digitados por pessoas diferentes: "Motorista
 * Caminhão Distribuição" e "MOTORISTA CAMINHAO DISTRIBUIÇÃO" têm que bater.
 */
export function chaveCargo(valor: string | null | undefined): string {
  if (!valor) return ''
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Comprometimento em %.
 *
 * Meta zero devolve 0, não infinito: cargo sem meta definida ainda não entrou
 * no acompanhamento, e mostrar "∞%" no painel só assusta.
 */
export function calcularComprometimento(vagasAbertas: number, qlpMeta: number): number {
  if (qlpMeta <= 0) return 0
  return (vagasAbertas / qlpMeta) * 100
}

/**
 * Posições descobertas de um cargo: quanto falta para o real chegar à meta.
 *
 * Real acima da meta dá zero, e não negativo — gente a mais num cargo não
 * cobre a falta em outro, e um número negativo somado no segmento esconderia
 * vagas abertas de verdade.
 */
export function calcularVagasAbertas(qlpMeta: number, qlpReal: number): number {
  return Math.max(0, qlpMeta - qlpReal)
}

export function montarLinhas(
  cargos: CargoFrontline[],
  teto: number = TETO_PADRAO
): LinhaFrontline[] {
  return cargos.map((c) => {
    const vagasAbertas = calcularVagasAbertas(c.qlpMeta, c.qlpReal)
    const comprometimento = calcularComprometimento(vagasAbertas, c.qlpMeta)

    return { ...c, vagasAbertas, comprometimento, acimaDoTeto: comprometimento > teto }
  })
}

/**
 * Resumo por departamento.
 *
 * O comprometimento do segmento é calculado sobre os **totais**, não pela
 * média dos cargos: um cargo de meta 1 com 1 vaga aberta daria 100% e puxaria
 * uma média para cima, mesmo sendo uma posição num quadro de setenta.
 */
export function resumirSegmento(
  linhas: LinhaFrontline[],
  departamento: Departamento,
  teto: number = TETO_PADRAO
): ResumoSegmento {
  const doSegmento = linhas.filter((l) => l.departamento === departamento)

  const qlpMeta = doSegmento.reduce((s, l) => s + l.qlpMeta, 0)
  const qlpReal = doSegmento.reduce((s, l) => s + l.qlpReal, 0)
  const vagasAbertas = doSegmento.reduce((s, l) => s + l.vagasAbertas, 0)
  const comprometimento = calcularComprometimento(vagasAbertas, qlpMeta)

  return {
    departamento,
    qlpMeta,
    qlpReal,
    vagasAbertas,
    comprometimento,
    acimaDoTeto: comprometimento > teto,
  }
}

/** Resumo consolidado dos dois departamentos. */
export function resumirGeral(linhas: LinhaFrontline[], teto: number = TETO_PADRAO) {
  const qlpMeta = linhas.reduce((s, l) => s + l.qlpMeta, 0)
  const qlpReal = linhas.reduce((s, l) => s + l.qlpReal, 0)
  const vagasAbertas = linhas.reduce((s, l) => s + l.vagasAbertas, 0)
  const comprometimento = calcularComprometimento(vagasAbertas, qlpMeta)

  return { qlpMeta, qlpReal, vagasAbertas, comprometimento, acimaDoTeto: comprometimento > teto }
}

/**
 * YTD dos percentuais mensais.
 *
 * Divide por 12 sempre, como o app do RH faz — é a média do **ano**, não dos
 * meses preenchidos. Em março o indicador fica baixo de propósito: o ano ainda
 * não aconteceu, e dividir por 3 daria uma projeção que ninguém pediu.
 */
export function calcularYtd(percentuais: (number | null | undefined)[]): number {
  const soma = percentuais.reduce<number>((s, p) => s + (p ?? 0), 0)
  return soma / 12
}

/** Os doze meses em ordem, preenchendo com 0 o que ainda não foi digitado. */
export function mesesDoAno(
  registros: { mes: number; percentual: number }[]
): { mes: number; label: string; percentual: number }[] {
  const porMes = new Map(registros.map((r) => [r.mes, r.percentual]))

  return MESES_LABEL.map((label, i) => ({
    mes: i + 1,
    label,
    percentual: porMes.get(i + 1) ?? 0,
  }))
}

export function ehDepartamento(valor: unknown): valor is Departamento {
  return valor === 'DPO' || valor === 'SPO'
}

/** Mês fora de 1..12 não existe; a rota recusa em vez de gravar lixo. */
export function ehMesValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 12
}
