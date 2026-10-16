/**
 * Lotes de importação de vagas — o que o RH precisa para desfazer um arquivo
 * inteiro sem caçar linha por linha.
 *
 * Toda importação confirmada a partir de agora carimba `importacaoId` nas
 * vagas que criou, e desfazer é só apagar por esse id.
 *
 * O problema é o que já está no banco: as vagas importadas antes deste campo
 * existir têm `importacaoId` nulo — e são exatamente as que motivaram o pedido
 * ("importei e ficou errado, uma coluna da planilha"). Para elas, o que sobrou
 * como pista é o horário: um `createMany` grava todas as linhas dentro do
 * mesmo instante, então vagas sem lote criadas no mesmo minuto vieram do mesmo
 * arquivo. Duas ou mais no mesmo minuto é o corte — uma vaga sozinha num
 * minuto é cadastro de tela, e não entra em lote nenhum.
 *
 * O agrupamento é heurístico, então quem decide é o RH: a tela mostra
 * quantidade, data, operações e cargos antes de confirmar, e a exclusão nunca
 * toca em vaga com candidato vinculado.
 */

export interface VagaDoLote {
  id: string
  importacaoId: string | null
  createdAt: Date
  cargo: string
  operacaoNome: string | null
  /** Bloqueia a exclusão: candidato vinculado é histórico de processo. */
  temCandidatos: boolean
}

export interface LoteDeImportacao {
  /** `imp:<id>` para lote carimbado, `min:<ISO>` para o agrupamento por horário. */
  chave: string
  /** Carimbado na importação, ou inferido pelo horário de criação. */
  origem: 'carimbado' | 'inferido'
  criadoEm: Date
  total: number
  /** Quantas seriam de fato apagadas (as demais têm candidato vinculado). */
  removiveis: number
  bloqueadas: number
  operacoes: string[]
  /** Amostra para o RH reconhecer o arquivo, não a lista toda. */
  cargos: string[]
}

/** Quantos cargos distintos a prévia mostra antes de virar "e mais N". */
const AMOSTRA_CARGOS = 6

/** Chave do agrupamento por horário: o minuto em que a vaga foi criada. */
export function minutoDe(data: Date): string {
  return new Date(Math.floor(data.getTime() / 60000) * 60000).toISOString()
}

/**
 * Agrupa as vagas em lotes desfazíveis, do mais recente para o mais antigo.
 *
 * Vagas sem lote e sozinhas no seu minuto ficam de fora: são cadastro manual, e
 * oferecê-las como "importação" convidaria o RH a apagar o que digitou.
 */
export function agruparEmLotes(vagas: VagaDoLote[]): LoteDeImportacao[] {
  const grupos = new Map<string, VagaDoLote[]>()

  for (const vaga of vagas) {
    const chave = vaga.importacaoId
      ? `imp:${vaga.importacaoId}`
      : `min:${minutoDe(vaga.createdAt)}`
    const atual = grupos.get(chave)
    if (atual) atual.push(vaga)
    else grupos.set(chave, [vaga])
  }

  const lotes: LoteDeImportacao[] = []

  for (const [chave, itens] of Array.from(grupos.entries())) {
    const inferido = chave.startsWith('min:')
    if (inferido && itens.length < 2) continue

    const bloqueadas = itens.filter((v) => v.temCandidatos).length

    lotes.push({
      chave,
      origem: inferido ? 'inferido' : 'carimbado',
      criadoEm: itens.reduce(
        (menor, v) => (v.createdAt < menor ? v.createdAt : menor),
        itens[0].createdAt
      ),
      total: itens.length,
      removiveis: itens.length - bloqueadas,
      bloqueadas,
      operacoes: Array.from(
        new Set(itens.map((v) => v.operacaoNome).filter((n): n is string => Boolean(n)))
      ).sort(),
      cargos: Array.from(new Set(itens.map((v) => v.cargo))).sort().slice(0, AMOSTRA_CARGOS),
    })
  }

  return lotes.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
}

export interface AlvoDoLote {
  importacaoId?: string
  /** Início do minuto, para o lote inferido. */
  minutoInicio?: Date
}

/**
 * Traduz a chave que a tela devolve no filtro que seleciona aquele lote.
 *
 * Devolve `null` para chave malformada — quem chama recusa em vez de montar um
 * filtro vazio, que apagaria vagas demais.
 */
export function alvoDaChave(chave: string): AlvoDoLote | null {
  if (chave.startsWith('imp:')) {
    const id = chave.slice(4)
    return id ? { importacaoId: id } : null
  }

  if (chave.startsWith('min:')) {
    const inicio = new Date(chave.slice(4))
    if (Number.isNaN(inicio.getTime())) return null
    // O minuto tem que ser exatamente o começo — recusa uma chave forjada com
    // segundos, que ampliaria a janela para além do lote mostrado na tela.
    if (minutoDe(inicio) !== inicio.toISOString()) return null
    return { minutoInicio: inicio }
  }

  return null
}
