import assert from 'node:assert/strict'
import test from 'node:test'

import { agruparCargos, grafiasDasChaves } from '../src/lib/gente/cargo-agrupado'

// As quatro grafias reais de 2026-10-07.
const AJUDANTE = [
  { cargo: 'AJUDANTE DISTRIBUIÇÃO', total: 28 },
  { cargo: 'AJUDANTE DE DISTRIBUIÇÃO', total: 3 },
  { cargo: 'Ajudante de Distribuição', total: 2 },
  { cargo: 'Ajudante da Distribuição', total: 2 },
]

test('as grafias do mesmo cargo viram uma opcao so, com o total somado', () => {
  const r = agruparCargos(AJUDANTE)
  assert.equal(r.length, 1)
  assert.equal(r[0].total, 35)
})

test('o nome exibido e o do descritivo, quando existe', () => {
  const r = agruparCargos(AJUDANTE, ['Ajudante de Distribuição'])
  assert.equal(r[0].cargo, 'Ajudante de Distribuição')
})

test('sem descritivo, a grafia mais usada', () => {
  assert.equal(agruparCargos(AJUDANTE)[0].cargo, 'AJUDANTE DISTRIBUIÇÃO')
})

test('cargo vazio nao vira opcao', () => {
  assert.deepEqual(agruparCargos([{ cargo: null, total: 5 }, { cargo: '', total: 1 }]), [])
})

test('opcoes em ordem alfabetica', () => {
  const r = agruparCargos([{ cargo: 'Promotor', total: 1 }, { cargo: 'Conferente', total: 9 }])
  assert.deepEqual(r.map((c) => c.cargo), ['Conferente', 'Promotor'])
})

test('a chave escolhida volta a ser todas as grafias reais', () => {
  const [{ chave }] = agruparCargos(AJUDANTE)
  const todas = [...AJUDANTE.map((a) => a.cargo), 'Motorista', null]
  assert.deepEqual(grafiasDasChaves(todas, [chave]).sort(), AJUDANTE.map((a) => a.cargo).sort())
})
