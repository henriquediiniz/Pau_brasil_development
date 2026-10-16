import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveMiddlewareRedirect } from '../src/lib/middleware-access'
import { buildSessionUser } from './support/session-user'

test('redireciona sessoes revogadas para o login', () => {
  assert.equal(
    resolveMiddlewareRedirect('/app/hoje', buildSessionUser(), false),
    '/login?error=SessionRevoked'
  )
})

test('desvia usuarios sem gamificacao para o shell correto', () => {
  assert.equal(
    resolveMiddlewareRedirect('/app/hoje', buildSessionUser({ isEmpresaAdmin: true }), true),
    '/empresa'
  )
  assert.equal(
    resolveMiddlewareRedirect('/app/inicio', buildSessionUser(), true),
    '/universidade'
  )
})

test('protege rotas administrativas e coord/gestao com os mesmos helpers do middleware', () => {
  assert.equal(
    resolveMiddlewareRedirect('/admin/usuarios', buildSessionUser(), true),
    '/app/hoje'
  )
  assert.equal(
    resolveMiddlewareRedirect('/admin/usuarios', buildSessionUser({ role: 'RH_ADMIN' }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/admin/empresas', buildSessionUser({ role: 'RH_ADMIN' }), true),
    '/app/hoje'
  )
  assert.equal(
    resolveMiddlewareRedirect('/admin/upb', buildSessionUser({ isUPBAdmin: true }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/coord/aprovacoes', buildSessionUser({ nivel: 'SUPERVISOR' }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/gestor/dashboard', buildSessionUser({ nivel: 'GERENTE' }), true),
    null
  )
})

test('a rota legada /admin/rh sempre cai em /talentos, que entao aplica a permissao', () => {
  // A regra de rota legada roda ANTES da checagem de permissao, entao todo
  // mundo sai de /admin/rh para /talentos. O bloqueio acontece no salto
  // seguinte, quando o middleware reavalia /talentos (ver teste abaixo).
  assert.equal(
    resolveMiddlewareRedirect('/admin/rh', buildSessionUser(), true),
    '/talentos'
  )
  assert.equal(
    resolveMiddlewareRedirect('/admin/rh', buildSessionUser({ role: 'RH_ADMIN' }), true),
    '/talentos'
  )
  assert.equal(
    resolveMiddlewareRedirect('/admin/rh', buildSessionUser({ nivel: 'GERENTE' }), true),
    '/talentos'
  )
})

test('protege /talentos — so RH_ADMIN e SYS_ADMIN passam', () => {
  // Usuário comum é redirecionado
  assert.equal(
    resolveMiddlewareRedirect('/talentos', buildSessionUser(), true),
    '/app/hoje'
  )
  // RH_ADMIN passa
  assert.equal(
    resolveMiddlewareRedirect('/talentos', buildSessionUser({ role: 'RH_ADMIN' }), true),
    null
  )
  // SYS_ADMIN passa
  assert.equal(
    resolveMiddlewareRedirect('/talentos', buildSessionUser({ role: 'SYS_ADMIN' }), true),
    null
  )
  // GESTOR não passa (não é RH_ADMIN nem SYS_ADMIN)
  assert.equal(
    resolveMiddlewareRedirect('/talentos', buildSessionUser({ nivel: 'GERENTE' }), true),
    '/app/hoje'
  )
})

test('mantem o redirect especifico de empresa', () => {
  assert.equal(
    resolveMiddlewareRedirect('/empresa', buildSessionUser({ isEmpresaAdmin: true }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/empresa', buildSessionUser(), true),
    '/app/hoje'
  )
})

test('protege o modulo Gente com a mesma fronteira do helper', () => {
  assert.equal(
    resolveMiddlewareRedirect('/gente', buildSessionUser({ role: 'RH_ADMIN' }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/gente/vagas', buildSessionUser({ role: 'SYS_ADMIN' }), true),
    null
  )
  assert.equal(
    resolveMiddlewareRedirect('/gente/pcd', buildSessionUser({ nivel: 'GERENTE' }), true),
    '/app/hoje'
  )
  assert.equal(
    resolveMiddlewareRedirect('/gente', buildSessionUser(), true),
    '/app/hoje'
  )
  assert.equal(resolveMiddlewareRedirect('/gente', null, true), '/app/hoje')
})

test('sessao revogada nao entra no Gente mesmo sendo RH', () => {
  assert.equal(
    resolveMiddlewareRedirect('/gente', buildSessionUser({ role: 'RH_ADMIN' }), false),
    '/login?error=SessionRevoked'
  )
})

test('troca obrigatoria de senha precede o destino por perfil sem criar loop', () => {
  for (const user of [
    buildSessionUser({ mustChangePassword: true }),
    buildSessionUser({ mustChangePassword: true, isEmpresaAdmin: true }),
    buildSessionUser({ mustChangePassword: true, role: 'SYS_ADMIN' }),
  ]) {
    for (const path of ['/app/inicio', '/universidade', '/empresa', '/admin']) {
      assert.equal(resolveMiddlewareRedirect(path, user, true), '/app/alterar-senha')
    }
    assert.equal(resolveMiddlewareRedirect('/app/alterar-senha', user, true), null)
    assert.equal(resolveMiddlewareRedirect('/app/inicio', user, false), '/login?error=SessionRevoked')
  }
})
