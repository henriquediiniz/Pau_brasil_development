import { prisma } from './prisma'
import { sendEmail } from './email'
import { sendPush } from './push'

/**
 * Cria uma notificacao in-app e, opcionalmente, envia e-mail e push notification.
 */
export async function notify(
  userId: string,
  title: string,
  description?: string,
  email?: { subject: string; html: string },
  pushUrl?: string,
) {
  let user: { email: string | null } | null = null

  try {
    user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  } catch {
    console.error('[notify] failed to fetch user before notification', { userId, title })
  }

  if (!user) return

  await Promise.allSettled([
    prisma.notification.create({ data: { userId, title, description } })
      .catch(() => console.error('[notify] failed to create notification', { userId, title })),

    email && user.email
      ? sendEmail(user.email, email.subject, email.html)
          .catch(() => console.error('[notify] failed to send email for', userId))
      : Promise.resolve(),

    sendPush(userId, { title, body: description ?? title, url: pushUrl })
      .catch(() => {}),
  ])
}
