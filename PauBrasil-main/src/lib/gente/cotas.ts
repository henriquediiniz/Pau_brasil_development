/**
 * Cotas legais de PCD e de aprendizes.
 *
 * O app do RH acompanhava meta e realizado digitados à mão. Aqui a meta legal
 * é derivada do quadro, porque ela não é opinião: sai da lei. O RH continua
 * podendo registrar a própria meta por mês (às vezes mais agressiva que a
 * legal), mas passa a ver as duas lado a lado.
 */

// ─── Base das cotas: sem aprendizes e estagiários ─────────────────────────────

/**
 * Quem fica fora da base das duas cotas.
 *
 * As cotas contam **empregados**. Jovem aprendiz tem contrato especial (Lei
 * 10.097/2000) e estagiário nem vínculo de emprego tem (Lei 11.788/2008) —
 * nenhum dos dois entra na base da cota de PCD (art. 93 da Lei 8.213/91) nem
 * na de aprendizes. Contá-los empurrava a Pau Brasil de 198 para 209, de 2%
 * para 3%, e a cota de PCD de 4 para 7. Na cota de aprendizes era pior: os
 * próprios aprendizes inflavam a base que define quantos aprendizes contratar.
 *
 * O QLP não tem campo de tipo de vínculo, então o sinal é o cargo. Os termos
 * são radicais de propósito: "ESTAGI" pega ESTAGIÁRIO, ESTAGIARIA e com ou sem
 * acento; "APRENDIZ" pega JOVEM APRENDIZ LOGISTICA, JOVEM APRENDIZ (DR
 * FORMIGA) e as demais variações da planilha. Abreviação não conta: "APR" em
 * ANALISTA DE VENDAS/APR não é aprendiz (confirmado pelo PO em 2026-09-28).
 */
export const TERMOS_APRENDIZ_OU_ESTAGIARIO = ['APRENDIZ', 'ESTAGI'] as const

export function ehAprendizOuEstagiario(cargo: string | null | undefined): boolean {
  if (!cargo) return false
  const c = cargo.toUpperCase()
  return TERMOS_APRENDIZ_OU_ESTAGIARIO.some((t) => c.includes(t))
}

/**
 * O mesmo critério de `ehAprendizOuEstagiario`, como filtro do Prisma.
 *
 * Os dois precisam andar juntos: um decide no banco, o outro nos testes e em
 * qualquer tela que precise explicar a conta.
 *
 * Use para **contar os excluídos** e subtrair do total — não com `NOT` para
 * contar a base direto: `NOT (NULL ILIKE ...)` é NULL no SQL, e quem está sem
 * cargo preenchido sumiria da base em silêncio.
 */
export const WHERE_APRENDIZ_OU_ESTAGIARIO = {
  OR: TERMOS_APRENDIZ_OU_ESTAGIARIO.map((t) => ({
    cargo: { contains: t, mode: 'insensitive' as const },
  })),
}

// ─── PCD — Lei 8.213/1991, art. 93 ────────────────────────────────────────────

export interface FaixaCota {
  /** Mínimo de colaboradores da faixa (inclusivo). */
  de: number
  /** Máximo da faixa (inclusivo). `null` = sem teto. */
  ate: number | null
  percentual: number
}

export const FAIXAS_COTA_PCD: readonly FaixaCota[] = [
  { de: 100, ate: 200, percentual: 2 },
  { de: 201, ate: 500, percentual: 3 },
  { de: 501, ate: 1000, percentual: 4 },
  { de: 1001, ate: null, percentual: 5 },
] as const

export interface CotaPcd {
  /** Quadro considerado no cálculo — já sem aprendizes e estagiários. */
  quadro: number
  /** Percentual exigido. `0` quando a empresa está abaixo de 100 colaboradores. */
  percentual: number
  /** Número de vagas de PCD exigidas por lei, arredondado para cima. */
  exigido: number
  ocupado: number
  /** Quanto falta para cumprir. `0` quando está em dia. */
  faltam: number
  emDia: boolean
  /** Abaixo de 100 colaboradores a cota não se aplica. */
  aplicavel: boolean
}

/**
 * Cota legal de PCD para um quadro.
 *
 * A lei arredonda para cima: 2% de 150 dá 3, não 3,0 truncado para 3 — e 2% de
 * 101 dá 2,02, que vira 3 vagas. Arredondar para baixo deixaria a empresa
 * irregular achando que está em dia, então o arredondamento é sempre `ceil`.
 */
export function calcularCotaPcd(quadro: number, ocupado: number): CotaPcd {
  const faixa = FAIXAS_COTA_PCD.find(
    (f) => quadro >= f.de && (f.ate === null || quadro <= f.ate)
  )

  if (!faixa) {
    return {
      quadro,
      percentual: 0,
      exigido: 0,
      ocupado,
      faltam: 0,
      emDia: true,
      aplicavel: false,
    }
  }

  const exigido = Math.ceil((quadro * faixa.percentual) / 100)

  return {
    quadro,
    percentual: faixa.percentual,
    exigido,
    ocupado,
    faltam: Math.max(0, exigido - ocupado),
    emDia: ocupado >= exigido,
    aplicavel: true,
  }
}

// ─── Aprendizes — Lei 10.097/2000, art. 429 ───────────────────────────────────

export const PERCENTUAL_MINIMO_APRENDIZ = 5
export const PERCENTUAL_MAXIMO_APRENDIZ = 15

export interface CotaAprendiz {
  quadro: number
  minimo: number
  maximo: number
  contratados: number
  emDia: boolean
  /** Acima do teto legal também é irregular, não só abaixo do piso. */
  acimaDoTeto: boolean
  faltam: number
}

/**
 * Faixa legal de aprendizes: de 5% a 15% do quadro cujas funções demandam
 * formação profissional.
 *
 * `quadro` é o QLP ativo sem aprendizes e estagiários (ver
 * `WHERE_APRENDIZ_OU_ESTAGIARIO`). A lei ainda permite tirar da base as funções
 * que não demandam formação profissional; o sistema não sabe quais são, e
 * chutar isso produziria um número errado com cara de certo.
 */
export function calcularCotaAprendiz(quadro: number, contratados: number): CotaAprendiz {
  const minimo = Math.ceil((quadro * PERCENTUAL_MINIMO_APRENDIZ) / 100)
  const maximo = Math.floor((quadro * PERCENTUAL_MAXIMO_APRENDIZ) / 100)

  return {
    quadro,
    minimo,
    maximo,
    contratados,
    emDia: contratados >= minimo && contratados <= maximo,
    acimaDoTeto: contratados > maximo,
    faltam: Math.max(0, minimo - contratados),
  }
}

// ─── Vigência de contrato de aprendiz ─────────────────────────────────────────

export type SituacaoVigencia = 'vigente' | 'vencendo' | 'vencido' | 'sem_contrato'

export interface Vigencia {
  situacao: SituacaoVigencia
  /** Dias até o término. Negativo quando já venceu. `null` sem data. */
  diasRestantes: number | null
}

/** Janela em que o contrato entra em "vencendo" e o RH precisa agir. */
export const DIAS_ALERTA_VENCIMENTO = 60

const MS_POR_DIA = 24 * 60 * 60 * 1000

function inicioDoDia(data: Date): number {
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
}

/**
 * Situação do contrato de aprendiz.
 *
 * Contrato de aprendizagem tem prazo determinado e não pode ser renovado
 * indefinidamente, então o vencimento é uma data que o RH precisa ver chegando
 * — não descobrir depois.
 */
export function calcularVigencia(
  terminoContrato: Date | null | undefined,
  hoje: Date = new Date()
): Vigencia {
  if (!terminoContrato || Number.isNaN(terminoContrato.getTime())) {
    return { situacao: 'sem_contrato', diasRestantes: null }
  }

  const dias = Math.round((inicioDoDia(terminoContrato) - inicioDoDia(hoje)) / MS_POR_DIA)

  if (dias < 0) return { situacao: 'vencido', diasRestantes: dias }
  if (dias <= DIAS_ALERTA_VENCIMENTO) return { situacao: 'vencendo', diasRestantes: dias }
  return { situacao: 'vigente', diasRestantes: dias }
}

export const SITUACAO_VIGENCIA_LABEL: Record<SituacaoVigencia, string> = {
  vigente: 'Vigente',
  vencendo: 'Vencendo',
  vencido: 'Vencido',
  sem_contrato: 'Sem data de término',
}
