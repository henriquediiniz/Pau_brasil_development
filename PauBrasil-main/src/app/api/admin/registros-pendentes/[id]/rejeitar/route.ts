import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isRhAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { z, mensagemDeValidacao } from '@/lib/zod'

export const dynamic = 'force-dynamic'

const rejeitarSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const POST = withHandler(async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = rejeitarSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const reg = await prisma.pendingRegistration.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, email: true, name: true },
  })
  if (!reg) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
  if (reg.status !== 'PENDING') return NextResponse.json({ error: 'Registro não está pendente' }, { status: 409 })

  await prisma.pendingRegistration.update({
    where: { id: params.id },
    data: {
      status: 'REJECTED',
      rejectedReason: parsed.data.reason ?? null,
      reviewedById: actor.id,
      reviewedAt: new Date(),
    },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'USER_REGISTRATION_REJECTED',
    targetType: 'PendingRegistration',
    targetId: params.id,
    meta: { email: reg.email, name: reg.name, reason: parsed.data.reason ?? null },
  })

  return NextResponse.json({ ok: true })
})
