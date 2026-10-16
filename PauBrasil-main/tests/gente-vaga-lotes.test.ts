import { test } from 'node:test'
import assert from 'node:assert/strict'

import { agruparEmLotes, alvoDaChave, minutoDe, type VagaDoLote } from '../src/lib/gente/vaga-lotes'

function vaga(over: Partial<VagaDoLote> & { id: string; createdAt: string }): VagaDoLote {
  return {
    importacaoId: null,
    cargo: 'Ajudante',
    operacaoNome: 'Patos',
    temCandidatos: false,
    ...over,
    createdAt: new Date(over.createdAt),
  }
}

test('vagas do mesmo carimbo formam um lote só', () => {
  const lotes = agruparEmLotes([
    vaga({ id: '1', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z' }),
    // Horário diferente não separa: o carimbo manda.
    vaga({ id: '2', importacaoId: 'a', createdAt: '2026-09-24T10:05:00.000Z' }),
    vaga({ id: '3', importacaoId: 'b', createdAt: '2026-09-24T10:00:00.000Z' }),
  ])

  assert.equal(lotes.length, 2)
  const a = lotes.find((l) => l.chave === 'imp:a')!
  assert.equal(a.total, 2)
  assert.equal(a.origem, 'carimbado')
  // O lote começa quando a primeira linha entrou.
  assert.equal(a.criadoEm.toISOString(), '2026-09-24T10:00:00.000Z')
})

test('vagas sem carimbo criadas no mesmo minuto viram um lote inferido', () => {
  const lotes = agruparEmLotes([
    vaga({ id: '1', createdAt: '2026-09-20T14:31:02.100Z', cargo: 'Motorista' }),
    vaga({ id: '2', createdAt: '2026-09-20T14:31:02.480Z', cargo: 'Ajudante' }),
    vaga({ id: '3', createdAt: '2026-09-20T14:31:59.900Z', cargo: 'Conferente' }),
  ])

  assert.equal(lotes.length, 1)
  assert.equal(lotes[0].chave, 'min:2026-09-20T14:31:00.000Z')
  assert.equal(lotes[0].origem, 'inferido')
  assert.equal(lotes[0].total, 3)
  assert.deepEqual(lotes[0].cargos, ['Ajudante', 'Conferente', 'Motorista'])
})

test('vaga sozinha no minuto não vira lote — é cadastro de tela', () => {
  // A regra existe para o RH não apagar o que digitou à mão achando que era
  // uma importação.
  assert.deepEqual(agruparEmLotes([vaga({ id: '1', createdAt: '2026-09-20T14:31:02.000Z' })]), [])
})

test('minutos vizinhos são lotes diferentes', () => {
  const lotes = agruparEmLotes([
    vaga({ id: '1', createdAt: '2026-09-20T14:31:59.999Z' }),
    vaga({ id: '2', createdAt: '2026-09-20T14:31:59.000Z' }),
    vaga({ id: '3', createdAt: '2026-09-20T14:32:00.000Z' }),
    vaga({ id: '4', createdAt: '2026-09-20T14:32:00.500Z' }),
  ])

  assert.deepEqual(
    lotes.map((l) => l.chave),
    ['min:2026-09-20T14:32:00.000Z', 'min:2026-09-20T14:31:00.000Z']
  )
})

test('vaga com candidato conta como bloqueada, não como removível', () => {
  const [lote] = agruparEmLotes([
    vaga({ id: '1', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z' }),
    vaga({
      id: '2',
      importacaoId: 'a',
      createdAt: '2026-09-24T10:00:00.000Z',
      temCandidatos: true,
    }),
  ])

  assert.equal(lote.total, 2)
  assert.equal(lote.removiveis, 1)
  assert.equal(lote.bloqueadas, 1)
})

test('lotes vêm do mais recente para o mais antigo', () => {
  const lotes = agruparEmLotes([
    vaga({ id: '1', importacaoId: 'velho', createdAt: '2026-09-01T08:00:00.000Z' }),
    vaga({ id: '2', importacaoId: 'novo', createdAt: '2026-09-24T08:00:00.000Z' }),
  ])

  assert.deepEqual(
    lotes.map((l) => l.chave),
    ['imp:novo', 'imp:velho']
  )
})

test('operações do lote saem sem repetir e sem os nulos', () => {
  const [lote] = agruparEmLotes([
    vaga({ id: '1', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z', operacaoNome: 'Sousa' }),
    vaga({ id: '2', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z', operacaoNome: 'Sousa' }),
    vaga({ id: '3', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z', operacaoNome: null }),
    vaga({ id: '4', importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z', operacaoNome: 'Patos' }),
  ])

  assert.deepEqual(lote.operacoes, ['Patos', 'Sousa'])
})

test('a amostra de cargos para em 6', () => {
  const [lote] = agruparEmLotes(
    Array.from({ length: 20 }, (_, i) =>
      vaga({ id: String(i), importacaoId: 'a', createdAt: '2026-09-24T10:00:00.000Z', cargo: `Cargo ${i}` })
    )
  )

  assert.equal(lote.total, 20)
  assert.equal(lote.cargos.length, 6)
})

test('alvoDaChave traduz o carimbo', () => {
  assert.deepEqual(alvoDaChave('imp:abc'), { importacaoId: 'abc' })
})

test('alvoDaChave traduz o minuto', () => {
  assert.deepEqual(alvoDaChave('min:2026-09-20T14:31:00.000Z'), {
    minutoInicio: new Date('2026-09-20T14:31:00.000Z'),
  })
})

test('alvoDaChave recusa chave que ampliaria a janela', () => {
  // Uma chave com segundos faria o filtro pegar de 14:31:30 a 14:32:30 —
  // metade de um lote que o RH não viu na tela.
  assert.equal(alvoDaChave('min:2026-09-20T14:31:30.000Z'), null)
  assert.equal(alvoDaChave('min:não é data'), null)
  assert.equal(alvoDaChave('imp:'), null)
  assert.equal(alvoDaChave('tudo'), null)
  assert.equal(alvoDaChave(''), null)
})

test('minutoDe corta os segundos', () => {
  assert.equal(minutoDe(new Date('2026-09-20T14:31:59.999Z')), '2026-09-20T14:31:00.000Z')
})
