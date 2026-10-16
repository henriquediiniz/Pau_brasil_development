import assert from 'node:assert/strict'
import test from 'node:test'
import { getNotificationsPayload, markNotificationsReadPayload } from '../src/lib/notifications-api'

test('GET /api/notifications - 401 sem sessao', async () => {
  const result = await getNotificationsPayload(null, {
    findNotifications: async () => [],
    countUnread: async () => 0,
  })

  assert.equal(result.status, 401)
  assert.deepEqual(result.body, { error: 'Unauthorized' })
})

test('GET /api/notifications - retorna notificacoes do usuario logado', async () => {
  const notifications = [
    { id: 'n1', userId: 'user1', title: 'Titulo', description: 'Desc', read: false, createdAt: new Date() },
  ]

  const result = await getNotificationsPayload({ user: { id: 'user1' } }, {
    findNotifications: async (userId) => {
      assert.equal(userId, 'user1')
      return notifications
    },
    countUnread: async () => 1,
  })

  assert.equal(result.status, 200)
  assert.deepEqual((result.body as any).notifications, notifications)
  assert.equal((result.body as any).unreadCount, 1)
})

test('GET /api/notifications - limita a 30 notificacoes mais recentes via dependencia da rota', async () => {
  const notifications = Array.from({ length: 30 }, (_, index) => ({
    id: `n${index}`,
    userId: 'user1',
    title: `Titulo ${index}`,
    description: null,
    read: index > 0,
    createdAt: new Date(),
  }))

  const result = await getNotificationsPayload({ user: { id: 'user1' } }, {
    findNotifications: async () => notifications,
    countUnread: async () => 1,
  })

  assert.equal((result.body as any).notifications.length, 30)
})

test('GET /api/notifications - conta corretamente notificacoes nao lidas', async () => {
  const result = await getNotificationsPayload({ user: { id: 'user1' } }, {
    findNotifications: async () => [],
    countUnread: async () => 7,
  })

  assert.equal((result.body as any).unreadCount, 7)
})

test('GET /api/notifications - resposta tem estrutura correta', async () => {
  const result = await getNotificationsPayload({ user: { id: 'user1' } }, {
    findNotifications: async () => [
      { id: 'n1', userId: 'user1', title: 'Titulo', description: null, read: true, createdAt: new Date() },
    ],
    countUnread: async () => 0,
  })

  const body = result.body as any
  assert.equal(Array.isArray(body.notifications), true)
  assert.equal(typeof body.unreadCount, 'number')
  assert.equal(typeof body.notifications[0].title, 'string')
})

test('PATCH /api/notifications - 401 sem sessao', async () => {
  const result = await markNotificationsReadPayload(null, {
    markAllRead: async () => undefined,
  })

  assert.equal(result.status, 401)
  assert.deepEqual(result.body, { error: 'Unauthorized' })
})

test('PATCH /api/notifications - marca todas notificacoes como lidas', async () => {
  let calledWith = ''

  const result = await markNotificationsReadPayload({ user: { id: 'user1' } }, {
    markAllRead: async (userId) => {
      calledWith = userId
    },
  })

  assert.equal(result.status, 200)
  assert.equal(calledWith, 'user1')
  assert.deepEqual(result.body, { ok: true })
})

test('PATCH /api/notifications - nao afeta notificacoes de outros usuarios', async () => {
  const updatedUsers: string[] = []

  await markNotificationsReadPayload({ user: { id: 'user1' } }, {
    markAllRead: async (userId) => {
      updatedUsers.push(userId)
    },
  })

  assert.deepEqual(updatedUsers, ['user1'])
})

test('PATCH /api/notifications - retorna confirmacao de sucesso', async () => {
  const result = await markNotificationsReadPayload({ user: { id: 'user1' } }, {
    markAllRead: async () => undefined,
  })

  assert.deepEqual(result.body, { ok: true })
})
