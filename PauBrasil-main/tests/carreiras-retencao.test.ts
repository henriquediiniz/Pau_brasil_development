import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIAS_RETENCAO_CV,
  cvVencido,
  diasParaApagar,
  saidaDoFunil,
  type MudancaDeEtapa,
} from '../src/lib/carreiras-retencao'

const HOJE = new Date('2026-10-01T12:00:00Z')
const diasAtras = (n: number) => new Date(HOJE.getTime() - n * 24 * 60 * 60 * 1000)
const mudanca = (de: string, para: string, dias: number): MudancaDeEtapa => ({
  etapaAnterior: de, etapaNova: para, createdAt: diasAtras(dias),
})

test('o prazo combinado com o RH e de 10 dias', () => {
  assert.equal(DIAS_RETENCAO_CV, 10)
})

test('conta a partir de quando saiu do funil', () => {
  const saida = saidaDoFunil([mudanca('RECEBIDO', 'TRIAGEM', 20), mudanca('TRIAGEM', 'REJEITADO', 4)], HOJE)
  assert.deepEqual(saida, diasAtras(4))
})

test('passar de rejeitado para arquivado nao reinicia o prazo', () => {
  const saida = saidaDoFunil([mudanca('TRIAGEM', 'REJEITADO', 12), mudanca('REJEITADO', 'ARQUIVADO', 2)], HOJE)
  assert.deepEqual(saida, diasAtras(12))
  assert.equal(cvVencido(saida, HOJE), true)
})

test('quem foi reaberto e rejeitado de novo ganha prazo novo', () => {
  // A reabertura e o RH dizendo que a pessoa voltou a interessar.
  const saida = saidaDoFunil([
    mudanca('RECEBIDO', 'REJEITADO', 30),
    mudanca('REJEITADO', 'TRIAGEM', 25),
    mudanca('TRIAGEM', 'REJEITADO', 3),
  ], HOJE)
  assert.deepEqual(saida, diasAtras(3))
  assert.equal(cvVencido(saida, HOJE), false)
})

test('sem historico usa a alternativa, que nunca apaga antes da hora', () => {
  assert.deepEqual(saidaDoFunil([], diasAtras(1)), diasAtras(1))
})

test('a ordem do historico nao importa', () => {
  const saida = saidaDoFunil([mudanca('TRIAGEM', 'REJEITADO', 3), mudanca('RECEBIDO', 'ARQUIVADO', 40)], HOJE)
  assert.deepEqual(saida, diasAtras(3))
})

test('vence exatamente no decimo dia', () => {
  assert.equal(cvVencido(diasAtras(9.99), HOJE), false)
  assert.equal(cvVencido(diasAtras(10), HOJE), true)
})

test('dias que faltam para apagar', () => {
  assert.equal(diasParaApagar(diasAtras(0), HOJE), 10)
  assert.equal(diasParaApagar(diasAtras(9.5), HOJE), 1)
  assert.equal(diasParaApagar(diasAtras(15), HOJE), 0)
})
