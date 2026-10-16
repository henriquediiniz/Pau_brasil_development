import assert from 'node:assert/strict'
import test from 'node:test'

import { ehFrontline, indexarFrontline } from '../src/lib/gente/frontline-cargo'

const DESCRITIVOS = [
  { id: 'aj', cargo: 'Ajudante de Armazém', frontline: true },
  { id: 'mot', cargo: 'Motorista da Distribuição', frontline: true },
  { id: 'fin', cargo: 'Analista Financeiro', frontline: false },
]

const indice = indexarFrontline(DESCRITIVOS)

test('cargo marcado no descritivo marca o candidato', () => {
  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém' }, indice), true)
})

test('cargo nao marcado nao marca o candidato', () => {
  assert.equal(ehFrontline({ cargo: 'Analista Financeiro' }, indice), false)
})

test('cargo que nao existe no cadastro nao marca', () => {
  assert.equal(ehFrontline({ cargo: 'Cargo Inventado' }, indice), false)
  assert.equal(ehFrontline({ cargo: null }, indice), false)
})

test('casa ignorando acento, caixa, turno e preposicao', () => {
  /*
    O candidato guarda o cargo como texto, vindo da candidatura do site ou
    digitado. "AJUDANTE DE ARMAZEM - DIURNO" é o mesmo cargo.
  */
  assert.equal(ehFrontline({ cargo: 'AJUDANTE DE ARMAZEM' }, indice), true)
  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém - Diurno' }, indice), true)
  assert.equal(ehFrontline({ cargo: 'Ajudante do Armazém' }, indice), true)
})

test('o vinculo pela vaga ganha do nome', () => {
  // A vaga aberta a partir do descritivo guarda `cargoId`: é um id, não erra.
  assert.equal(ehFrontline({ cargo: 'Nome Qualquer', vagaCargoId: 'aj' }, indice), true)
})

test('vinculo pela vaga para cargo NAO frontline nao marca, mesmo com nome que marcaria', () => {
  /*
    A regra que importa: quando existe vínculo, ele decide sozinho. Cair no
    nome depois de o id dizer "não" faria o id valer menos que a digitação.
  */
  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém', vagaCargoId: 'fin' }, indice), false)
})

test('vaga sem cargo vinculado cai no nome', () => {
  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém', vagaCargoId: null }, indice), true)
})

test('o indice so guarda os marcados', () => {
  assert.equal(indice.porId.has('aj'), true)
  assert.equal(indice.porId.has('fin'), false, 'não frontline fica de fora')
  assert.equal(indice.porId.size, 2)
})

test('sem nenhum cargo marcado, ninguem e frontline', () => {
  const vazio = indexarFrontline(DESCRITIVOS.map((d) => ({ ...d, frontline: false })))

  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém' }, vazio), false)
  assert.equal(ehFrontline({ cargo: 'Ajudante de Armazém', vagaCargoId: 'aj' }, vazio), false)
})
