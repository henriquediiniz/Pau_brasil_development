import assert from 'node:assert/strict'
import test from 'node:test'

import {
  GAMIFICATION_COMPANY,
  canAccessGente,
  canManageEmpresa,
  canManageGente,
  canManageTeam,
  canManageTeamByNivel,
  canViewAudit,
  canViewDadoSensivel,
  escopoOperacoesGente,
  hasGamificationAccess,
  isCoordLevel,
  isGestorLevel,
  isSystemAdminRole,
  isSysAdmin,
} from '../src/lib/auth-helpers'
import { buildSessionUser } from './support/session-user'

test('identifica corretamente os roles de admin do sistema', () => {
  assert.equal(isSystemAdminRole('SYS_ADMIN'), true)
  assert.equal(isSystemAdminRole('RH_ADMIN'), false)
  assert.equal(isSystemAdminRole('USER'), false)
})

test('reconhece niveis de gestao e coordenacao', () => {
  assert.equal(canManageTeamByNivel('SUPERVISOR'), true)
  assert.equal(canManageTeamByNivel('GERENTE'), true)
  assert.equal(canManageTeamByNivel('COLABORADOR'), false)

  assert.equal(isCoordLevel(buildSessionUser({ nivel: 'COORDENADOR' })), true)
  assert.equal(isGestorLevel(buildSessionUser({ nivel: 'GERENTE' })), true)
  assert.equal(canManageTeam(buildSessionUser({ nivel: 'COLABORADOR' })), false)
})

test('permite administracao de empresa para admin do sistema ou admin da empresa', () => {
  assert.equal(canManageEmpresa(buildSessionUser({ isEmpresaAdmin: true })), true)
  assert.equal(canManageEmpresa(buildSessionUser({ role: 'SYS_ADMIN' })), true)
  assert.equal(canManageEmpresa(buildSessionUser({ role: 'RH_ADMIN' })), false)
  assert.equal(canManageEmpresa(buildSessionUser()), false)
})

test('libera gamificacao para companhia correta ou admin global', () => {
  assert.equal(
    hasGamificationAccess(buildSessionUser({ company: GAMIFICATION_COMPANY })),
    true
  )
  assert.equal(hasGamificationAccess(buildSessionUser({ role: 'RH_ADMIN' })), true)
  assert.equal(hasGamificationAccess(buildSessionUser({ company: 'Outra Companhia' })), false)
})

test('mantem regras de auditoria alinhadas aos helpers centrais', () => {
  assert.equal(canViewAudit(buildSessionUser({ nivel: 'DIRETOR' })), true)
  assert.equal(canViewAudit(buildSessionUser({ role: 'SYS_ADMIN' })), true)
  assert.equal(canViewAudit(buildSessionUser()), false)
  assert.equal(isSysAdmin(buildSessionUser({ role: 'RH_ADMIN' })), false)
})

// ─── Gente: recrutamento e quadro ─────────────────────────────────────────────

test('restringe o modulo Gente a RH e admin do sistema', () => {
  assert.equal(canAccessGente(buildSessionUser({ role: 'RH_ADMIN' })), true)
  assert.equal(canAccessGente(buildSessionUser({ role: 'SYS_ADMIN' })), true)
  assert.equal(canAccessGente(buildSessionUser({ nivel: 'GERENTE' })), false)
  assert.equal(canAccessGente(buildSessionUser({ nivel: 'DIRETOR' })), false)
  assert.equal(canAccessGente(buildSessionUser()), false)
})

test('escrita no modulo Gente segue a mesma fronteira da leitura', () => {
  assert.equal(canManageGente(buildSessionUser({ role: 'RH_ADMIN' })), true)
  assert.equal(canManageGente(buildSessionUser({ nivel: 'GERENTE' })), false)
})

test('dado sensivel de Gente nao vaza para gestor nem diretoria', () => {
  assert.equal(canViewDadoSensivel(buildSessionUser({ role: 'RH_ADMIN' })), true)
  assert.equal(canViewDadoSensivel(buildSessionUser({ role: 'SYS_ADMIN' })), true)
  assert.equal(canViewDadoSensivel(buildSessionUser({ nivel: 'DIRETOR' })), false)
  assert.equal(canViewDadoSensivel(buildSessionUser({ nivel: 'GERENTE' })), false)
})

test('escopo de operacoes do Gente e fail-closed para RH sem operacao', () => {
  // SYS_ADMIN enxerga todas as operacoes.
  assert.equal(escopoOperacoesGente(buildSessionUser({ role: 'SYS_ADMIN' })), null)

  // RH com operacoes atribuidas ve apenas as dele.
  assert.deepEqual(
    escopoOperacoesGente(buildSessionUser({ role: 'RH_ADMIN', operationIds: ['op-patos'] })),
    ['op-patos']
  )

  // RH sem operacao nenhuma NAO ve tudo — ve nada. Cadastro incompleto nao
  // pode virar acesso irrestrito a laudo medico e salario.
  assert.deepEqual(escopoOperacoesGente(buildSessionUser({ role: 'RH_ADMIN' })), [])
})
