import assert from 'node:assert/strict'
import test, { describe, it } from 'node:test'
import { IntegrationSession } from './support/integration-base'

describe('Fluxo do Gestor (Página Dashboard/Aprovações)', () => {
  const session = new IntegrationSession('Gestor')
  const ADMIN_EMAIL = 'admin@grupopaubrasil.com.br'
  const ADMIN_PASS  = 'Admin@2026!'

  it('deve fazer login com sucesso', async () => {
    const loggedIn = await session.login(ADMIN_EMAIL, ADMIN_PASS)
    assert.strictEqual(loggedIn, true, 'Login falhou')
  })

  it('deve carregar o dashboard do gestor', async () => {
    const res = await session.get('/api/gestor/dashboard')
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.stats, 'Dashboard deve conter estatísticas')
  })

  it('deve listar aprovações pendentes', async () => {
    const res = await session.get('/api/gestor/aprovacoes')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body), 'Aprovações deve ser um array')
  })

  it('deve permitir aprovar uma tarefa (fluxo completo)', async () => {
    // 1. Criar uma tarefa como colaborador (usando a mesma sessão admin)
    const adhocRes = await session.post('/api/tasks/adhoc', {
      adHocTitle: 'Teste Gestor - Atividade para Aprovar',
      requestedPoints: 100
    })
    const taskId = adhocRes.body.id
    assert.ok(taskId)

    // 2. Concluir a tarefa (colaborador)
    await session.post(`/api/tasks/${taskId}/complete`, {})

    // 3. Aprovar a tarefa (gestor)
    const approveRes = await session.post(`/api/tasks/${taskId}/review`, {
      action: 'approve',
      approvedPoints: 100
    })
    assert.strictEqual(approveRes.status, 200)
  })

  it('deve carregar o relatório da equipe', async () => {
    // Pegar o ID do usuário da sessão
    const sessRes = await session.get('/api/auth/session')
    const userId = sessRes.body.user.id
    
    const res = await session.get(`/api/relatorio/${userId}`)
    assert.strictEqual(res.status, 200)
    assert.ok(res.body.usuario, 'Relatório deve conter dados do usuário')
  })

  it('deve listar auditoria de logs', async () => {
    const res = await session.get('/api/admin/auditoria')
    assert.strictEqual(res.status, 200)
    assert.ok(Array.isArray(res.body.logs), 'Auditoria deve conter array de logs')
  })
})
