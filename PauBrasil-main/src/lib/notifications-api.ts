export interface NotificationsSession {
  user?: { id: string } | null
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  description?: string | null
  read: boolean
  createdAt: Date | string
}

export async function getNotificationsPayload(
  session: NotificationsSession | null,
  deps: {
    findNotifications: (userId: string) => Promise<NotificationItem[]>
    countUnread: (userId: string) => Promise<number>
  },
) {
  if (!session?.user) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  const userId = session.user.id
  const [notifications, unreadCount] = await Promise.all([
    deps.findNotifications(userId),
    deps.countUnread(userId),
  ])

  return { status: 200, body: { notifications, unreadCount } }
}

export async function markNotificationsReadPayload(
  session: NotificationsSession | null,
  deps: {
    markAllRead: (userId: string) => Promise<void>
  },
) {
  if (!session?.user) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  await deps.markAllRead(session.user.id)
  return { status: 200, body: { ok: true } }
}
