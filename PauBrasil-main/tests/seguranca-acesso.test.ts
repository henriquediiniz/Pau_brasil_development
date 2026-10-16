import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession } from './support/integration-base'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Segurança e Isolamento de Dados (Invasão Lateral)', () => {
  const sessionGestorA = new IntegrationSession('Gestor A (Pau Brasil)')
  const sessionUserA   = new IntegrationSession('User A (Pau Brasil)')
  const sessionGestorB = new IntegrationSession('Gestor B (Outra Empresa)')
  const sessionUserB   = new IntegrationSession('User B (Outra Empresa)')

  let idUserA: string
  let idUserB: string

  before(async () => {
    // Garantir que os IDs estão sincronizados
    const uA = await prisma.user.findUnique({ where: { email: 'joao@grupopaubrasil.com.br' } })
    const uB = await prisma.user.findUnique({ where: { email: 'maria@grupopaubrasil.com.br' } })
    if (!uA || !uB) throw new Error('Usuários de teste não encontrados no banco. Rode o seed.')
    idUserA = uA.id
    idUserB = uB.id

    // Login das sessões
    const L1 = await sessionGestorA.login('gestor@grupopaubrasil.com.br', 'Gestor@2026!')
    const L2 = await sessionUserA.login('joao@grupopaubrasil.com.br', 'User@2026!')
    const L3 = await sessionGestorB.login('gestorb@grupopaubrasil.com.br', 'Gestor@2026!')
    const L4 = await sessionUserB.login('maria@grupopaubrasil.com.br', 'User@2026!')

    if (!L1 || !L2 || !L3 || !L4) {
      console.error('Falha de login nas sessões de segurança:', { L1, L2, L3, L4 })
      throw new Error('Falha na autenticação de um ou mais usuários de teste')
    }
  })

  it('Gestor A não deve conseguir ver relatório de User B (empresa diferente)', async () => {
    const res = await sessionGestorA.get(`/api/relatorio/${idUserB}`)
    assert.strictEqual(res.status, 403, 'Gestor A acessou relatório de outra empresa')
  })

  it('Gestor B não deve conseguir aprovar tarefa de User A (hierarquia diferente)', async () => {
    // 1. User A cria uma tarefa
    const adhoc = await sessionUserA.post('/api/tasks/adhoc', {
      adHocTitle: 'Tarefa Secreta A',
      requestedPoints: 50
    })
    const taskId = adhoc.body.id
    assert.ok(taskId)

    // 2. User A conclui a tarefa
    await sessionUserA.post(`/api/tasks/${taskId}/complete`, {})

    // 3. Gestor B tenta aprovar
    const approveAttempt = await sessionGestorB.post(`/api/tasks/${taskId}/review`, {
      action: 'approve'
    })
    assert.strictEqual(approveAttempt.status, 403, 'Gestor B aprovou tarefa que não gerencia')
  })

  it('User A não deve conseguir completar tarefa de User B', async () => {
    // 1. User B cria uma tarefa
    const adhoc = await sessionUserB.post('/api/tasks/adhoc', {
      adHocTitle: 'Tarefa Privada B',
      requestedPoints: 20
    })
    const taskId = adhoc.body.id
    assert.ok(taskId)

    // 2. User A tenta concluir
    const completeAttempt = await sessionUserA.post(`/api/tasks/${taskId}/complete`, {})
    // O sistema deve retornar 404 ou 403 dependendo de como a query é feita
    assert.ok([403, 404].includes(completeAttempt.status), `User A completou tarefa de User B (status: ${completeAttempt.status})`)
  })

  it('Usuário comum (USER) não deve acessar auditoria de sistema', async () => {
    const res = await sessionUserA.get('/api/admin/auditoria')
    assert.strictEqual(res.status, 403, 'Usuário comum acessou log de auditoria')
  })

  it('Gestor A não deve listar aprovações de subordinados do Gestor B', async () => {
    // 1. User B deixa uma tarefa pronta para aprovação
    const adhoc = await sessionUserB.post('/api/tasks/adhoc', { adHocTitle: 'Pendente B', requestedPoints: 10 })
    await sessionUserB.post(`/api/tasks/${adhoc.body.id}/complete`, {})

    // 2. Gestor A lista aprovações
    const res = await sessionGestorA.get('/api/gestor/aprovacoes')
    assert.strictEqual(res.status, 200)
    const taskIds = res.body.map((t: any) => t.id)
    assert.strictEqual(taskIds.includes(adhoc.body.id), false, 'Gestor A viu tarefa pendente da Empresa B')
  })
})
