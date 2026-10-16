import assert from 'node:assert/strict'
import test from 'node:test'
import { getFeedPayload } from '../src/lib/feed-api'

test('401 - sem sessao', async () => {
  const result = await getFeedPayload(null, {
    findFeedEvents: async () => [],
  })

  assert.equal(result.status, 401)
  assert.deepEqual(result.body, { error: 'Unauthorized' })
})

test('200 - retorna eventos do feed publico', async () => {
  const events = [
    {
      id: 'evt1',
      type: 'LEVEL_UP',
      message: 'Joao subiu de nivel',
      createdAt: new Date('2026-04-17T10:00:00Z'),
      user: { id: 'user1', name: 'Joao', photoUrl: null },
    },
  ]

  const result = await getFeedPayload({ user: { id: 'user1' } }, {
    findFeedEvents: async () => events,
  })

  assert.equal(result.status, 200)
  assert.equal(Array.isArray(result.body), true)
  assert.deepEqual(result.body, events)
})

test('limita a 20 eventos mais recentes via dependencia da rota', async () => {
  let calls = 0
  const events = Array.from({ length: 20 }, (_, index) => ({
    id: `evt-${index}`,
    type: 'TEST',
    message: `evento ${index}`,
    createdAt: new Date(`2026-04-${String(index + 1).padStart(2, '0')}T10:00:00Z`),
    user: { id: 'user1', name: 'Joao', photoUrl: null },
  }))

  const result = await getFeedPayload({ user: { id: 'user1' } }, {
    findFeedEvents: async () => {
      calls++
      return events
    },
  })

  assert.equal(result.status, 200)
  assert.equal(calls, 1)
  assert.equal((result.body as typeof events).length, 20)
})

test('inclui dados do usuario em cada evento', async () => {
  const result = await getFeedPayload({ user: { id: 'user1' } }, {
    findFeedEvents: async () => [
      {
        id: 'evt1',
        type: 'GOAL_REACHED',
        message: 'Meta batida',
        createdAt: new Date(),
        user: { id: 'user1', name: 'Maria', photoUrl: '/foto.png' },
      },
    ],
  })

  assert.equal(result.status, 200)
  const [first] = result.body as any[]
  assert.deepEqual(first.user, { id: 'user1', name: 'Maria', photoUrl: '/foto.png' })
})

test('500 - tratamento de erro interno', async () => {
  const result = await getFeedPayload({ user: { id: 'user1' } }, {
    findFeedEvents: async () => {
      throw new Error('db down')
    },
  })

  assert.equal(result.status, 500)
  assert.deepEqual(result.body, { error: 'Erro ao buscar feed' })
})

test('resposta tem estrutura correta', async () => {
  const result = await getFeedPayload({ user: { id: 'user1' } }, {
    findFeedEvents: async () => [
      {
        id: 'evt1',
        type: 'LEVEL_UP',
        message: 'subiu',
        createdAt: new Date(),
        user: { id: 'user1', name: 'Ana', photoUrl: null },
      },
    ],
  })

  const [first] = result.body as any[]
  assert.equal(typeof first.id, 'string')
  assert.equal(typeof first.type, 'string')
  assert.equal(typeof first.message, 'string')
  assert.equal(typeof first.user.id, 'string')
})
