import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PRAZO_PADRAO_DIAS,
  calcularSlaVaga,
  type VagaSlaInput,
} from '../src/lib/gente/vaga-sla'

const d = (iso: string) => new Date(iso)

function vaga(overrides: Partial<VagaSlaInput> = {}): VagaSlaInput {
  return {
    status: 'ABERTA',
    dataAbertura: d('2026-02-04'),
    dataPrevistaFechamento: d('2026-03-21'),
    ...overrides,
  }
}

// Os dois primeiros casos vêm de linhas reais do `data.ts` do app do RH:
// servem de âncora para garantir que não mudamos o histórico deles.

test('reproduz o calculo do app do RH para vaga fechada no prazo', () => {
  const sla = calcularSlaVaga(
    vaga({ status: 'FECHADA', dataContratacao: d('2026-02-12') }),
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 8)
  assert.equal(sla.statusFechamento, 'FECHADA_NO_PRAZO')
  assert.equal(sla.atrasada, false)
  assert.equal(sla.diasDeAtraso, 0)
})

test('reproduz o calculo do app do RH para a segunda vaga de referencia', () => {
  const sla = calcularSlaVaga(
    {
      status: 'FECHADA',
      dataAbertura: d('2026-02-12'),
      dataPrevistaFechamento: d('2026-03-29'),
      dataContratacao: d('2026-02-26'),
    },
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 14)
  assert.equal(sla.statusFechamento, 'FECHADA_NO_PRAZO')
})

test('classifica vaga fechada depois do prazo como fora do prazo', () => {
  const sla = calcularSlaVaga(
    vaga({ status: 'FECHADA', dataContratacao: d('2026-04-01') }),
    d('2026-09-21')
  )

  assert.equal(sla.statusFechamento, 'FECHADA_FORA_PRAZO')
  assert.equal(sla.atrasada, true)
  assert.equal(sla.diasDeAtraso, 11)
})

test('conta os dias de uma vaga aberta ate hoje, nao ate a ultima edicao', () => {
  const sla = calcularSlaVaga(vaga(), d('2026-02-20'))

  assert.equal(sla.diasEmAberto, 16)
  assert.equal(sla.statusFechamento, 'ABERTA_NO_PRAZO')
})

test('marca vaga aberta que passou do prazo previsto como vencida', () => {
  const sla = calcularSlaVaga(vaga(), d('2026-03-31'))

  assert.equal(sla.statusFechamento, 'ABERTA_VENCIDA')
  assert.equal(sla.atrasada, true)
  assert.equal(sla.diasDeAtraso, 10)
})

test('vaga no ultimo dia do prazo ainda esta no prazo', () => {
  const sla = calcularSlaVaga(vaga(), d('2026-03-21'))

  assert.equal(sla.statusFechamento, 'ABERTA_NO_PRAZO')
  assert.equal(sla.diasDeAtraso, 0)
})

test('sem data prevista, cai no prazo padrao de 30 dias', () => {
  const dentro = calcularSlaVaga(
    vaga({ dataPrevistaFechamento: null }),
    d('2026-03-05') // 29 dias
  )
  const fora = calcularSlaVaga(
    vaga({ dataPrevistaFechamento: null }),
    d('2026-03-07') // 31 dias
  )

  assert.equal(PRAZO_PADRAO_DIAS, 30)
  assert.equal(dentro.statusFechamento, 'ABERTA_NO_PRAZO')
  assert.equal(fora.statusFechamento, 'ABERTA_VENCIDA')
  assert.equal(fora.diasDeAtraso, 1)
})

test('override manual do RH vence o calculo automatico', () => {
  const sla = calcularSlaVaga(
    vaga({ statusFechamentoManual: 'FECHADA_NO_PRAZO' }),
    d('2026-06-01') // atrasadissima
  )

  assert.equal(sla.statusFechamento, 'FECHADA_NO_PRAZO')
  assert.equal(sla.manual, true)
  // O override muda o rotulo, mas nao esconde o atraso real do indicador.
  assert.equal(sla.atrasada, true)
})

test('vaga cancelada congela os dias e nao recebe classificacao de prazo', () => {
  const sla = calcularSlaVaga(
    vaga({ status: 'CANCELADA', encerradaEm: d('2026-02-20') }),
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 16)
  assert.equal(sla.statusFechamento, null)
  assert.equal(sla.atrasada, false)
})

test('vaga fechada sem data de contratacao mantem o fallback do app antigo', () => {
  const sla = calcularSlaVaga(
    vaga({ status: 'FECHADA', dataContratacao: null }),
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 0)
  assert.equal(sla.statusFechamento, 'FECHADA_NO_PRAZO')
})

test('vaga sem data de abertura nao quebra o calculo', () => {
  const sla = calcularSlaVaga(
    vaga({ dataAbertura: null, dataPrevistaFechamento: null }),
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 0)
  assert.equal(sla.statusFechamento, 'ABERTA_NO_PRAZO')
})

test('compara por dia de calendario, nao por horario', () => {
  const sla = calcularSlaVaga(
    {
      status: 'FECHADA',
      dataAbertura: d('2026-02-04T23:50:00Z'),
      dataPrevistaFechamento: d('2026-03-21'),
      dataContratacao: d('2026-02-05T00:10:00Z'),
    },
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 1)
})

test('data invalida e tratada como ausente', () => {
  const sla = calcularSlaVaga(
    vaga({ dataAbertura: new Date('nao-e-data'), dataPrevistaFechamento: null }),
    d('2026-09-21')
  )

  assert.equal(sla.diasEmAberto, 0)
  assert.equal(sla.statusFechamento, 'ABERTA_NO_PRAZO')
})
