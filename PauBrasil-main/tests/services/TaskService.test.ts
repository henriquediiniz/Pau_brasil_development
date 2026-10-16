import assert from 'node:assert/strict'
import test from 'node:test'
import { TaskService } from '../../src/services/TaskService'

// Mock minimal do Prisma para testes de lógica
const mockPrisma: any = {
  async $transaction(cb: any) { return cb(this) },
  taskInstance: {
    findUnique: async () => null,
    update: async (args: any) => args.data,
  },
  audit: {
    create: async () => ({}),
  },
  pointsLedger: {
    create: async () => ({}),
  }
}

test('TaskService: deve lançar erro se tarefa não existe ao completar', async () => {
  const service = new TaskService(mockPrisma)
  
  await assert.rejects(
    service.completeTask('invalid-id', 'user-1', 'Test User'),
    /Tarefa não encontrada/
  )
})

test('TaskService: não deve pontuar se a tarefa estiver atrasada', async () => {
  // Simula tarefa de ontem
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  
  const mockTask = {
    id: 't1',
    status: 'PENDING',
    date: ontem,
    userId: 'u1',
    taskDefinition: { points: 100, requireApproval: false, dailyLimit: 10 }
  }

  const localPrisma: any = {
    ...mockPrisma,
    taskInstance: {
      findUnique: async () => mockTask,
      update: async () => ({ ...mockTask, status: 'DONE', isLate: true }),
      count: async () => 0
    },
    user: {
      findUnique: async () => ({ id: 'u1', managerId: null })
    }
  }

  const service = new TaskService(localPrisma)
  const result = await service.completeTask('t1', 'u1', 'Test User') as any
  
  assert.equal(result.isLate, true)
  assert.equal(result.pointsAwarded, 0)
})

test('TaskService: deve exigir aprovação se definido na tarefa', async () => {
  const mockTask = {
    id: 't2',
    status: 'PENDING',
    date: new Date(),
    userId: 'u1',
    taskDefinition: { points: 100, requireApproval: true, dailyLimit: 10 }
  }

  const localPrisma: any = {
    ...mockPrisma,
    taskInstance: {
      findUnique: async () => mockTask,
      update: async () => ({ ...mockTask, status: 'DONE' }),
      count: async () => 0
    },
    user: {
      findUnique: async () => ({ id: 'u1', managerId: null })
    }
  }

  const service = new TaskService(localPrisma)
  const result = await service.completeTask('t2', 'u1', 'Test User')
  
  assert.equal(result.requiresApproval, true)
})
