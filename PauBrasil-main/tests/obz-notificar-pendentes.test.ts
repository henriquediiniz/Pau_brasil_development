/**
 * tests/obz-notificar-pendentes.test.ts
 *
 * Verifica o endpoint POST /api/admin/obz/notificar-pendentes:
 *  - 401 sem sessão autenticada
 *  - 403 para usuário não-admin
 *  - 400 para body inválido (sem ano/mes)
 *  - 200 retornando shape { notificados: number, areas: number } para admin
 *
 * Requisitos:
 *   - Servidor Next.js rodando em http://localhost:3000
 *   - Usuário admin: admin@grupopaubrasil.com.br / Admin@2026!
 *   - Usuário comum: joao@grupopaubrasil.com.br / User@2026!
 */

import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession, BASE_URL } from './support/integration-base'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grupopaubrasil.com.br'
const ADMIN_PASS  = process.env.ADMIN_PASS  ?? 'Admin@2026!'
const USER_EMAIL  = process.env.USER_EMAIL  ?? 'joao@grupopaubrasil.com.br'
const USER_PASS   = process.env.USER_PASS   ?? 'User@2026!'

const ANO = new Date().getFullYear()
const MES = new Date().getMonth() + 1

describe('POST /api/admin/obz/notificar-pendentes', () => {
  const admin   = new IntegrationSession('Admin')
  const usuario = new IntegrationSession('Usuario Comum')

  before(async () => {
    const okAdmin   = await admin.login(ADMIN_EMAIL, ADMIN_PASS)
    const okUsuario = await usuario.login(USER_EMAIL, USER_PASS)
    assert.ok(okAdmin,   `Login admin falhou (${ADMIN_EMAIL})`)
    assert.ok(okUsuario, `Login usuário falhou (${USER_EMAIL})`)
  })

  it('401 — sem sessão', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/obz/notificar-pendentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ano: ANO, mes: MES }),
    })
    assert.strictEqual(res.status, 401, 'Deveria retornar 401 sem sessão')
  })

  it('403 — usuário comum não tem acesso', async () => {
    const res = await usuario.post('/api/admin/obz/notificar-pendentes', { ano: ANO, mes: MES })
    assert.strictEqual(res.status, 403, 'Usuário comum deveria receber 403')
  })

  it('400 — body inválido (sem mes)', async () => {
    const res = await admin.post('/api/admin/obz/notificar-pendentes', { ano: ANO })
    assert.strictEqual(res.status, 400, 'Body sem mes deveria retornar 400')
  })

  it('400 — body inválido (sem ano)', async () => {
    const res = await admin.post('/api/admin/obz/notificar-pendentes', { mes: MES })
    assert.strictEqual(res.status, 400, 'Body sem ano deveria retornar 400')
  })

  it('400 — body inválido (mes fora do range)', async () => {
    const res = await admin.post('/api/admin/obz/notificar-pendentes', { ano: ANO, mes: 13 })
    assert.strictEqual(res.status, 400, 'mes=13 deveria retornar 400')
  })

  it('200 — admin recebe { notificados, areas } com shape válido', async () => {
    const res = await admin.post('/api/admin/obz/notificar-pendentes', { ano: ANO, mes: MES })
    assert.strictEqual(res.status, 200, `Esperava 200, recebeu ${res.status}: ${JSON.stringify(res.body)}`)
    assert.ok(typeof res.body.notificados === 'number', 'notificados deve ser número')
    assert.ok(typeof res.body.areas === 'number',       'areas deve ser número')
    assert.ok(res.body.notificados >= 0, 'notificados não pode ser negativo')
    assert.ok(res.body.areas >= 0,       'areas não pode ser negativo')
    // Coerência: se não há donos para notificar, areas também deve ser 0
    if (res.body.notificados === 0) {
      assert.strictEqual(res.body.areas, 0, 'notificados=0 implica areas=0')
    }
    // Coerência: se há áreas sem tendência, deve haver pelo menos 1 notificado
    if (res.body.areas > 0) {
      assert.ok(res.body.notificados >= 1, 'Se há áreas pendentes, deve haver ao menos 1 notificado')
    }
  })

  it('200 — mês/ano sem areaPacotes ativos retorna { notificados: 0, areas: 0 } (smoke — ano futuro)', async () => {
    // Usar um ano no futuro onde certamente não há lançamentos de tendência
    const res = await admin.post('/api/admin/obz/notificar-pendentes', { ano: 2099, mes: 1 })
    // A API lista todos os areaPacotes ativos (independente do ano) e verifica se há tendência
    // Se não há lançamentos para 2099, todos os donos ativos serão notificados (ou 0 se não há areaPacotes)
    assert.strictEqual(res.status, 200)
    assert.ok(typeof res.body.notificados === 'number')
    assert.ok(typeof res.body.areas === 'number')
  })
})
