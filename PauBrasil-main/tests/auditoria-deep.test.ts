import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession } from './support/integration-base'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Testes de Auditoria Profunda e Rastreabilidade', () => {
  const sessionUser = new IntegrationSession('User Auditoria')
  
  before(async () => {
    // Garantir que estamos logados para testes de acesso negado
    await sessionUser.login('joao@grupopaubrasil.com.br', 'User@2026!')
  })

  it('Deve registrar log de falha de login (SECURITY_LOGIN_FAILURE)', async () => {
    // 1. Tentar login com senha errada
    const tempSession = new IntegrationSession('Fail Session')
    await tempSession.login('joao@grupopaubrasil.com.br', 'SenhaErrada123!')
    
    // 2. Verificar se o log foi criado
    const log = await prisma.auditLog.findFirst({
      where: {
        action: 'SECURITY_LOGIN_FAILURE',
        actorName: 'João Silva (A)'
      },
      orderBy: { createdAt: 'desc' }
    })

    assert.ok(log, 'Log de falha de login não encontrado!')
    assert.strictEqual(log.action, 'SECURITY_LOGIN_FAILURE')
    // @ts-ignore
    assert.strictEqual(log.meta?.reason, 'Senha incorreta')
  })

  it('Deve registrar log de acesso negado (SECURITY_ACCESS_DENIED)', async () => {
    // 1. Tentar acessar rota admin com usuário comum
    const res = await sessionUser.get('/api/admin/auditoria')
    assert.strictEqual(res.status, 403)

    // 2. Verificar log
    const log = await prisma.auditLog.findFirst({
      where: {
        action: 'SECURITY_ACCESS_DENIED',
        actorName: 'João Silva (A)',
        targetId: 'admin/auditoria'
      },
      orderBy: { createdAt: 'desc' }
    })

    assert.ok(log, 'Log de acesso negado não encontrado!')
    assert.strictEqual(log.action, 'SECURITY_ACCESS_DENIED')
  })

  it('Deve registrar log de ações administrativas (TASK_APPROVED)', async () => {
    const sessionGestor = new IntegrationSession('Gestor Auditoria')
    await sessionGestor.login('gestor@grupopaubrasil.com.br', 'Gestor@2026!')

    // 1. Criar e completar tarefa para ter algo para aprovar
    const adhoc = await sessionUser.post('/api/tasks/adhoc', { adHocTitle: 'Teste Auditoria' })
    const taskId = adhoc.body.id
    await sessionUser.post(`/api/tasks/${taskId}/complete`, {})

    // 2. Aprovar
    await sessionGestor.post(`/api/tasks/${taskId}/review`, { action: 'approve', approvedPoints: 10 })

    // 3. Verificar log
    const log = await prisma.auditLog.findFirst({
      where: { 
        action: 'TASK_APPROVED',
        targetId: taskId
      },
      orderBy: { createdAt: 'desc' }
    })

    assert.ok(log, 'Log de aprovação não encontrado!')
    assert.strictEqual(log.actorName, 'Carlos Gestor (A)')
  })
})
