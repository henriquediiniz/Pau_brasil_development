import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { isRhAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { buildSetupUrl, createInviteToken } from '@/lib/user-provisioning'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, isActive: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  if (!user.isActive) return NextResponse.json({ error: 'Conta inativa' }, { status: 400 })

  const invite = createInviteToken()

  await prisma.user.update({
    where: { id: params.id },
    data: {
      mustChangePassword: true,
      passwordResetTokenHash: invite.tokenHash,
      passwordResetExpiresAt: invite.expiresAt,
    },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'USER_INVITE_RESENT',
    targetType: 'User',
    targetId: params.id,
    meta: { targetName: user.name, email: user.email },
    ip: req.headers.get('x-forwarded-for') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ setupUrl: buildSetupUrl(req, invite.token) })
}
