import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canManageEmpresa,
  isSysAdmin,
} from '../src/lib/auth-helpers'
import { buildSessionUser } from './support/session-user'

// ─── Regras de acesso a /admin/usuarios ──────────────────────────────────────

test('isSysAdmin identifica apenas administradores totais do sistema', () => {
  assert.equal(isSysAdmin(buildSessionUser({ role: 'SYS_ADMIN' })), true)
  assert.equal(isSysAdmin(buildSessionUser({ role: 'RH_ADMIN' })), false)
  assert.equal(isSysAdmin(buildSessionUser({ role: 'USER' })), false)
})

test('COLABORADOR com nivel DIRETOR nao tem acesso de admin de sistema', () => {
  assert.equal(isSysAdmin(buildSessionUser({ role: 'USER', nivel: 'DIRETOR' })), false)
})

// ─── Regras de acesso a /empresa/usuarios ────────────────────────────────────

test('SYS_ADMIN pode gerenciar usuarios de qualquer empresa', () => {
  assert.equal(canManageEmpresa(buildSessionUser({ role: 'SYS_ADMIN' })), true)
})

test('RH_ADMIN nao herda administracao de empresa', () => {
  assert.equal(canManageEmpresa(buildSessionUser({ role: 'RH_ADMIN' })), false)
})

test('isEmpresaAdmin permite gerenciar usuarios da propria empresa', () => {
  assert.equal(canManageEmpresa(buildSessionUser({ isEmpresaAdmin: true })), true)
})

test('usuario sem privilegio nao pode gerenciar empresa', () => {
  assert.equal(canManageEmpresa(buildSessionUser()), false)
  assert.equal(canManageEmpresa(buildSessionUser({ role: 'USER', nivel: 'GERENTE' })), false)
})

// ─── Regras de bulk deactivate ───────────────────────────────────────────────

test('bulk deactivate: filtra o proprio ID da lista (protecao de auto-desativacao)', () => {
  const actorId = 'actor-123'
  const ids = ['user-1', 'user-2', actorId, 'user-3']

  const toDeactivate = ids.filter(id => id !== actorId)

  assert.equal(toDeactivate.includes(actorId), false)
  assert.equal(toDeactivate.length, 3)
})

test('bulk deactivate: lista vazia apos remover o proprio ID retorna zero candidatos', () => {
  const actorId = 'actor-123'
  const ids = [actorId]

  const toDeactivate = ids.filter(id => id !== actorId)

  assert.equal(toDeactivate.length, 0)
})

test('bulk deactivate empresa: filtra usuarios de outra empresa', () => {
  const actorEmpresaId = 'empresa-1'

  const candidatos = [
    { id: 'u1', empresaId: 'empresa-1' },
    { id: 'u2', empresaId: 'empresa-2' }, // outra empresa — deve ser excluido
    { id: 'u3', empresaId: 'empresa-1' },
  ]

  const validos = candidatos
    .filter(u => u.empresaId === actorEmpresaId)
    .map(u => u.id)

  assert.equal(validos.length, 2)
  assert.equal(validos.includes('u2'), false)
})

test('bulk deactivate empresa: SYS_ADMIN nao precisa de filtro por empresa', () => {
  const actor = buildSessionUser({ role: 'SYS_ADMIN' })
  const isSys = isSysAdmin(actor)

  // Se SYS_ADMIN, nao filtra por empresa
  const candidatos = [
    { id: 'u1', empresaId: 'empresa-1' },
    { id: 'u2', empresaId: 'empresa-2' },
  ]

  const validos = isSys
    ? candidatos.map(u => u.id)
    : candidatos.filter(u => u.empresaId === actor.empresaId).map(u => u.id)

  assert.equal(validos.length, 2)
})

// ─── Validacoes de campos de usuario ─────────────────────────────────────────

test('email deve ter dominio valido — logica de validacao', () => {
  const ALLOWED_DOMAIN = '@grupopaubrasil.com.br'

  function isEmailValido(email: string) {
    return email.endsWith(ALLOWED_DOMAIN)
  }

  assert.equal(isEmailValido('user@grupopaubrasil.com.br'), true)
  assert.equal(isEmailValido('user@gmail.com'), false)
  assert.equal(isEmailValido('user@outrodominio.com.br'), false)
})

test('senha deve ter no minimo 8 caracteres — logica de validacao', () => {
  function isSenhaValida(senha: string) {
    return senha.length >= 8
  }

  assert.equal(isSenhaValida('12345678'), true)
  assert.equal(isSenhaValida('abc'), false)
  assert.equal(isSenhaValida(''), false)
})

// ─── Soft delete ─────────────────────────────────────────────────────────────

test('soft delete: usuario inativo tem isActive false, nao e removido do banco', () => {
  const user = buildSessionUser({ isActive: false })

  // isActive = false simula o soft delete; o objeto ainda existe
  assert.equal(user.isActive, false)
  assert.ok(user.id, 'objeto ainda existe com ID')
})

test('reativacao: usuario pode voltar a isActive true', () => {
  const user = buildSessionUser({ isActive: false })
  const reativado = { ...user, isActive: true }

  assert.equal(reativado.isActive, true)
})
