import assert from 'node:assert/strict'
import test from 'node:test'

import { TRANSICOES_VALIDAS } from '../src/lib/carreiras-areas'

/**
 * A máquina de estados do Banco de Talentos.
 *
 * O bug que originou estes testes: de `RECEBIDO` só era permitido ir para
 * `TRIAGEM`. O botão "Rejeitar Candidato" na primeira coluna chamava a API,
 * tomava "Transição inválida" e o cartão ficava onde estava — sem aviso. O RH
 * reabria o mesmo currículo várias vezes sem entender por quê.
 */

const ETAPAS = ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'APROVADO', 'REJEITADO', 'ARQUIVADO']

test('da primeira coluna da para rejeitar sem passar pela triagem', () => {
  // Olhar o currículo que acabou de chegar e ver que não serve é o caso comum;
  // obrigar a passar por triagem antes é burocracia sem propósito.
  assert.ok(TRANSICOES_VALIDAS.RECEBIDO.includes('REJEITADO'))
  assert.ok(TRANSICOES_VALIDAS.RECEBIDO.includes('ARQUIVADO'))
})

test('o caminho normal do funil continua valendo', () => {
  assert.ok(TRANSICOES_VALIDAS.RECEBIDO.includes('TRIAGEM'))
  assert.ok(TRANSICOES_VALIDAS.TRIAGEM.includes('ENTREVISTA'))
  assert.ok(TRANSICOES_VALIDAS.ENTREVISTA.includes('APROVADO'))
})

test('nao se pula etapa do funil', () => {
  // Aprovar quem nunca foi entrevistado esconderia a entrevista que não houve.
  assert.ok(!TRANSICOES_VALIDAS.RECEBIDO.includes('APROVADO'))
  assert.ok(!TRANSICOES_VALIDAS.RECEBIDO.includes('ENTREVISTA'))
  assert.ok(!TRANSICOES_VALIDAS.TRIAGEM.includes('APROVADO'))
})

test('dentro do funil nao se volta atras', () => {
  // Desandar a etapa de quem está em andamento apagaria o progresso. Tirar de
  // Rejeitado/Arquivado é outra coisa — ver o teste de reabertura.
  assert.ok(!TRANSICOES_VALIDAS.TRIAGEM.includes('RECEBIDO'))
  assert.ok(!TRANSICOES_VALIDAS.ENTREVISTA.includes('TRIAGEM'))
  assert.ok(!TRANSICOES_VALIDAS.APROVADO.includes('ENTREVISTA'))
})

test('rejeitado e arquivado podem voltar para o funil', () => {
  // Pedido do PO em 2026-10-01: o candidato ficava preso nessas etapas, sem
  // poder ir para canto nenhum — inclusive quando rejeitado por engano.
  for (const etapa of ['REJEITADO', 'ARQUIVADO']) {
    for (const destino of ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA']) {
      assert.ok(TRANSICOES_VALIDAS[etapa].includes(destino), `${etapa} -> ${destino}`)
    }
  }
  assert.ok(TRANSICOES_VALIDAS.REJEITADO.includes('ARQUIVADO'))
  assert.ok(TRANSICOES_VALIDAS.ARQUIVADO.includes('REJEITADO'))
})

test('quem volta nao vai direto para aprovado', () => {
  // Aprovar sem entrevista esconderia a entrevista que não houve.
  assert.ok(!TRANSICOES_VALIDAS.REJEITADO.includes('APROVADO'))
  assert.ok(!TRANSICOES_VALIDAS.ARQUIVADO.includes('APROVADO'))
})

test('nenhuma etapa e beco sem saida', () => {
  // Foi exatamente o bug: ARQUIVADO tinha lista vazia e o candidato ficava
  // preso para sempre.
  for (const etapa of ETAPAS) {
    assert.ok(TRANSICOES_VALIDAS[etapa].length > 0, `"${etapa}" não leva a lugar nenhum`)
  }
})

test('toda etapa tem regra declarada, e so aponta para etapa que existe', () => {
  /*
    Uma etapa sem chave vira `?? []` na rota e trava o candidato para sempre,
    sem erro visível. E um destino escrito errado nunca seria alcançável.
  */
  for (const etapa of ETAPAS) {
    assert.ok(etapa in TRANSICOES_VALIDAS, `"${etapa}" não tem transições declaradas`)

    for (const destino of TRANSICOES_VALIDAS[etapa]) {
      assert.ok(ETAPAS.includes(destino), `"${etapa}" aponta para "${destino}", que não existe`)
      assert.notEqual(destino, etapa, `"${etapa}" aponta para si mesma`)
    }
  }
})

test('de qualquer etapa ativa da para sair do funil', () => {
  // Candidato preso numa etapa sem saída fica no quadro para sempre.
  for (const etapa of ['RECEBIDO', 'TRIAGEM', 'ENTREVISTA', 'APROVADO']) {
    const saidas = TRANSICOES_VALIDAS[etapa]
    assert.ok(
      saidas.includes('REJEITADO') || saidas.includes('ARQUIVADO'),
      `"${etapa}" não tem como sair do funil`
    )
  }
})
