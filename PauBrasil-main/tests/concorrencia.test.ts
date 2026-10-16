import assert from 'node:assert/strict'
import { describe, it, before } from 'node:test'
import { IntegrationSession } from './support/integration-base'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Testes de Concorrência e Integridade de Pontos', () => {
  const sessionGestor = new IntegrationSession('Gestor Concorrente')
  const sessionUser   = new IntegrationSession('User Concorrente')

  before(async () => {
    await sessionGestor.login('gestor@grupopaubrasil.com.br', 'Gestor@2026!')
    await sessionUser.login('joao@grupopaubrasil.com.br', 'User@2026!')
  })

  it('Não deve duplicar pontos ao aprovar tarefa ad-hoc simultaneamente (Race Condition)', async () => {
    // 1. Criar tarefa ad-hoc
    const adhoc = await sessionUser.post('/api/tasks/adhoc', {
      adHocTitle: 'Stress Test AdHoc',
      requestedPoints: 100
    })
    const taskId = adhoc.body.id
    assert.ok(taskId)

    // 2. Concluir a tarefa
    await sessionUser.post(`/api/tasks/${taskId}/complete`, {})

    // 3. Disparar 10 aprovações simultâneas
    console.log('Disparando 10 requisições de aprovação simultâneas...')
    const approvals = Array.from({ length: 10 }).map(() => 
      sessionGestor.post(`/api/tasks/${taskId}/review`, {
        action: 'approve',
        approvedPoints: 100
      })
    )

    const results = await Promise.all(approvals)
    
    const successes = results.filter(r => r.status === 200).length
    console.log(`Sucessos na aprovação: ${successes}/10`)

    // 4. Verificar duplicidade no Ledger
    const ledgerEntries = await prisma.pointsLedger.count({
      where: { refType: 'TaskInstance', refId: taskId }
    })

    assert.strictEqual(ledgerEntries, 1, `ERRO: Encontradas ${ledgerEntries} entradas de pontos para a mesma tarefa!`)
  })

  it('Não deve duplicar pontos ao concluir tarefa regular simultaneamente', async () => {
    // 1. Pegar uma tarefa regular PENDING
    const user = await prisma.user.findUnique({ where: { email: 'joao@grupopaubrasil.com.br' } })
    const instance = await prisma.taskInstance.findFirst({
      where: { userId: user?.id, status: 'PENDING', isAdHoc: false },
      include: { taskDefinition: true }
    })

    if (!instance) {
      console.warn('Pulando teste: nenhuma tarefa regular PENDING encontrada para o usuário.')
      return
    }

    // 2. Disparar 10 conclusões simultâneas
    console.log(`Disparando 10 requisições de conclusão simultâneas para tarefa ${instance.id}...`)
    const completions = Array.from({ length: 10 }).map(() => 
      sessionUser.post(`/api/tasks/${instance.id}/complete`, {
        note: 'Stress Test Regular'
      })
    )

    const results = await Promise.all(completions)
    const successes = results.filter(r => r.status === 200).length
    console.log(`Sucessos na conclusão: ${successes}/10`)

    // 3. Verificar duplicidade no Ledger
    const ledgerEntries = await prisma.pointsLedger.count({
      where: { refType: 'TaskInstance', refId: instance.id }
    })

    // Se falhar aqui, confirmamos a vulnerabilidade
    assert.strictEqual(ledgerEntries, 1, `ERRO: Encontradas ${ledgerEntries} entradas de pontos para a mesma tarefa regular!`)
  })
})
