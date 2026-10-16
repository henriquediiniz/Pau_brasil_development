import { normalizar } from './vaga-importador'

/**
 * Classificação matriz/filial dos candidatos internos.
 *
 * O campo `matrizOuFilial` é texto livre digitado na planilha do ciclo de
 * gente. Na prática vem "MATRIZ", "Matriz", "filial", "Filial Sousa", e às
 * vezes vazio. Filtrar por igualdade exata deixaria metade da base de fora,
 * então a classificação é feita por reconhecimento do termo.
 *
 * O que não dá para classificar fica em `SEM_INFORMACAO` em vez de ser
 * empurrado para um dos dois lados: um registro sem informação não é matriz
 * nem filial, e some da lista se for contado como qualquer um deles.
 */

export const LOTACOES = ['MATRIZ', 'FILIAL', 'SEM_INFORMACAO'] as const
export type Lotacao = (typeof LOTACOES)[number]

export const LOTACAO_LABEL: Record<Lotacao, string> = {
  MATRIZ: 'Matriz',
  FILIAL: 'Filial',
  SEM_INFORMACAO: 'Sem informação',
}

export function ehLotacao(valor: string): valor is Lotacao {
  return (LOTACOES as readonly string[]).includes(valor)
}

/** Em que lotação o texto da planilha se encaixa. */
export function classificarLotacao(valor: string | null | undefined): Lotacao {
  const texto = normalizar(valor ?? '')
  if (texto === '') return 'SEM_INFORMACAO'

  // "Matriz" primeiro: quem escreve "Matriz/Filial" está na matriz e usou a
  // barra para indicar o campo, não para dizer que é os dois.
  if (texto.includes('matriz')) return 'MATRIZ'
  if (texto.includes('filial')) return 'FILIAL'

  return 'SEM_INFORMACAO'
}

/**
 * Condição Prisma que seleciona uma lotação.
 *
 * `SEM_INFORMACAO` é o complemento dos outros dois, não `null`: um campo
 * preenchido com "—" ou com o nome da cidade também não diz a lotação, e
 * precisa aparecer no mesmo filtro para o RH conseguir achar e corrigir.
 */
export function whereLotacao(lotacao: Lotacao) {
  const contemMatriz = { matrizOuFilial: { contains: 'matriz', mode: 'insensitive' as const } }
  const contemFilial = { matrizOuFilial: { contains: 'filial', mode: 'insensitive' as const } }

  if (lotacao === 'MATRIZ') return contemMatriz
  if (lotacao === 'FILIAL') return { AND: [contemFilial, { NOT: contemMatriz }] }

  return { NOT: { OR: [contemMatriz, contemFilial] } }
}
