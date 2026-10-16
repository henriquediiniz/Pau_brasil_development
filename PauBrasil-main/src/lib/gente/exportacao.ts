/**
 * Exportação de planilhas do módulo Gente.
 *
 * Nasceu de um bug real: a primeira exportação de candidatos abriu no Excel
 * com tudo numa coluna só e os acentos quebrados ("SituaÃ§Ã£o"). Duas causas:
 *
 * 1. O Excel em português usa **ponto e vírgula** como separador de lista, não
 *    vírgula. Um CSV separado por vírgula abre em coluna única.
 * 2. Sem o BOM de UTF-8, o Excel lê o arquivo como Windows-1252 e todo
 *    caractere acentuado vira mojibake.
 *
 * O `.xlsx` não tem nenhuma dessas ambiguidades — separador e codificação não
 * existem como conceito nele — e ainda permite entregar data como data e
 * número como número, em vez de texto que o Excel tenta adivinhar. Por isso a
 * exportação padrão passou a ser `.xlsx`, e o CSV ficou como alternativa
 * corrigida para quem precisa alimentar outra ferramenta.
 */

export type ValorCelula = string | number | Date | null | undefined

export interface Planilha {
  titulo: string
  cabecalhos: string[]
  linhas: ValorCelula[][]
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

/** O Excel em pt-BR usa `;`. Com `,` o arquivo abre em coluna única. */
export const SEPARADOR_CSV = ';'

/**
 * Sem este prefixo o Excel assume Windows-1252 e quebra todo acento.
 * São os bytes EF BB BF, o BOM de UTF-8.
 */
export const BOM_UTF8 = '﻿'

/** Data no formato que o Excel em português entende sem conversão. */
export function formatarDataBR(valor: Date | string | null | undefined): string {
  if (!valor) return ''

  const data = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(data.getTime())) return ''

  const dia = String(data.getUTCDate()).padStart(2, '0')
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${data.getUTCFullYear()}`
}

/** Número com vírgula decimal, que é o que o Excel em pt-BR espera. */
export function formatarNumeroBR(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return ''
  return valor.toFixed(casas).replace('.', ',')
}

/**
 * Prepara uma célula para o CSV.
 *
 * Envolve em aspas sempre que o conteúdo tiver separador, aspas ou quebra de
 * linha — e também quando parecer número ou data, para o Excel não reinterpretar
 * o valor (um código como "001" viraria 1).
 */
export function celulaCsv(valor: ValorCelula): string {
  if (valor === null || valor === undefined) return ''

  const texto = valor instanceof Date ? formatarDataBR(valor) : String(valor)
  if (texto === '') return ''

  const precisaAspas =
    texto.includes(SEPARADOR_CSV) ||
    texto.includes('"') ||
    texto.includes('\n') ||
    texto.includes('\r')

  if (!precisaAspas) return texto
  return `"${texto.replace(/"/g, '""')}"`
}

/** CSV pronto para abrir no Excel em português: BOM, `;` e quebras CRLF. */
export function gerarCsv(planilha: Planilha): string {
  const linhas = [
    planilha.cabecalhos.map(celulaCsv).join(SEPARADOR_CSV),
    ...planilha.linhas.map((linha) => linha.map(celulaCsv).join(SEPARADOR_CSV)),
  ]

  return BOM_UTF8 + linhas.join('\r\n')
}

export function cabecalhosCsv(): Record<string, string> {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Cache-Control': 'no-store',
  }
}

// ─── Nome do arquivo ──────────────────────────────────────────────────────────

export function nomeArquivo(base: string, extensao: 'xlsx' | 'csv'): string {
  const hoje = new Date().toISOString().slice(0, 10)
  return `${base}-${hoje}.${extensao}`
}

export function disposicaoAnexo(nome: string): string {
  return `attachment; filename="${nome}"`
}
