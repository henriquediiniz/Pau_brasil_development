import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validatePasswordPolicy,
  buildAuditDiff,
  createInviteToken,
  INVITE_TOKEN_TTL_MS,
} from '../src/lib/user-provisioning'
import { getInviteStatus } from '../src/lib/user-status'

// ─── validatePasswordPolicy ──────────────────────────────────────────────────

test('validatePasswordPolicy: senha curta lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('Ab1!567'),
    /pelo menos 10 caracteres/i,
  )
})

test('validatePasswordPolicy: sem maiuscula lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('ab1!567890'),
    /maiuscula|maiúscula/i,
  )
})

test('validatePasswordPolicy: sem numero lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('Abcde!fghi'),
    /número|numero/i,
  )
})

test('validatePasswordPolicy: sem caractere especial lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('Abcde12345'),
    /especial/i,
  )
})

test('validatePasswordPolicy: senha da blocklist lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('Senha123!a'),
    /comum/i,
  )
})

test('validatePasswordPolicy: senha com nome do usuario lanca erro', () => {
  assert.throws(
    () => validatePasswordPolicy('Carlos@2026!', { name: 'Carlos Silva' }),
    /nome do usuário|nome/i,
  )
})

test('validatePasswordPolicy: senha valida nao lanca erro', () => {
  assert.doesNotThrow(() =>
    validatePasswordPolicy('Xkp7!qr9Zt', { name: 'Ana Lima', email: 'ana@empresa.com' })
  )
})

// ─── buildAuditDiff ──────────────────────────────────────────────────────────

test('buildAuditDiff: campos iguais retorna diff vazio', () => {
  const state = { name: 'João', email: 'joao@x.com', role: 'USER', nivel: 'COLABORADOR', isActive: true }
  const diff = buildAuditDiff(state, { ...state })
  assert.deepEqual(diff, {})
})

test('buildAuditDiff: campo alterado aparece com before e after', () => {
  const before = { name: 'João', email: 'joao@x.com', role: 'USER', nivel: 'COLABORADOR', isActive: true }
  const after = { ...before, nivel: 'GERENTE' }
  const diff = buildAuditDiff(before, after)
  assert.equal('nivel' in diff, true)
  assert.equal((diff as any).nivel.before, 'COLABORADOR')
  assert.equal((diff as any).nivel.after, 'GERENTE')
  assert.equal('name' in diff, false)
})

// ─── createInviteToken ───────────────────────────────────────────────────────

test('createInviteToken: expiresAt e daqui a 7 dias', () => {
  const before = Date.now()
  const { expiresAt } = createInviteToken()
  const after = Date.now()
  const exp = expiresAt.getTime()
  assert.ok(exp >= before + INVITE_TOKEN_TTL_MS - 1000)
  assert.ok(exp <= after + INVITE_TOKEN_TTL_MS + 1000)
})

test('createInviteToken: token e tokenHash sao diferentes', () => {
  const { token, tokenHash } = createInviteToken()
  assert.notEqual(token, tokenHash)
  assert.ok(token.length > 10)
  assert.ok(tokenHash.length > 10)
})

// ─── getInviteStatus ─────────────────────────────────────────────────────────

test('getInviteStatus: mustChangePassword false retorna ACTIVE', () => {
  const status = getInviteStatus({
    isActive: true,
    mustChangePassword: false,
    passwordResetExpiresAt: null,
  })
  assert.equal(status, 'ACTIVE')
})

test('getInviteStatus: mustChangePassword true com expiresAt futuro retorna INVITED', () => {
  const future = new Date(Date.now() + 1000 * 60 * 60 * 48)
  const status = getInviteStatus({
    isActive: true,
    mustChangePassword: true,
    passwordResetExpiresAt: future,
  })
  assert.equal(status, 'INVITED')
})

test('getInviteStatus: mustChangePassword true com expiresAt passado retorna EXPIRED', () => {
  const past = new Date(Date.now() - 1000 * 60 * 60 * 24)
  const status = getInviteStatus({
    isActive: true,
    mustChangePassword: true,
    passwordResetExpiresAt: past,
  })
  assert.equal(status, 'EXPIRED')
})

test('getInviteStatus: mustChangePassword true sem expiresAt retorna EXPIRED', () => {
  const status = getInviteStatus({
    isActive: true,
    mustChangePassword: true,
    passwordResetExpiresAt: null,
  })
  assert.equal(status, 'EXPIRED')
})
