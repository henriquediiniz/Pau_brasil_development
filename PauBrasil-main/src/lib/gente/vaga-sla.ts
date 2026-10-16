/**
 * Regra de SLA de vaga — extraída do `recalculateVagaSla` do app externo do RH.
 *
 * `diasEmAberto` e `statusFechamento` não são colunas: são derivados aqui a cada
 * leitura. No app antigo eram gravados, o que fazia uma vaga aberta "congelar"
 * o contador até alguém reabrir a tela.
 *
 * Todas as comparações são por dia de calendário (UTC), não por timestamp —
 * uma vaga aberta às 23h e fechada às 01h do dia seguinte conta 1 dia, não 2.
 */

export type RecVagaStatusValue = 'ABERTA' | 'FECHADA' | 'CANCELADA'

export type RecStatusFechamentoValue =
  | 'ABERTA_NO_PRAZO'
  | 'ABERTA_VENCIDA'
  | 'FECHADA_NO_PRAZO'
  | 'FECHADA_FORA_PRAZO'

/**
 * Prazo usado só quando a vaga não tem `dataPrevistaFechamento`.
 * Espelha o fallback de 30 dias do app do RH.
 */
export const PRAZO_PADRAO_DIAS = 30

const MS_POR_DIA = 24 * 60 * 60 * 1000

export interface VagaSlaInput {
  status: RecVagaStatusValue
  dataAbertura: Date | null
  dataPrevistaFechamento?: Date | null
  dataContratacao?: Date | null
  /** Encerramento sem contratação (vaga cancelada). */
  encerradaEm?: Date | null
  /** Override do RH. Quando preenchido, vence o cálculo automático. */
  statusFechamentoManual?: RecStatusFechamentoValue | null
}

export interface VagaSla {
  /** Dias corridos entre a abertura e o encerramento (ou hoje, se ainda aberta). */
  diasEmAberto: number
  /** `null` para vaga cancelada — não faz sentido classificar prazo. */
  statusFechamento: RecStatusFechamentoValue | null
  /** Passou do prazo, esteja aberta ou fechada. */
  atrasada: boolean
  /** Dias além do prazo previsto. `0` quando dentro do prazo. */
  diasDeAtraso: number
  /** `true` quando o status veio do override manual do RH. */
  manual: boolean
}

/** Normaliza para meia-noite UTC, para comparar dias de calendário. */
function inicioDoDia(data: Date): number {
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.round((inicioDoDia(fim) - inicioDoDia(inicio)) / MS_POR_DIA)
}

function ehData(valor: Date | null | undefined): valor is Date {
  return valor instanceof Date && !Number.isNaN(valor.getTime())
}

/**
 * Data em que a vaga parou de contar dias.
 * `null` significa que ela ainda está correndo.
 */
function dataDeEncerramento(input: VagaSlaInput): Date | null {
  if (input.status === 'FECHADA') {
    if (ehData(input.dataContratacao)) return input.dataContratacao
    // Fechada sem data de contratação: o app antigo caía para a própria abertura,
    // registrando 0 dia. Mantemos o comportamento para não alterar o histórico.
    return ehData(input.dataAbertura) ? input.dataAbertura : null
  }

  if (input.status === 'CANCELADA') {
    if (ehData(input.encerradaEm)) return input.encerradaEm
    return ehData(input.dataAbertura) ? input.dataAbertura : null
  }

  return null
}

export function calcularSlaVaga(input: VagaSlaInput, hoje: Date = new Date()): VagaSla {
  const abertura = ehData(input.dataAbertura) ? input.dataAbertura : null
  const prazo = ehData(input.dataPrevistaFechamento) ? input.dataPrevistaFechamento : null
  const encerramento = dataDeEncerramento(input)
  const referencia = encerramento ?? hoje

  const diasEmAberto = abertura ? Math.max(0, diasEntre(abertura, referencia)) : 0

  // Atraso: se há prazo, compara com ele; senão, cai no fallback de 30 dias.
  const diasDeAtraso = prazo
    ? Math.max(0, diasEntre(prazo, referencia))
    : Math.max(0, diasEmAberto - PRAZO_PADRAO_DIAS)
  const atrasada = diasDeAtraso > 0

  if (input.status === 'CANCELADA') {
    return { diasEmAberto, statusFechamento: null, atrasada: false, diasDeAtraso: 0, manual: false }
  }

  if (input.statusFechamentoManual) {
    return {
      diasEmAberto,
      statusFechamento: input.statusFechamentoManual,
      atrasada,
      diasDeAtraso,
      manual: true,
    }
  }

  const statusFechamento: RecStatusFechamentoValue =
    input.status === 'FECHADA'
      ? atrasada
        ? 'FECHADA_FORA_PRAZO'
        : 'FECHADA_NO_PRAZO'
      : atrasada
      ? 'ABERTA_VENCIDA'
      : 'ABERTA_NO_PRAZO'

  return { diasEmAberto, statusFechamento, atrasada, diasDeAtraso, manual: false }
}

export const STATUS_FECHAMENTO_LABEL: Record<RecStatusFechamentoValue, string> = {
  ABERTA_NO_PRAZO: 'Vaga aberta no prazo',
  ABERTA_VENCIDA: 'Vaga aberta vencida',
  FECHADA_NO_PRAZO: 'Fechada no prazo',
  FECHADA_FORA_PRAZO: 'Fechada fora do prazo',
}
