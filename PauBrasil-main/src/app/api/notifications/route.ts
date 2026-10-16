import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNotificationsPayload, markNotificationsReadPayload } from '@/lib/notifications-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const result = await getNotificationsPayload(session, {
    findNotifications: (userId) =>
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    countUnread: (userId) => prisma.notification.count({ where: { userId, read: false } }),
  })

  return NextResponse.json(result.body, { status: result.status })
}

// Mark all as read
export async function PATCH() {
  const session = await getServerSession(authOptions)
  const result = await markNotificationsReadPayload(session, {
    markAllRead: async (userId) => {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
    },
  })

  return NextResponse.json(result.body, { status: result.status })
}
