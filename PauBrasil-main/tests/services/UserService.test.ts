import assert from 'node:assert/strict'
import test from 'node:test'
import { UserService } from '../../src/services/UserService'

import { buildSessionUser } from '../support/session-user'

test('UserService: calcula nível corretamente baseado em pontos', () => {
  assert.equal(UserService.getLevelByPoints(0), 'Bronze')
  assert.equal(UserService.getLevelByPoints(399), 'Bronze')
  assert.equal(UserService.getLevelByPoints(400), 'Prata')
  assert.equal(UserService.getLevelByPoints(999), 'Prata')
  assert.equal(UserService.getLevelByPoints(1000), 'Ouro')
  assert.equal(UserService.getLevelByPoints(1999), 'Ouro')
  assert.equal(UserService.getLevelByPoints(2000), 'Diamante')
})

test('UserService: calcula progresso do nível corretamente', () => {
  // Bronze (0) -> Prata (400)
  assert.equal(UserService.calculateLevelProgress(0), 0)
  assert.equal(UserService.calculateLevelProgress(200), 50)
  assert.equal(UserService.calculateLevelProgress(400), 0) // Resetou no Prata

  // Prata (400) -> Ouro (1000)
  // (700 - 400) / (1000 - 400) = 300 / 600 = 50%
  assert.equal(UserService.calculateLevelProgress(700), 50)

  // Diamante (2000+)
  assert.equal(UserService.calculateLevelProgress(2500), 100)
})

test('UserService: validações de RBAC', () => {
  const admin = buildSessionUser({ role: 'SYS_ADMIN' as any })
  const user = buildSessionUser({ role: 'USER' as any, nivel: 'COLABORADOR' })
  const gestor = buildSessionUser({ role: 'USER' as any, nivel: 'GERENTE' })

  assert.equal(UserService.isSysAdmin(admin), true)
  assert.equal(UserService.isSysAdmin(user), false)
  
  assert.equal(UserService.canReview(gestor), true)
  assert.equal(UserService.canReview(user), false)
})
