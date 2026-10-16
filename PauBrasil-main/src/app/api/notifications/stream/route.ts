import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return new Response('Unauthorized', { status: 401 })
  const userId = session.user.id

  const encoder = new TextEncoder()
  let lastCheck = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // Initial data
      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        prisma.notification.count({ where: { userId, read: false } }),
      ])
      send({ notifications, unreadCount })

      // Poll DB every 8s for new notifications
      const interval = setInterval(async () => {
        try {
          const since = lastCheck
          lastCheck = new Date()
          const newNotifs = await prisma.notification.findMany({
            where: { userId, createdAt: { gt: since } },
            orderBy: { createdAt: 'desc' },
          })
          if (newNotifs.length > 0) {
            const count = await prisma.notification.count({ where: { userId, read: false } })
            send({ newNotifications: newNotifs, unreadCount: count })
          }
        } catch {
          clearInterval(interval)
          clearInterval(keepAlive)
          try { controller.close() } catch {}
        }
      }, 8000)

      // Keep-alive ping every 25s (prevents proxy timeout)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(keepAlive)
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearInterval(keepAlive)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
