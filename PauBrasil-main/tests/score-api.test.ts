import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseBRL,
  parseDate,
  csvLines,
  processBaseClientes,
  processVolumeVendas,
  processBoletos,
  percentil,
  calcScore,
} from '../src/lib/score-upload'

test('parseBRL parses Brazilian currency strings correctly', () => {
  assert.equal(parseBRL('1.234,56'), 1234.56)
  assert.equal(parseBRL('-1.234,56'), -1234.56)
  assert.equal(parseBRL(''), 0)
  assert.equal(parseBRL('invalid'), 0)
})

test('parseDate parses DD/MM/YYYY strings and returns null for invalid values', () => {
  assert.equal(parseDate('15/04/2026')?.toISOString().startsWith('2026-04-15T'), true)
  assert.equal(parseDate('01/01/2000')?.toISOString().startsWith('2000-01-01T'), true)
  assert.equal(parseDate(''), null)
  assert.equal(parseDate('32/01/2026'), null)
})

test('csvLines normalizes line endings correctly', () => {
  const raw = 'a;b;c\r\n1;2;3\n4;5;6\r\n'
  assert.deepEqual(csvLines(raw), ['a;b;c', '1;2;3', '4;5;6', ''])
})

test('processBaseClientes extracts only active rows and normalizes numeric fields', () => {
  const csv = [
    'filial;codPDV;nomeFantasia;cidade;limiteCredito;limiteCreditoUsado;prazoAtual;dataCadastro;dataUltimaCompra;tipoPessoa;statusPDV;setorVDE;diaVisita',
    '1;101;Loja A;São Paulo;1.000,00;500,00;30;01/01/2020;15/03/2026;PJ;Ativo;Varejo;Segunda',
    '2;202;Loja B;Campinas;2.000,00;1.000,00;45;10/02/2019;01/04/2026;PJ;Inativo;Atacado;Terça',
  ].join('\n')

  const result = processBaseClientes(csv)
  assert.equal(result.data.size, 1)
  const item = Array.from(result.data.values())[0]
  assert.equal(item.filial, 1)
  assert.equal(item.codPDV, 101)
  assert.equal(item.limiteCredito, 1000)
  assert.equal(item.limiteCreditoUsado, 500)
  assert.equal(item.statusPDV, 'Ativo')
  assert.equal(item.cidade, 'São Paulo')
})

test('processVolumeVendas calculates volume and frequency correctly', () => {
  const row = Array.from({ length: 26 }, (_, index) => {
    if (index === 1) return '1'
    if (index === 6) return '06/04/2026'
    if (index === 7) return 'NFE001'
    if (index === 9) return 'A'
    if (index === 12) return '2'
    if (index === 25) return '100,00'
    return 'x'
  })

  const result = processVolumeVendas(row.join(';'), 2026, 4)
  assert.equal(result.data.size, 1)
  const entry = Array.from(result.data.values())[0]
  assert.equal(entry.volumeMes, 100)
  assert.equal(entry.frequenciaMes, 1)
  assert.equal(entry.dataUltimaCompra?.getUTCFullYear(), 2026)
})

test('processBoletos aggregates overdue amounts correctly', () => {
  const csv = [
    '1;1;col2;col3;col4;col5;col6;col7;col8;col9;col10;col11;col12;col13;-15;col15;col16;col17;col18;100,00',
  ].join('\n')

  const result = processBoletos(csv)
  assert.equal(result.data.size, 1)
  const entry = Array.from(result.data.values())[0]
  assert.equal(entry.totalPendente, 100)
  assert.equal(entry.maiorAtraso, -15)
})

test('percentil returns the correct percentile ranking', () => {
  const values = [10, 20, 30, 40, 50]
  assert.equal(percentil(30, values), 40)
  assert.equal(percentil(5, values), 0)
  assert.equal(percentil(50, values), 80)
})

test('calcScore returns a capped score of 5.0 for strong inputs', () => {
  const score = calcScore({
    chave: '1_1',
    filial: 1,
    volume: { volumeMes: 100, frequenciaMes: 13, dataUltimaCompra: new Date('2026-04-01') },
    boleto: { totalPendente: 0, maiorAtraso: 0 },
    base: {
      filial: 1,
      codPDV: 1,
      chave: '1_1',
      nomeFantasia: 'Loja A',
      cidade: 'SP',
      limiteCredito: 1000,
      limiteCreditoUsado: 100,
      prazoAtual: 30,
      dataCadastro: new Date('2020-01-01'),
      dataUltimaCompra: new Date('2026-04-01'),
      tipoPessoa: 'PJ',
      statusPDV: 'Ativo',
      setorVDE: 'Varejo',
      diaVisita: 'Segunda',
    },
    refAno: 2026,
    refMes: 4,
    historico: [
      { scoreVolume: 0.5, scorePontualidade: 1, scoreRecencia: 1, scoreFrequencia: 1, scoreTendencia: 1, scoreCredito: 1, volumeMes: 80 },
      { scoreVolume: 0.5, scorePontualidade: 1, scoreRecencia: 1, scoreFrequencia: 1, scoreTendencia: 1, scoreCredito: 1, volumeMes: 90 },
    ],
    volumesPorFilial: [20, 40, 60, 80, 100],
    freqsPorFilial: [8, 9, 10],
  } as any)

  assert.equal(score.score, 5)
  assert.equal(score.scoreVolume, 1)
  assert.equal(score.scorePontualidade, 1)
  assert.equal(score.scoreRecencia, 1)
  assert.equal(score.scoreFrequencia, 1)
  assert.equal(score.scoreTendencia, 1)
  assert.equal(score.scoreCredito, 1)
})
