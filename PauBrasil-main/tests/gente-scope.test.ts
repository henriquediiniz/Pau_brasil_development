import assert from 'node:assert/strict'
import test from 'node:test'

import {
  empresaPadraoGente,
  podeEscreverNaOperacao,
  resolverEscopoGente,
  whereEscopoGente,
  whereGrupoGente,
} from '../src/lib/gente/scope'
import { buildSessionUser } from './support/session-user'

const rh = (operationIds: string[] = []) =>
  buildSessionUser({ role: 'RH_ADMIN', operationIds, empresaId: 'empresa-1' })

const sys = () => buildSessionUser({ role: 'SYS_ADMIN' })

test('SYS_ADMIN enxerga todas as operacoes sem filtro', () => {
  assert.deepEqual(resolverEscopoGente(sys()), { tipo: 'todas' })
  assert.deepEqual(whereEscopoGente(sys()), {})
})

test('RH ve apenas as proprias operacoes, dentro da propria empresa', () => {
  const user = rh(['op-patos', 'op-sume'])

  assert.deepEqual(resolverEscopoGente(user), {
    tipo: 'operacoes',
    operacaoIds: ['op-patos', 'op-sume'],
    empresaId: 'empresa-1',
  })
  assert.deepEqual(whereEscopoGente(user), {
    operacaoId: { in: ['op-patos', 'op-sume'] },
    empresaId: 'empresa-1',
  })
})

test('RH sem operacao nao consulta o banco — o where vira null', () => {
  assert.deepEqual(resolverEscopoGente(rh()), { tipo: 'nenhuma' })
  assert.equal(whereEscopoGente(rh()), null)
})

test('escrita so e permitida na propria operacao', () => {
  const user = rh(['op-patos'])

  assert.equal(podeEscreverNaOperacao(user, 'op-patos'), true)
  assert.equal(podeEscreverNaOperacao(user, 'op-sume'), false)
  assert.equal(podeEscreverNaOperacao(user, null), false)
})

test('registro sem operacao so pode ser criado por SYS_ADMIN', () => {
  assert.equal(podeEscreverNaOperacao(sys(), null), true)
  assert.equal(podeEscreverNaOperacao(sys(), 'op-qualquer'), true)
  assert.equal(podeEscreverNaOperacao(rh(['op-patos']), null), false)
})

test('gestor e colaborador nao escrevem em operacao nenhuma', () => {
  assert.equal(podeEscreverNaOperacao(buildSessionUser({ nivel: 'GERENTE' }), 'op-patos'), false)
  assert.equal(podeEscreverNaOperacao(buildSessionUser(), 'op-patos'), false)
})

// ─── Exceção: sucessão é visão de grupo ───────────────────────────────────────

test('sucessao ignora a operacao do usuario, mas nao a empresa', () => {
  // Quem é de Patos precisa enxergar quem está sendo preparado nas outras
  // revendas — senão o mapa de cobertura fica pela metade em toda unidade.
  const user = rh(['op-patos'])

  assert.deepEqual(whereGrupoGente(user), { empresaId: 'empresa-1' })
  assert.notDeepEqual(
    whereGrupoGente(user),
    whereEscopoGente(user),
    'o escopo de grupo é mais amplo que o da operação'
  )
})

test('RH sem operacao nenhuma ainda enxerga o plano do grupo', () => {
  // Diferente das outras telas: aqui a falta de operação não cega o usuário,
  // porque a visão não é por unidade.
  assert.deepEqual(whereGrupoGente(rh()), { empresaId: 'empresa-1' })
  assert.equal(whereEscopoGente(rh()), null, 'as demais telas seguem fail-closed')
})

test('SYS_ADMIN enxerga o grupo inteiro, sem corte de empresa', () => {
  assert.deepEqual(whereGrupoGente(sys()), {})
})

test('sem empresa no cadastro, nao da para delimitar o grupo', () => {
  const semEmpresa = buildSessionUser({ role: 'RH_ADMIN', empresaId: null })

  assert.equal(whereGrupoGente(semEmpresa), null, 'fail-closed')
})

test('quem nao tem acesso ao modulo nao ganha a visao de grupo', () => {
  assert.equal(whereGrupoGente(buildSessionUser({ nivel: 'GERENTE' })), null)
  assert.equal(whereGrupoGente(buildSessionUser()), null)
})

test('a visao de grupo nao afrouxa a escrita', () => {
  // Ver o plano da outra revenda é uma coisa; editar o registro dela é outra.
  const user = rh(['op-patos'])

  assert.equal(podeEscreverNaOperacao(user, 'op-sume'), false)
  assert.equal(podeEscreverNaOperacao(user, 'op-patos'), true)
})

test('empresa padrao vem do cadastro do usuario', () => {
  assert.equal(empresaPadraoGente(rh(['op-patos'])), 'empresa-1')
  assert.equal(empresaPadraoGente(buildSessionUser({ empresaId: null })), null)
})
