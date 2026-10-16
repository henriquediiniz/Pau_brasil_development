import assert from 'node:assert/strict'
import test, { describe, it } from 'node:test'
import { IntegrationSession } from './support/integration-base'

describe('Fluxo do Colaborador (Página Hoje)', () => {
  const session = new IntegrationSession('Colaborador')
  const ADMIN_EMAIL = 'admin@grupopaubrasil.com.br'
  const ADMIN_PASS  = 'Admin@2026!'

  it('deve fazer login com sucesso', async () => {
    const loggedIn = await session.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.strictEqual(loggedIn, true, 'Login falhou')
  })

  it('deve carregar o checklist de hoje', async () => {
    const res = await session.get('/api/checklist')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body), 'Checklist deve ser um array')
  })

  it('deve carregar o saldo de pontos', async () => {
    const res = await session.get('/api/pontos')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.balance)
    assert.ok(typeof res.body.balance.confirmed === 'number')
  })

  it('deve criar uma atividade avulsa (ad-hoc)', async () => {
    const res = await session.post('/api/tasks/adhoc', {
      adHocTitle: 'Teste Automatizado - Atividade Avulsa',
      adHocDesc: 'Descrição do teste de integração',
      requestedPoints: 50
    })
    assert.strictEqual(res.status, 201)
    assert.ok(res.body.id, 'Deve retornar o ID da tarefa criada')
    
    // Guardar o ID para o próximo teste
    const taskId = res.body.id
    
    // Concluir a tarefa criada
    const completeRes = await session.post(`/api/tasks/${taskId}/complete`, {})
    assert.strictEqual(completeRes.status, 200)
    assert.strictEqual(completeRes.body.success, true)
  })

  it('deve carregar a agenda/em breve', async () => {
    const res = await session.get('/api/agenda')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.minhas, 'Deve ter a lista de minhas atividades')
  })

  it('deve carregar o feed de eventos', async () => {
    const res = await session.get('/api/feed')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body), 'Feed deve ser um array')
  })

  it('deve carregar a meta global', async () => {
    const res = await session.get('/api/global-goal')
    assert.strictEqual(res.status, 200)
    // Pode não haver meta ativa, mas a rota deve responder
  })
})
