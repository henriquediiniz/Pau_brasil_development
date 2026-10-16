import assert from 'node:assert/strict'
import test from 'node:test'

import { POLOS, operacoesDoPolo, poloPorSlug } from '../src/lib/gente/polos'

// As oito operações como estão em `prisma/seed-empresas.ts`.
const OPERACOES = [
  { id: 'patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
  { id: 'sume', nome: 'Pau Brasil Sumé', nomeAbrev: 'Sumé' },
  { id: 'sousa', nome: 'Pau Brasil Sousa', nomeAbrev: 'Sousa' },
  { id: 'itaporanga', nome: 'Pau Brasil Itaporanga', nomeAbrev: 'Itaporanga' },
  { id: 'guarabira', nome: 'Pau Brasil Guarabira', nomeAbrev: 'Guarabira' },
  { id: 'brumado', nome: 'Pau Brasil Brumado', nomeAbrev: 'Brumado' },
  { id: 'barra', nome: 'Pau Brasil Barra', nomeAbrev: 'Barra' },
  { id: 'cacule', nome: 'Pau Brasil Caculé', nomeAbrev: 'Caculé' },
]

function ids(slug: string, operacoes = OPERACOES) {
  return operacoesDoPolo(poloPorSlug(slug)!, operacoes).map((o) => o.id).sort()
}

test('cada polo reune as operacoes que o PO definiu', () => {
  assert.deepEqual(ids('patos-sume'), ['patos', 'sume'])
  assert.deepEqual(ids('sousa-itaporanga'), ['itaporanga', 'sousa'])
  assert.deepEqual(ids('guarabira'), ['guarabira'])
  assert.deepEqual(ids('brumado-cacule-barra'), ['barra', 'brumado', 'cacule'])
})

test('as oito operacoes caem em exatamente um polo', () => {
  // Nenhuma fica de fora e nenhuma aparece em dois — senão a soma dos filtros
  // não bate com a base.
  const contagem = new Map<string, number>()
  for (const polo of POLOS) {
    for (const op of operacoesDoPolo(polo, OPERACOES)) {
      contagem.set(op.id, (contagem.get(op.id) ?? 0) + 1)
    }
  }

  for (const op of OPERACOES) {
    assert.equal(contagem.get(op.id), 1, `${op.nome} caiu em ${contagem.get(op.id) ?? 0} polos`)
  }
})

test('reconhece sem acento e em qualquer caixa', () => {
  const variantes = [
    { id: 'a', nome: 'PAU BRASIL SUME', nomeAbrev: null },
    { id: 'b', nome: 'pau brasil cacule', nomeAbrev: null },
  ]
  assert.deepEqual(ids('patos-sume', variantes), ['a'])
  assert.deepEqual(ids('brumado-cacule-barra', variantes), ['b'])
})

test('casa por palavra inteira, nao por pedaco', () => {
  // Com `includes`, "Barragem" cairia no polo de Barra e "Patos Sul" ficaria
  // certo por sorte. A regra é palavra inteira.
  const armadilhas = [
    { id: 'barragem', nome: 'Pau Brasil Barragem', nomeAbrev: null },
    { id: 'sousandra', nome: 'Pau Brasil Sousandra', nomeAbrev: null },
  ]
  assert.deepEqual(ids('brumado-cacule-barra', armadilhas), [])
  assert.deepEqual(ids('sousa-itaporanga', armadilhas), [])
})

test('reconhece pela abreviacao quando o nome nao traz a cidade', () => {
  const op = [{ id: 'x', nome: 'CD Sertão', nomeAbrev: 'Patos' }]
  assert.deepEqual(ids('patos-sume', op), ['x'])
})

test('"Barra da Estiva" continua no polo de Barra', () => {
  // É o nome completo da cidade em `operacoes-rh.ts`; se a operação for
  // renomeada assim, não pode sair do polo.
  const op = [{ id: 'x', nome: 'Pau Brasil Barra da Estiva', nomeAbrev: null }]
  assert.deepEqual(ids('brumado-cacule-barra', op), ['x'])
})

test('slug desconhecido nao vira polo', () => {
  assert.equal(poloPorSlug('qualquer'), undefined)
  assert.equal(poloPorSlug(''), undefined)
})
