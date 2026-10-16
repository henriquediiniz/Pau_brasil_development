import { normalizar } from './vaga-importador'

/**
 * Casar arquivos de laudo com as pessoas do cadastro, pelo nome do arquivo.
 *
 * O RH recebe os laudos como o médico ou a própria pessoa manda, e o nome do
 * arquivo é o que sobra de identificação: "HELIO NASCIMENTO LAUDO.pdf",
 * "JOSILDO VIEIRA DE SOUSA_DOC_PCD.pdf", "LAUDO CHARLLEN PLELLIS.pdf". Anexar
 * um a um, abrindo o cadastro de cada pessoa, é o que fazia o trabalho não
 * andar.
 *
 * Aqui o palpite é feito, mas **nunca aplicado sozinho**: a função devolve o
 * que achou e com que confiança, e quem decide é o RH na tela. Anexar laudo na
 * pessoa errada é vazar dado de saúde de alguém para o prontuário de outro —
 * um erro que não se desfaz avisando.
 */

/** Palavras que aparecem no nome do arquivo e não fazem parte do nome. */
const RUIDO = new Set(['laudo', 'laudos', 'doc', 'docs', 'documento', 'pcd', 'cid', 'medico'])

/** Preposições, que o RH escreve ou omite sem critério. */
const LIGACOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

export interface PessoaComLaudo {
  id: string
  nome: string
}

export type Confianca = 'exata' | 'provavel' | 'ambigua' | 'nenhuma'

export interface Correspondencia {
  arquivo: string
  /** Nome extraído do arquivo, já sem o ruído. Vazio se não sobrou nada. */
  nomeNoArquivo: string
  confianca: Confianca
  /** Quem o arquivo parece ser. Mais de um quando é ambígua. */
  candidatos: PessoaComLaudo[]
}

/** Os pedaços do nome que importam: sem ruído, sem preposição, sem extensão. */
export function nomeDoArquivo(arquivo: string): string[] {
  const semExtensao = arquivo.replace(/\.[a-z0-9]{1,5}$/i, '')

  return normalizar(semExtensao)
    .split(' ')
    .filter((t) => t && !RUIDO.has(t) && !LIGACOES.has(t) && !/^\d+$/.test(t))
}

function tokensDoNome(nome: string): string[] {
  return normalizar(nome)
    .split(' ')
    .filter((t) => t && !LIGACOES.has(t))
}

/**
 * Com quem este arquivo se parece.
 *
 * Exige **pelo menos dois** pedaços em comum quando não é o nome inteiro: um
 * primeiro nome sozinho — "PAULO" — casaria com meia lista, e um palpite que
 * acerta por sorte é pior que nenhum, porque convida a aceitar sem olhar.
 */
export function casarArquivo(arquivo: string, pessoas: PessoaComLaudo[]): Correspondencia {
  const doArquivo = nomeDoArquivo(arquivo)
  const nomeNoArquivo = doArquivo.join(' ')

  if (doArquivo.length === 0) {
    return { arquivo, nomeNoArquivo, confianca: 'nenhuma', candidatos: [] }
  }

  const exatos = pessoas.filter((p) => tokensDoNome(p.nome).join(' ') === nomeNoArquivo)
  if (exatos.length === 1) {
    return { arquivo, nomeNoArquivo, confianca: 'exata', candidatos: exatos }
  }
  // Dois cadastros com o mesmo nome: o sistema não tem como escolher.
  if (exatos.length > 1) {
    return { arquivo, nomeNoArquivo, confianca: 'ambigua', candidatos: exatos }
  }

  if (doArquivo.length < 2) {
    return { arquivo, nomeNoArquivo, confianca: 'nenhuma', candidatos: [] }
  }

  // O arquivo costuma trazer o nome parcial de quem tem nome longo.
  const contidos = pessoas.filter((p) => {
    const doCadastro = new Set(tokensDoNome(p.nome))
    return doArquivo.every((t) => doCadastro.has(t))
  })

  if (contidos.length === 1) {
    return { arquivo, nomeNoArquivo, confianca: 'provavel', candidatos: contidos }
  }
  if (contidos.length > 1) {
    return { arquivo, nomeNoArquivo, confianca: 'ambigua', candidatos: contidos }
  }

  return { arquivo, nomeNoArquivo, confianca: 'nenhuma', candidatos: [] }
}

/**
 * Casa a leva inteira, garantindo que **uma pessoa não receba dois arquivos**.
 *
 * Quando dois arquivos apontam para a mesma pessoa, nenhum dos dois é aplicado
 * sozinho: o segundo sobrescreveria o primeiro em silêncio, e o RH só
 * descobriria abrindo o laudo de alguém e achando o de outro.
 */
export function casarArquivos(
  arquivos: string[],
  pessoas: PessoaComLaudo[]
): Correspondencia[] {
  const resultado = arquivos.map((a) => casarArquivo(a, pessoas))

  const quantosPorPessoa = new Map<string, number>()
  for (const r of resultado) {
    if (r.confianca === 'exata' || r.confianca === 'provavel') {
      const id = r.candidatos[0].id
      quantosPorPessoa.set(id, (quantosPorPessoa.get(id) ?? 0) + 1)
    }
  }

  return resultado.map((r) =>
    (r.confianca === 'exata' || r.confianca === 'provavel') &&
    (quantosPorPessoa.get(r.candidatos[0].id) ?? 0) > 1
      ? { ...r, confianca: 'ambigua' as const }
      : r
  )
}
