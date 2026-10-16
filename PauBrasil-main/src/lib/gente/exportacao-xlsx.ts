import * as XLSX from 'xlsx'
import type { Planilha, ValorCelula } from './exportacao'

/**
 * Gera o `.xlsx` da exportação.
 *
 * Separado de `exportacao.ts` porque importa a biblioteca `xlsx`, que só roda
 * no servidor — enquanto as funções puras de lá também são usadas em teste.
 *
 * A vantagem sobre CSV não é só o acento: aqui data vai como data e número vai
 * como número, então o Excel não precisa adivinhar. Um código "001" continua
 * "001", e uma data não vira texto nem muda de formato conforme a região.
 */
export function gerarXlsx(planilha: Planilha): Buffer {
  const wb = XLSX.utils.book_new()

  const matriz: ValorCelula[][] = [planilha.cabecalhos, ...planilha.linhas]
  const aba = XLSX.utils.aoa_to_sheet(matriz, { cellDates: true })

  // Largura das colunas pelo maior conteúdo, com teto para não estourar a tela.
  aba['!cols'] = planilha.cabecalhos.map((cabecalho, i) => {
    const maiorValor = planilha.linhas.reduce((maior, linha) => {
      const celula = linha[i]
      const texto =
        celula instanceof Date
          ? 10
          : celula === null || celula === undefined
          ? 0
          : String(celula).length
      return Math.max(maior, texto)
    }, 0)

    return { wch: Math.min(45, Math.max(cabecalho.length, maiorValor) + 2) }
  })

  // Congela o cabeçalho: planilha de RH costuma ter centenas de linhas.
  aba['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(wb, aba, planilha.titulo.slice(0, 31))

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellDates: true })
}

export const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** O corpo da resposta não aceita Buffer direto no tipo do Next; Blob aceita. */
export function corpoXlsx(buffer: Buffer): Blob {
  return new Blob([new Uint8Array(buffer)], { type: MIME_XLSX })
}
