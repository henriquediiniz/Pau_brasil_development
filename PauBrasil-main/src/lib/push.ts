import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

let vapidReady = false

function ensureVapid(): boolean {
  if (vapidReady) return true
  const { VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
  if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidReady = true
  return true
}

export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return

  const data = JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192.png' })

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        data,
      ).catch(async err => {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { userId, endpoint: sub.endpoint } })
        }
      }),
    ),
  )
}
