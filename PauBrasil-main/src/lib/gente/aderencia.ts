/**
 * Verificador de aderência: compara uma vaga aberta com o descritivo de cargo
 * padrão da empresa.
 *
 * No app do RH isso era uma chamada ao Gemini que devolvia texto livre. O
 * problema de depender só do modelo é que a resposta muda a cada execução e
 * não dá para auditar por que uma vaga foi apontada como divergente.
 *
 * Aqui a análise estrutural é **determinística e testável**: campo a campo,
 * com regras explícitas. Uma camada de IA pode enriquecer isso depois com
 * roteiro de entrevista e texto corrido, mas o diagnóstico que o RH usa para
 * cobrar correção não depende de modelo nenhum.
 */

export type Severidade = 'alta' | 'media' | 'baixa'

export interface Divergencia {
  campo: string
  rotulo: string
  severidade: Severidade
  mensagem: string
  /** O que o descritivo padrão define. */
  esperado?: string | null
  /** O que a vaga declarou. */
  encontrado?: string | null
}

export interface VagaParaAderencia {
  cargo: string
  area?: string | null
  requisitosMinimos?: string | null
  formacao?: string | null
  informacoesComplementares?: string | null
  salario?: number | null
}

export interface CargoParaAderencia {
  cargo: string
  area: string
  formacao?: string | null
  exigencias?: string | null
  experienciaSugerida?: string | null
  competenciasSugeridas?: string | null
  testes?: string | null
  etapasProcesso?: string | null
  descricaoAtividades?: string | null
  precisaAderenciaRaio?: boolean
}

export interface ResultadoAderencia {
  /** 0 a 100. Desconta por divergência, com peso pela severidade. */
  pontuacao: number
  divergencias: Divergencia[]
  /** Quantos pontos de conferência foram avaliados. */
  itensAvaliados: number
  /** Sem descritivo não há o que comparar. */
  temDescritivo: boolean
}

const PESO: Record<Severidade, number> = { alta: 20, media: 10, baixa: 5 }

function normalizar(valor: string | null | undefined): string {
  if (!valor) return ''
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Palavras com significado, para comparar requisitos sem exigir texto igual. */
function termos(valor: string | null | undefined): Set<string> {
  const ignorar = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'a', 'o', 'as', 'os', 'em', 'para',
    'com', 'sem', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'ao', 'que', 'por',
  ])

  return new Set(
    normalizar(valor)
      .split(' ')
      .filter((t) => t.length > 2 && !ignorar.has(t))
  )
}

/** Quanto dos termos do padrão aparecem no texto da vaga, de 0 a 1. */
function cobertura(padrao: string | null | undefined, vaga: string | null | undefined): number {
  const alvo = termos(padrao)
  if (alvo.size === 0) return 1

  const texto = termos(vaga)
  let encontrados = 0
  for (const termo of Array.from(alvo)) {
    if (texto.has(termo)) encontrados++
  }

  return encontrados / alvo.size
}

/**
 * Compara vaga e descritivo.
 *
 * Sem descritivo cadastrado o resultado não é "0% de aderência" — é "não dá
 * para avaliar". Dizer 0 sugeriria que a vaga está errada, quando o que falta
 * é o padrão.
 */
export function analisarAderencia(
  vaga: VagaParaAderencia,
  cargo: CargoParaAderencia | null
): ResultadoAderencia {
  if (!cargo) {
    return { pontuacao: 0, divergencias: [], itensAvaliados: 0, temDescritivo: false }
  }

  const divergencias: Divergencia[] = []
  let itensAvaliados = 0

  // ── Área ──
  if (cargo.area) {
    itensAvaliados++
    if (!vaga.area) {
      divergencias.push({
        campo: 'area',
        rotulo: 'Área',
        severidade: 'media',
        mensagem: 'A vaga não declarou área, mas o descritivo define uma.',
        esperado: cargo.area,
        encontrado: null,
      })
    } else if (normalizar(vaga.area) !== normalizar(cargo.area)) {
      divergencias.push({
        campo: 'area',
        rotulo: 'Área',
        severidade: 'media',
        mensagem: 'A área da vaga não bate com a do descritivo.',
        esperado: cargo.area,
        encontrado: vaga.area,
      })
    }
  }

  // ── Formação ──
  if (cargo.formacao) {
    itensAvaliados++
    if (!vaga.formacao) {
      divergencias.push({
        campo: 'formacao',
        rotulo: 'Formação',
        severidade: 'alta',
        mensagem: 'O descritivo exige formação e a vaga não informou nenhuma.',
        esperado: cargo.formacao,
        encontrado: null,
      })
    } else if (cobertura(cargo.formacao, vaga.formacao) < 0.5) {
      divergencias.push({
        campo: 'formacao',
        rotulo: 'Formação',
        severidade: 'alta',
        mensagem: 'A formação pedida na vaga diverge do padrão do cargo.',
        esperado: cargo.formacao,
        encontrado: vaga.formacao,
      })
    }
  }

  // ── Exigências e experiência ──
  const requisitosDaVaga = [vaga.requisitosMinimos, vaga.informacoesComplementares]
    .filter(Boolean)
    .join(' ')

  for (const [campo, rotulo, padrao] of [
    ['exigencias', 'Exigências', cargo.exigencias],
    ['experienciaSugerida', 'Experiência', cargo.experienciaSugerida],
    ['competenciasSugeridas', 'Competências', cargo.competenciasSugeridas],
  ] as const) {
    if (!padrao) continue
    itensAvaliados++

    // Faixas: abaixo de 40% dos termos do padrão é lacuna séria; entre 40% e
    // 75% é aviso. Antes o corte era 1/3, o que fazia "2 de 3 termos cobertos"
    // passar em silêncio — justamente o caso em que a vaga cita "CNH" mas
    // esquece "categoria D", que é o erro que o RH mais quer ver.
    const cob = cobertura(padrao, requisitosDaVaga)
    if (cob < 0.4) {
      divergencias.push({
        campo,
        rotulo,
        severidade: campo === 'exigencias' ? 'alta' : 'media',
        mensagem: `A vaga quase não reflete ${rotulo.toLowerCase()} do descritivo.`,
        esperado: padrao,
        encontrado: vaga.requisitosMinimos ?? null,
      })
    } else if (cob < 0.75) {
      divergencias.push({
        campo,
        rotulo,
        severidade: 'baixa',
        mensagem: `A vaga cobre só parte de ${rotulo.toLowerCase()} do descritivo.`,
        esperado: padrao,
        encontrado: vaga.requisitosMinimos ?? null,
      })
    }
  }

  // ── Testes e etapas: informativos, mas a ausência na vaga é sinal ──
  if (cargo.testes) {
    itensAvaliados++
    if (cobertura(cargo.testes, requisitosDaVaga) === 0) {
      divergencias.push({
        campo: 'testes',
        rotulo: 'Testes',
        severidade: 'baixa',
        mensagem: 'A vaga não menciona os testes previstos no descritivo.',
        esperado: cargo.testes,
        encontrado: null,
      })
    }
  }

  // ── Aderência de raio de residência ──
  if (cargo.precisaAderenciaRaio) {
    itensAvaliados++
    const mencionaResidencia = /residencia|residir|proximidade|raio|mora/.test(
      normalizar(requisitosDaVaga)
    )
    if (!mencionaResidencia) {
      divergencias.push({
        campo: 'aderenciaRaio',
        rotulo: 'Raio de residência',
        severidade: 'media',
        mensagem:
          'O descritivo exige aderência de raio de residência, e a vaga não cita nada sobre isso.',
        esperado: 'Exigir residência dentro do raio definido',
        encontrado: null,
      })
    }
  }

  const desconto = divergencias.reduce((soma, d) => soma + PESO[d.severidade], 0)

  return {
    pontuacao: Math.max(0, 100 - desconto),
    divergencias,
    itensAvaliados,
    temDescritivo: true,
  }
}

/** Encontra o descritivo que corresponde a uma vaga, por cargo (e área). */
export function encontrarDescritivo<T extends { id?: string; cargo: string; area: string }>(
  vaga: { cargo: string; area?: string | null; cargoId?: string | null },
  cargos: T[]
): T | null {
  /*
    Vínculo explícito ganha do nome. A vaga aberta a partir de um descritivo
    guarda `cargoId`; aí não há o que adivinhar, e renomear o descritivo depois
    não desliga a conferência.

    O caminho por nome fica para as vagas antigas e para quem digitou o cargo
    à mão, que continuam existindo.
  */
  if (vaga.cargoId) {
    const porId = cargos.find((c) => c.id === vaga.cargoId)
    if (porId) return porId
  }

  const alvoCargo = normalizar(vaga.cargo)

  const mesmoCargo = cargos.filter((c) => normalizar(c.cargo) === alvoCargo)
  if (mesmoCargo.length === 0) return null
  if (mesmoCargo.length === 1) return mesmoCargo[0]

  // Mais de um descritivo com o mesmo cargo: a área desempata.
  const porArea = mesmoCargo.find((c) => normalizar(c.area) === normalizar(vaga.area))
  return porArea ?? mesmoCargo[0]
}
