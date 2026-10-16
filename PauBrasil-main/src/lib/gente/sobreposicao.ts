/**
 * Reimportar sobrepõe, não duplica.
 *
 * As planilhas do RH são revisadas e reenviadas o tempo todo: acrescenta-se
 * uma pessoa, corrige-se uma coluna, e o arquivo inteiro volta. Com
 * `createMany` puro, a segunda importação criava uma cópia de todo mundo — o
 * quadro passou a mostrar a mesma pessoa duas vezes, com dados que podiam
 * divergir entre as cópias.
 *
 * A regra é uma só, e é a que já existia dentro de cada importador: **a chave
 * que identifica repetição dentro do arquivo identifica o registro no banco.**
 * Se duas linhas do mesmo arquivo seriam a mesma pessoa, então uma linha nova
 * e uma linha já gravada com aquela chave também são.
 *
 * Nem toda entidade pode ser apagada e recriada. Onde existe filho ou anexo —
 * o laudo do PCD, as vagas que apontam para o descritivo, as etapas do
 * candidato —, apagar perderia dado que a planilha não tem como repor. Por
 * isso este módulo só decide **quais registros colidem**; o que fazer com eles
 * é decisão de cada rota, que conhece as suas dependências.
 */

/**
 * Quais registros já gravados colidem com o que está chegando.
 *
 * Compara pela chave, não pelo id: o id do banco não existe na planilha.
 */
export function idsColididos<A extends { id: string }>(
  chavesChegando: Set<string>,
  existentes: A[],
  chaveDoExistente: (existente: A) => string
): string[] {
  return existentes.filter((e) => chavesChegando.has(chaveDoExistente(e))).map((e) => e.id)
}

/**
 * Casa cada registro já gravado com o que está chegando, pela chave.
 *
 * Para quem precisa **atualizar** em vez de apagar: devolve os pares para a
 * rota aplicar do jeito que a entidade exige. Registro sem par é criação nova.
 */
export function parearPorChave<Novo, Antigo extends { id: string }>(
  registros: Novo[],
  chaveDoNovo: (r: Novo, indice: number) => string,
  existentes: Antigo[],
  chaveDoExistente: (a: Antigo) => string
): { atualizar: { antigo: Antigo; novo: Novo }[]; criar: Novo[] } {
  const porChave = new Map<string, Antigo>()
  for (const e of existentes) {
    // O primeiro vence: se o banco já tem duplicatas de antes desta correção,
    // uma delas é atualizada e as outras entram em `idsColididos` para sumir.
    const chave = chaveDoExistente(e)
    if (!porChave.has(chave)) porChave.set(chave, e)
  }

  const atualizar: { antigo: Antigo; novo: Novo }[] = []
  const criar: Novo[] = []

  registros.forEach((novo, i) => {
    const antigo = porChave.get(chaveDoNovo(novo, i))
    if (antigo) atualizar.push({ antigo, novo })
    else criar.push(novo)
  })

  return { atualizar, criar }
}

/**
 * Folga para a transação **interativa** de uma importação.
 *
 * Só a forma interativa (`$transaction(async tx => ...)`) tem o limite de 5 s
 * — foi ele que derrubou a importação de cargos com P2028, porque cada `await`
 * é uma ida e volta ao banco e eram dezenas em sequência. Uma sobreposição faz
 * busca, exclusão e criação na mesma transação, então precisa da folga.
 *
 * A forma em lista (`$transaction([...])`) manda tudo num batch só e não sofre
 * esse limite — lá estas opções nem são aceitas.
 */
export const TRANSACAO_IMPORTACAO = { maxWait: 15_000, timeout: 120_000 } as const
