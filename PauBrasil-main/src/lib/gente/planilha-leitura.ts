/**
 * Descobre onde está a tabela dentro de uma planilha.
 *
 * O importador nasceu assumindo o caso simples: uma aba, cabeçalho na primeira
 * linha. A planilha real do ciclo de gente do RH não é assim — tem 6 abas
 * (a primeira é uma capa com texto explicativo), a tabela começa na linha 6,
 * e as três primeiras colunas estão vazias.
 *
 * Em vez de exigir que o RH reformate o arquivo, o importador procura a tabela:
 * varre todas as abas e todas as linhas do topo, e escolhe a combinação que
 * mais reconhece cabeçalhos conhecidos daquele tipo de importação.
 */

import { normalizar, type LinhaPlanilha } from './vaga-importador'
import { COLUNAS_VAGA } from './vaga-importador'
import { COLUNAS_CANDIDATO, COLUNAS_ETAPA } from './candidato-importador'
import { COLUNAS_QUADRO } from './quadro-importador'
import { COLUNAS_PCD } from './pcd-importador'
import { COLUNAS_SUCESSAO } from './sucessao'
import { COLUNAS_CARGO } from './cargo-importador'
import type { TipoModelo } from './modelos'

/** Uma aba lida como matriz de células. */
export interface AbaPlanilha {
  nome: string
  matriz: unknown[][]
}

export interface TabelaLocalizada {
  aba: string
  /** Índice da linha de cabeçalho dentro da matriz (base 0). */
  indiceCabecalho: number
  /** Quantos cabeçalhos conhecidos foram reconhecidos. */
  reconhecidos: number
  cabecalhos: string[]
}

/** Quantas linhas do topo de cada aba são consideradas candidatas a cabeçalho. */
const LINHAS_A_VASCULHAR = 25

/** Abaixo disso não dá para afirmar que é a tabela certa. */
const MINIMO_RECONHECIDOS = 2

function achatar(mapa: Record<string, string[]>): string[] {
  return Object.values(mapa).flat()
}

/** Todos os cabeçalhos que cada tipo de importação sabe ler. */
export const SINONIMOS: Record<TipoModelo, string[]> = {
  vagas: achatar(COLUNAS_VAGA),
  candidatos: [...achatar(COLUNAS_CANDIDATO), ...achatar(COLUNAS_ETAPA)],
  quadro: achatar(COLUNAS_QUADRO),
  desligamentos: achatar(COLUNAS_QUADRO),
  pcd: achatar(COLUNAS_PCD),
  aprendizes: achatar(COLUNAS_PCD),
  internos: achatar(COLUNAS_SUCESSAO),
  sucessao: achatar(COLUNAS_SUCESSAO),
  cargos: achatar(COLUNAS_CARGO),
}

function contarReconhecidos(linha: unknown[], sinonimos: Set<string>): number {
  const vistos = new Set<string>()

  for (const celula of linha) {
    if (celula === null || celula === undefined) continue
    const chave = normalizar(celula)
    if (chave !== '' && sinonimos.has(chave)) vistos.add(chave)
  }

  return vistos.size
}

/**
 * Escolhe a aba e a linha de cabeçalho com mais colunas reconhecidas.
 *
 * Empate é resolvido pela primeira ocorrência, que na prática é a aba mais à
 * esquerda e a linha mais acima — a ordem em que a pessoa leria o arquivo.
 */
export function localizarTabela(
  abas: AbaPlanilha[],
  tipo: TipoModelo
): TabelaLocalizada | null {
  const sinonimos = new Set(SINONIMOS[tipo])
  let melhor: TabelaLocalizada | null = null

  for (const aba of abas) {
    const limite = Math.min(aba.matriz.length, LINHAS_A_VASCULHAR)

    for (let i = 0; i < limite; i++) {
      const linha = aba.matriz[i] ?? []
      const reconhecidos = contarReconhecidos(linha, sinonimos)

      if (reconhecidos > (melhor?.reconhecidos ?? 0)) {
        melhor = {
          aba: aba.nome,
          indiceCabecalho: i,
          reconhecidos,
          cabecalhos: linha.map((c) => (c === null || c === undefined ? '' : String(c).trim())),
        }
      }
    }
  }

  if (!melhor || melhor.reconhecidos < MINIMO_RECONHECIDOS) return null
  return melhor
}

/**
 * Converte as linhas de dados em objetos `{ cabeçalho: valor }`.
 *
 * O número da linha é o da **planilha**, não o do array: o relatório de erros
 * precisa apontar para o que a pessoa vê no Excel. Colunas sem cabeçalho são
 * ignoradas, e linhas inteiramente vazias são descartadas — planilha de RH
 * costuma ter linhas em branco separando blocos.
 */
export function montarLinhas(
  matriz: unknown[][],
  indiceCabecalho: number,
  /** Linha da planilha em que a matriz começa (1 quando a leitura foi do topo). */
  primeiraLinhaDaMatriz = 1
): LinhaPlanilha[] {
  const cabecalhos = (matriz[indiceCabecalho] ?? []).map((c) =>
    c === null || c === undefined ? '' : String(c).trim()
  )

  const linhas: LinhaPlanilha[] = []

  for (let i = indiceCabecalho + 1; i < matriz.length; i++) {
    const celulas = matriz[i] ?? []

    const temConteudo = celulas.some(
      (c) => c !== null && c !== undefined && String(c).trim() !== ''
    )
    if (!temConteudo) continue

    const dados: Record<string, unknown> = {}
    cabecalhos.forEach((cabecalho, coluna) => {
      if (cabecalho === '') return
      dados[cabecalho] = celulas[coluna] ?? null
    })

    linhas.push({ linha: primeiraLinhaDaMatriz + i, dados })
  }

  return linhas
}

/**
 * Prepara as linhas para viajarem até o servidor.
 *
 * O XLSX devolve datas como `Date` com **meia-noite local**. Ao serializar em
 * JSON isso vira um ISO com o deslocamento do fuso, e a parte da data pode
 * mudar: meia-noite de 5 de setembro em UTC+2 é `2024-09-04T22:00:00Z`.
 * O servidor leria 4 de setembro.
 *
 * Convertendo aqui para `aaaa-mm-dd` a partir dos componentes locais, a data
 * que a pessoa vê na planilha é exatamente a que chega no banco, em qualquer
 * fuso — e sem depender de o servidor e o navegador estarem no mesmo.
 */
export function prepararParaEnvio(linhas: LinhaPlanilha[]): LinhaPlanilha[] {
  return linhas.map(({ linha, dados }) => {
    const convertidos: Record<string, unknown> = {}

    for (const [chave, valor] of Object.entries(dados)) {
      convertidos[chave] = valor instanceof Date ? dataLocalParaIso(valor) : valor
    }

    return { linha, dados: convertidos }
  })
}

function dataLocalParaIso(data: Date): string | null {
  if (Number.isNaN(data.getTime())) return null

  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}
