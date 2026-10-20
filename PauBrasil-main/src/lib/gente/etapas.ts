/**
 * Etapas do processo seletivo.
 *
 * No app do RH cada etapa era uma coluna fixa da planilha (`entrevistadoGG`,
 * `aprovadoGestor`, `testePratico`, `testeDirecao`, `direcaoTeorico`), então
 * incluir uma etapa nova exigia mexer na estrutura. Aqui elas são linhas de
 * `RecCandidatoEtapa`, identificadas por uma chave estável.
 *
 * Esta lista é o catálogo padrão que a UI oferece; o banco aceita qualquer
 * chave, o que abre caminho para etapas por cargo na Fase 3.
 */

export type ResultadoEtapa = 'OK' | 'NAO' | 'NA'

export interface DefinicaoEtapa {
  chave: string
  label: string
  ordem: number
  /** Explica quando a etapa não se aplica, para o RH não marcar errado. */
  dica?: string
}

export const ETAPAS_PADRAO: readonly DefinicaoEtapa[] = [
  { chave: 'entrevista_gg', label: 'Entrevista G&G', ordem: 1 },
  { chave: 'aprovacao_gestor', label: 'Aprovação do gestor', ordem: 2 },
  { chave: 'teste_pratico', label: 'Teste prático', ordem: 3 },
  {
    chave: 'teste_direcao',
    label: 'Teste de direção',
    ordem: 4,
    dica: 'Só para cargos que dirigem',
  },
  {
    chave: 'direcao_teorico',
    label: 'Direção — teórico',
    ordem: 5,
    dica: 'Só para cargos que dirigem',
  },
] as const

const POR_CHAVE = new Map(ETAPAS_PADRAO.map((e) => [e.chave, e]))

export function definicaoEtapa(chave: string): DefinicaoEtapa {
  return POR_CHAVE.get(chave) ?? { chave, label: chave, ordem: 99 }
}

export interface EtapaRegistrada {
  chave: string
  resultado: ResultadoEtapa
  observacao?: string | null
  avaliadoEm?: Date | string | null
}

export interface ResumoEtapas {
  /** Etapas que valem para este candidato (exclui as marcadas como NA). */
  aplicaveis: number
  aprovadas: number
  reprovadas: number
  /** Aplicáveis que ainda não têm resultado registrado. */
  pendentes: number
  /** 0 a 100, sobre as aplicáveis. 0 quando não há nenhuma aplicável. */
  percentual: number
  /** Próxima etapa aplicável sem resultado, na ordem do catálogo. */
  proxima: DefinicaoEtapa | null
  /**
   * Uma reprovação interrompe o processo: mesmo que reste etapa pendente,
   * não faz sentido seguir. A UI usa isto para parar de cobrar as próximas.
   */
  bloqueada: boolean
  /** Todas as aplicáveis foram aprovadas. */
  concluida: boolean
}

/**
 * Consolida as etapas registradas de um candidato.
 *
 * Etapas do catálogo que não têm registro contam como pendentes. Etapas
 * marcadas como `NA` saem da conta — é assim que um cargo que não dirige
 * chega a 100% sem os dois testes de direção.
 */
export function resumirEtapas(registradas: EtapaRegistrada[]): ResumoEtapas {
  const porChave = new Map(registradas.map((e) => [e.chave, e]))

  // O universo é o catálogo mais qualquer chave extra já gravada no candidato.
  const chaves = new Set<string>([
    ...ETAPAS_PADRAO.map((e) => e.chave),
    ...registradas.map((e) => e.chave),
  ])

  let aplicaveis = 0
  let aprovadas = 0
  let reprovadas = 0
  let pendentes = 0
  const pendentesOrdenadas: DefinicaoEtapa[] = []

  for (const chave of Array.from(chaves)) {
    const registro = porChave.get(chave)

    if (registro?.resultado === 'NA') continue
    aplicaveis++

    if (registro?.resultado === 'OK') {
      aprovadas++
    } else if (registro?.resultado === 'NAO') {
      reprovadas++
    } else {
      pendentes++
      pendentesOrdenadas.push(definicaoEtapa(chave))
    }
  }

  pendentesOrdenadas.sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave))

  return {
    aplicaveis,
    aprovadas,
    reprovadas,
    pendentes,
    percentual: aplicaveis === 0 ? 0 : Math.round((aprovadas / aplicaveis) * 100),
    proxima: pendentesOrdenadas[0] ?? null,
    bloqueada: reprovadas > 0,
    concluida: aplicaveis > 0 && aprovadas === aplicaveis,
  }
}

/** Ordena etapas pelo catálogo, deixando chaves desconhecidas no fim. */
export function ordenarEtapas<T extends { chave: string }>(etapas: T[]): T[] {
  return [...etapas].sort((a, b) => {
    const da = definicaoEtapa(a.chave)
    const db = definicaoEtapa(b.chave)
    return da.ordem - db.ordem || a.chave.localeCompare(b.chave)
  })
}

/** Converte o que a planilha do RH traz (`OK`, `NÃO`, `N/A`, vazio). */
export function converterResultado(valor: unknown): ResultadoEtapa | null | 'invalida' {
  if (valor === null || valor === undefined) return null

  const s = String(valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()

  if (s === '') return null
  if (['ok', 'sim', 's', 'aprovado', 'apto'].includes(s)) return 'OK'
  if (['nao', 'n', 'reprovado', 'inapto'].includes(s)) return 'NAO'
  if (['na', 'naoseaplica', 'naoaplica'].includes(s)) return 'NA'
  return 'invalida'
}
