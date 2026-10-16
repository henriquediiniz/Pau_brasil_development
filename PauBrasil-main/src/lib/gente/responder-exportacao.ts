import { NextResponse } from 'next/server'
import {
  cabecalhosCsv,
  disposicaoAnexo,
  gerarCsv,
  nomeArquivo,
  type Planilha,
} from './exportacao'
import { MIME_XLSX, corpoXlsx, gerarXlsx } from './exportacao-xlsx'

export type FormatoExportacao = 'xlsx' | 'csv'

export function ehFormatoExportacao(valor: unknown): valor is FormatoExportacao {
  return valor === 'xlsx' || valor === 'csv'
}

/**
 * Resposta de exportação nos dois formatos.
 *
 * O padrão é `.xlsx` porque é o que o RH abre. O CSV continua disponível
 * (`?export=csv`) para alimentar outras ferramentas, agora com BOM e ponto e
 * vírgula — do jeito que o Excel em português consegue ler.
 */
export function responderExportacao(
  planilha: Planilha,
  base: string,
  formato: FormatoExportacao = 'xlsx'
): NextResponse {
  if (formato === 'csv') {
    const nome = nomeArquivo(base, 'csv')
    return new NextResponse(gerarCsv(planilha), {
      headers: { ...cabecalhosCsv(), 'Content-Disposition': disposicaoAnexo(nome) },
    })
  }

  const nome = nomeArquivo(base, 'xlsx')
  return new NextResponse(corpoXlsx(gerarXlsx(planilha)), {
    headers: {
      'Content-Type': MIME_XLSX,
      'Content-Disposition': disposicaoAnexo(nome),
      'Cache-Control': 'no-store',
    },
  })
}
