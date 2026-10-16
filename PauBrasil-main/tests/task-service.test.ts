import assert from 'node:assert/strict'
import { describe, it, beforeEach, mock } from 'node:test'
import { TaskService } from '../src/services/TaskService'

// ── Mocks de Usuários para simular as permissões ──
const mockSysAdmin = () => ({ id: 'admin1', name: 'Admin', role: 'SYS_ADMIN', nivel: 'DIRETORIA' } as any)
const mockCoord = () => ({ id: 'coord1', name: 'Coord', role: 'USER', nivel: 'COORDENADOR' } as any)
const mockUser = () => ({ id: 'user1', name: 'User', role: 'USER', nivel: 'COLABORADOR' } as any)

describe('TaskService — World-Class Unit Suite', () => {
  let mockDb: any
  let service: TaskService

  beforeEach(() => {
    // Mocking Prisma Engine
    mockDb = {
      taskInstance: {
        findUnique: mock.fn(),
        update: mock.fn(),
        count: mock.fn(),
        updateMany: mock.fn(),
        createMany: mock.fn(),
      },
      pointsLedger: {
        create: mock.fn(),
        updateMany: mock.fn(),
        deleteMany: mock.fn(),
      },
      user: {
        findUnique: mock.fn(),
        findMany: mock.fn(),
      },
      $transaction: mock.fn(async (arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg)
        return arg(mockDb) // handler para transações interativas
      })
    }
    service = new TaskService(mockDb)
  })

  describe('reviewTask() — Processamento de Aprovações', () => {
    it('Deve rejeitar imediatamente se o aprovador não tiver permissão de gestão', async () => {
      await assert.rejects(
        service.reviewTask('task1', mockUser(), 'approve'),
        /Permissão insuficiente/
      )
    })

    it('Deve rejeitar se a tarefa não for encontrada ou não estiver pendente de revisão (DONE)', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => null)
      await assert.rejects(
        service.reviewTask('task1', mockSysAdmin(), 'approve'),
        /Tarefa não encontrada/
      )
    })

    it('Coordenador NÃO pode aprovar tarefa de colaborador fora da sua hierarquia direta', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', status: 'DONE',
        user: { id: 'user2', managerId: 'outro_coordenador' } // Hierarquia diferente
      }))

      await assert.rejects(
        service.reviewTask('task1', mockCoord(), 'approve'),
        /fora da sua hierarquia direta/
      )
    })

    it('Deve aprovar tarefa AdHoc e creditar pontos via transação atômica (Ledger + Status)', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', status: 'DONE', isAdHoc: true, requestedPoints: 50,
        user: { id: 'user1', name: 'User', managerId: 'admin1' }
      }))

      const result = await service.reviewTask('task1', mockSysAdmin(), 'approve', { approvedPoints: 50 })

      assert.strictEqual(result.success, true)
      assert.strictEqual(mockDb.$transaction.mock.calls.length, 1)
      assert.strictEqual(mockDb.taskInstance.update.mock.calls.length, 1)
      assert.strictEqual(mockDb.pointsLedger.create.mock.calls.length, 1)
    })
  })

  describe('completeTask() — Motor de Conclusão e Regras de Negócio', () => {
    it('Deve impedir conclusão de tarefa que não pertence ao usuário logado', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user_intruder'
      }))

      await assert.rejects(
        service.completeTask('task1', 'user1', 'User'),
        /Tarefa não encontrada/
      )
    })

    it('Deve bloquear conclusão de tarefas encadeadas que ainda estão com status BLOCKED', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user1', status: 'BLOCKED'
      }))

      await assert.rejects(
        service.completeTask('task1', 'user1', 'User'),
        /aguardando outra ser concluída/
      )
    })

    it('Deve registrar atividade AdHoc e solicitar aprovação da liderança sem dar pontos instantâneos', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user1', status: 'PENDING', isAdHoc: true, adHocTitle: 'Hora Extra'
      }))
      mockDb.user.findUnique.mock.mockImplementationOnce(async () => ({ managerId: 'manager1', name: 'User' }))

      const result = await service.completeTask('task1', 'user1', 'User')

      assert.strictEqual(result.isAdHoc, true)
      assert.strictEqual(mockDb.taskInstance.update.mock.calls.length, 1)
      // AdHocs não podem gerar pontos no completamento, apenas na revisão!
      assert.strictEqual(mockDb.pointsLedger.create.mock.calls.length, 0)
    })

    it('Deve impedir conclusão regular de tarefa caso o Limite Diário (dailyLimit) tenha sido atingido', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user1', status: 'PENDING', isAdHoc: false, date: new Date(),
        taskDefinition: { id: 'def1', title: 'Task Regular', dailyLimit: 2 }
      }))
      
      // Simula que a query de contagem retornou que o usuário já fez 2 vezes hoje
      mockDb.taskInstance.count.mock.mockImplementationOnce(async () => 2)

      await assert.rejects(
        service.completeTask('task1', 'user1', 'User'),
        /Limite diário de 2 conclusão.*ATINGIDO/
      )
    })

    it('Deve reverter e exigir evidência fotográfica/link se a definição da tarefa obrigar', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user1', status: 'PENDING', isAdHoc: false, date: new Date(),
        taskDefinition: { id: 'def1', requireEvidence: true, dailyLimit: 5 }
      }))
      mockDb.taskInstance.count.mock.mockImplementationOnce(async () => 0)

      await assert.rejects(
        service.completeTask('task1', 'user1', 'User'), // Enviando sem evidência
        /Evidência obrigatória/
      )
    })

    it('Deve completar tarefa regular, creditar os pontos na carteira e DESBLOQUEAR tarefas encadeadas', async () => {
      mockDb.taskInstance.findUnique.mock.mockImplementationOnce(async () => ({
        id: 'task1', userId: 'user1', status: 'PENDING', isAdHoc: false, date: new Date(),
        taskDefinition: { 
          id: 'def1', requireEvidence: false, dailyLimit: 5, points: 10,
          nextTaskDefinition: {
            id: 'def2', title: 'Next Task',
            function: { users: [{ id: 'user2' }] }
          }
        }
      }))
      mockDb.taskInstance.count.mock.mockImplementationOnce(async () => 0)
      mockDb.taskInstance.updateMany.mock.mockImplementationOnce(async () => ({ count: 1 })) // Simula o desbloqueio

      const result = await service.completeTask('task1', 'user1', 'User')

      assert.strictEqual(result.success, true)
      assert.strictEqual(result.pointsAwarded, 10) // Pontos validados
      assert.strictEqual(mockDb.taskInstance.updateMany.mock.calls.length, 1) // Encadeamento (Chaining) funcionou
    })
  })
})