import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BOM_UTF8,
  SEPARADOR_CSV,
  celulaCsv,
  formatarDataBR,
  formatarNumeroBR,
  gerarCsv,
  nomeArquivo,
} from '../src/lib/gente/exportacao'

/**
 * Estes testes existem por causa de um bug real: a primeira exportação de
 * candidatos abriu no Excel com tudo numa coluna só e acentos quebrados.
 */

test('o CSV comeca com o BOM de UTF-8', () => {
  const csv = gerarCsv({ titulo: 'X', cabecalhos: ['Situação'], linhas: [['Sumé']] })

  assert.ok(csv.startsWith(BOM_UTF8), 'sem o BOM o Excel lê como Windows-1252 e quebra o acento')
})

test('o separador e ponto e virgula, nao virgula', () => {
  const csv = gerarCsv({
    titulo: 'X',
    cabecalhos: ['Nome', 'Unidade'],
    linhas: [['Ana', 'Patos']],
  })

  assert.equal(SEPARADOR_CSV, ';')
  assert.ok(csv.includes('Nome;Unidade'), 'com vírgula o Excel em pt-BR abre em coluna única')
  assert.ok(csv.includes('Ana;Patos'))
})

test('acento sai intacto, sem mojibake', () => {
  const csv = gerarCsv({
    titulo: 'X',
    cabecalhos: ['Mês', 'Situação', 'Etapas aplicáveis'],
    linhas: [['Fevereiro', 'Em andamento', 'Ajudante de Armazém']],
  })

  assert.ok(csv.includes('Mês'))
  assert.ok(csv.includes('Situação'))
  assert.ok(csv.includes('Armazém'))
  assert.equal(csv.includes('Ã'), false, 'não pode aparecer mojibake')
})

test('usa quebra de linha CRLF', () => {
  const csv = gerarCsv({ titulo: 'X', cabecalhos: ['A'], linhas: [['1'], ['2']] })

  assert.equal(csv.split('\r\n').length, 3)
})

// ─── Escape de células ────────────────────────────────────────────────────────

test('campo com ponto e virgula e protegido por aspas', () => {
  assert.equal(celulaCsv('Supervisor; Coordenador'), '"Supervisor; Coordenador"')
})

test('aspas dentro do texto sao duplicadas', () => {
  assert.equal(celulaCsv('Cargo "especial"'), '"Cargo ""especial"""')
})

test('quebra de linha no texto nao rompe a linha do CSV', () => {
  const csv = gerarCsv({
    titulo: 'X',
    cabecalhos: ['Obs'],
    linhas: [['linha 1\nlinha 2']],
  })

  // Cabeçalho + uma linha de dados: a quebra interna fica dentro das aspas.
  assert.equal(csv.split('\r\n').length, 2)
  assert.ok(csv.includes('"linha 1\nlinha 2"'))
})

test('vazio e nulo viram celula vazia, nao a palavra null', () => {
  assert.equal(celulaCsv(null), '')
  assert.equal(celulaCsv(undefined), '')
  assert.equal(celulaCsv(''), '')
})

test('texto simples nao ganha aspas desnecessarias', () => {
  assert.equal(celulaCsv('Motorista'), 'Motorista')
  assert.equal(celulaCsv(42), '42')
})

// ─── Formatos brasileiros ─────────────────────────────────────────────────────

test('data sai em dd/mm/aaaa', () => {
  assert.equal(formatarDataBR(new Date(Date.UTC(2026, 1, 12))), '12/02/2026')
  assert.equal(formatarDataBR('2026-06-14T00:00:00.000Z'), '14/06/2026')
})

test('data ausente ou invalida vira celula vazia', () => {
  assert.equal(formatarDataBR(null), '')
  assert.equal(formatarDataBR(undefined), '')
  assert.equal(formatarDataBR(new Date('nao-e-data')), '')
})

test('data na celula do CSV sai formatada, nao em ISO', () => {
  assert.equal(celulaCsv(new Date(Date.UTC(2026, 1, 12))), '12/02/2026')
})

test('numero sai com virgula decimal', () => {
  assert.equal(formatarNumeroBR(2500), '2500,00')
  assert.equal(formatarNumeroBR(1500.5), '1500,50')
  assert.equal(formatarNumeroBR(33.3, 1), '33,3')
  assert.equal(formatarNumeroBR(null), '')
})

// ─── Nome do arquivo ──────────────────────────────────────────────────────────

test('nome do arquivo leva a data e a extensao certa', () => {
  const hoje = new Date().toISOString().slice(0, 10)

  assert.equal(nomeArquivo('candidatos', 'xlsx'), `candidatos-${hoje}.xlsx`)
  assert.equal(nomeArquivo('vagas', 'csv'), `vagas-${hoje}.csv`)
})
