import { normalizar } from './vaga-importador'

/**
 * Polos regionais: como o RH agrupa as operações para olhar a base.
 *
 * Definidos pelo PO em 2026-09-24. Não são matriz/filial (tipo de unidade) —
 * são a região que responde junto: quem está em Sumé concorre às mesmas
 * posições que quem está em Patos.
 *
 * A operação é reconhecida pela cidade no nome ("Pau Brasil Sumé") ou na
 * abreviação ("Sumé"), comparando palavra inteira e sem acento. Palavra inteira
 * importa: com `includes`, uma operação futura chamada "Barragem" cairia no
 * polo de Barra.
 */

export interface Polo {
  slug: string
  label: string
  /** Cidades das operações do polo, como aparecem no nome da operação. */
  cidades: string[]
}

export const POLOS: readonly Polo[] = [
  { slug: 'patos-sume', label: 'Patos + Sumé', cidades: ['Patos', 'Sumé'] },
  { slug: 'sousa-itaporanga', label: 'Sousa + Itaporanga', cidades: ['Sousa', 'Itaporanga'] },
  { slug: 'guarabira', label: 'Guarabira', cidades: ['Guarabira'] },
  {
    slug: 'brumado-cacule-barra',
    label: 'Brumado + Caculé + Barra',
    cidades: ['Brumado', 'Caculé', 'Barra'],
  },
] as const

export function poloPorSlug(slug: string): Polo | undefined {
  return POLOS.find((p) => p.slug === slug)
}

interface OperacaoNomeada {
  id: string
  nome: string
  nomeAbrev?: string | null
}

/** A cidade aparece como sequência de palavras inteiras no texto? */
function contemCidade(texto: string, cidade: string): boolean {
  const palavras = normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean)
  const alvo = normalizar(cidade).split(/[^a-z0-9]+/).filter(Boolean)
  if (alvo.length === 0) return false

  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((p, j) => palavras[i + j] === p)) return true
  }
  return false
}

/** Operações (da lista recebida) que pertencem ao polo. */
export function operacoesDoPolo<T extends OperacaoNomeada>(polo: Polo, operacoes: T[]): T[] {
  return operacoes.filter((op) =>
    polo.cidades.some(
      (cidade) => contemCidade(op.nome, cidade) || (op.nomeAbrev ? contemCidade(op.nomeAbrev, cidade) : false)
    )
  )
}
