import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analisarPlanilhaCandidatos,
  converterOrigem,
  converterSituacao,
} from '../src/lib/gente/candidato-importador'
import type { LinhaPlanilha, OperacaoRef } from '../src/lib/gente/vaga-importador'

const OPERACOES: OperacaoRef[] = [
  { id: 'op-patos', nome: 'Pau Brasil Patos', nomeAbrev: 'Patos' },
  { id: 'op-sume', nome: 'Pau Brasil Sumé', nomeAbrev: 'Sumé' },
]

function linha(dados: Record<string, unknown>, n = 2): LinhaPlanilha {
  return { linha: n, dados }
}

/** Linha no formato que a planilha de stand-by do RH traz. */
function linhaValida(extra: Record<string, unknown> = {}, n = 2): LinhaPlanilha {
  return linha(
    {
      Unidade: 'PATOS',
      Nome: 'Arthur Silva',
      Cargo: 'Motorista',
      Telefone: '83999990000',
      'Mês Processo': 'Fevereiro',
      'Entrevistado GG': 'OK',
      'Aprovado Gestor': 'OK',
      'Teste Prático': 'N/A',
      Situação: 'EM STAND BY',
      ...extra,
    },
    n
  )
}

// ─── Conversores ──────────────────────────────────────────────────────────────

test('converterSituacao aceita as variacoes da planilha', () => {
  assert.equal(converterSituacao('EM STAND BY'), 'EM_STAND_BY')
  assert.equal(converterSituacao('Stand By'), 'EM_STAND_BY')
  assert.equal(converterSituacao('CONTRATADO'), 'CONTRATADO')
  assert.equal(converterSituacao('Não Contratado'), 'NAO_CONTRATADO')
  assert.equal(converterSituacao('Indisponível'), 'INDISPONIVEL')
  assert.equal(converterSituacao(''), null)
  assert.equal(converterSituacao('sei la'), 'invalida')
})

test('converterOrigem entende as origens que o RH usa', () => {
  assert.equal(converterOrigem('APLICATIVO'), 'APLICATIVO')
  assert.equal(converterOrigem('WhatsApp'), 'WHATSAPP')
  assert.equal(converterOrigem('INDIQUE UM AMIGO'), 'INDICACAO')
  assert.equal(converterOrigem('site'), 'PORTAL_CARREIRAS')
  assert.equal(converterOrigem(''), null)
  assert.equal(converterOrigem('pombo correio'), 'invalida')
})

// ─── Análise ──────────────────────────────────────────────────────────────────

test('importa candidato completo com as etapas da planilha', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida()], OPERACOES)

  assert.equal(rel.erros.length, 0)
  assert.equal(rel.validos.length, 1)

  const c = rel.validos[0]
  assert.equal(c.operacaoId, 'op-patos')
  assert.equal(c.nome, 'Arthur Silva')
  assert.equal(c.situacao, 'EM_STAND_BY')
  assert.deepEqual(c.etapas, [
    { chave: 'entrevista_gg', resultado: 'OK' },
    { chave: 'aprovacao_gestor', resultado: 'OK' },
    { chave: 'teste_pratico', resultado: 'NA' },
  ])
})

test('nome e unidade sao obrigatorios', () => {
  const rel = analisarPlanilhaCandidatos([linha({ Cargo: 'Motorista' })], OPERACOES)

  assert.equal(rel.validos.length, 0)
  assert.deepEqual(rel.erros.map((e) => e.campo).sort(), ['nome', 'unidade'])
})

test('unidade fora das operacoes cadastradas bloqueia a linha', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida({ Unidade: 'Campina Grande' })], OPERACOES)

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'unidade')
})

test('situacao vazia assume stand-by', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida({ 'Situação': '' })], OPERACOES)

  assert.equal(rel.validos[0].situacao, 'EM_STAND_BY')
})

test('resultado de etapa invalido bloqueia, apontando a etapa', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida({ 'Entrevistado GG': 'mais ou menos' })], OPERACOES)

  assert.equal(rel.validos.length, 0)
  assert.equal(rel.erros[0].campo, 'entrevista_gg')
  assert.match(rel.erros[0].mensagem, /Entrevista G&G/)
})

test('origem desconhecida vira OUTRO com aviso, sem travar a pessoa', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida({ Origem: 'pombo correio' })], OPERACOES)

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].origemCurriculo, 'OUTRO')
  assert.ok(rel.avisos.some((a) => a.campo === 'origemCurriculo'))
})

test('email malformado nao bloqueia — entra vazio com aviso', () => {
  const rel = analisarPlanilhaCandidatos([linhaValida({ Email: 'arthur.sem.arroba' })], OPERACOES)

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].email, null)
  assert.ok(rel.avisos.some((a) => a.campo === 'email'))
})

test('telefone e o que identifica repeticao no arquivo', () => {
  const rel = analisarPlanilhaCandidatos(
    [
      linhaValida({}, 2),
      linhaValida({ Nome: 'Arthur S.' }, 3), // mesmo telefone
      linhaValida({ Telefone: '83988887777' }, 4),
    ],
    OPERACOES
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 1)
  assert.match(rel.duplicados[0].mensagem, /linha 2/)
})

test('sem telefone, a repeticao cai para nome + operacao', () => {
  const semTel = { Telefone: '' }
  const rel = analisarPlanilhaCandidatos(
    [
      linhaValida(semTel, 2),
      linhaValida(semTel, 3),
      linhaValida({ ...semTel, Unidade: 'Sumé' }, 4), // mesma pessoa, outra operação
    ],
    OPERACOES
  )

  assert.equal(rel.validos.length, 2)
  assert.equal(rel.duplicados.length, 1)
})

test('avisa quando contratado tem etapa reprovada', () => {
  const rel = analisarPlanilhaCandidatos(
    [linhaValida({ 'Situação': 'CONTRATADO', 'Aprovado Gestor': 'NÃO' })],
    OPERACOES
  )

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => /etapa reprovada/i.test(a.mensagem)))
})

test('avisa quando situacao final vem sem data', () => {
  const rel = analisarPlanilhaCandidatos(
    [linhaValida({ 'Situação Final': 'CONTRATADO' })],
    OPERACOES
  )

  assert.equal(rel.validos.length, 1)
  assert.ok(rel.avisos.some((a) => a.campo === 'dataSituacaoFinal'))
})

test('avisa quando nenhuma etapa foi preenchida', () => {
  const rel = analisarPlanilhaCandidatos(
    [linha({ Unidade: 'Patos', Nome: 'Maria', Telefone: '83911112222' })],
    OPERACOES
  )

  assert.equal(rel.validos.length, 1)
  assert.equal(rel.validos[0].etapas.length, 0)
  assert.ok(rel.avisos.some((a) => /processo todo pendente/i.test(a.mensagem)))
})

test('uma linha com erro nao derruba as outras', () => {
  const rel = analisarPlanilhaCandidatos(
    [linhaValida({}, 2), linha({ Unidade: 'Patos' }, 3), linhaValida({ Telefone: '83900000000' }, 4)],
    OPERACOES
  )

  assert.equal(rel.total, 3)
  assert.equal(rel.validos.length, 2)
  assert.equal(rel.erros.length, 1)
  assert.equal(rel.erros[0].linha, 3)
})

test('planilha vazia devolve relatorio zerado', () => {
  const rel = analisarPlanilhaCandidatos([], OPERACOES)

  assert.deepEqual(rel, { total: 0, validos: [], erros: [], avisos: [], duplicados: [] })
})
