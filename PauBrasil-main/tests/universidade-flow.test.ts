import assert from 'node:assert/strict'
import test, { describe, it } from 'node:test'
import { IntegrationSession } from './support/integration-base'

describe('Fluxo da Universidade PB', () => {
  const session = new IntegrationSession('Universidade')
  const ADMIN_EMAIL = 'admin@grupopaubrasil.com.br'
  const ADMIN_PASS  = 'Admin@2026!'

  it('deve fazer login com sucesso', async () => {
    const loggedIn = await session.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.strictEqual(loggedIn, true, 'Login falhou')
  })

  it('deve listar temporadas da universidade', async () => {
    const res = await session.get('/api/universidade/temporadas')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body), 'Temporadas deve ser um array')
  })

  it('deve carregar certificados do usuário', async () => {
    const res = await session.get('/api/universidade/certificados')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body.certificados), 'Certificados deve conter um array')
  })

  it('deve listar temporadas administrativas (UPB Admin)', async () => {
    const res = await session.get('/api/admin/upb/temporadas')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body), 'Temporadas admin deve ser um array')
  })

  it('deve carregar relatório administrativo (UPB Admin)', async () => {
    const res = await session.get('/api/admin/upb/relatorio')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.kpis, 'Relatório UPB deve conter estatísticas (kpis)')
  })
})
