import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { StoreService } from '@/services/StoreService'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') ?? 'REQUESTED'

  const orders = await prisma.redemptionOrder.findMany({
    where: status === 'ALL' ? {} : { status: status as any },
    include: {
      user: { select: { id: true, name: true, email: true, units: true } },
      product: { select: { id: true, title: true, emoji: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(orders)
}

const patchSchema = z.object({
  action: z.enum(['approve', 'deliver', 'cancel']),
  note: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const actorId = actor.id
  const actorName = actor.name ?? 'Admin'
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orderId = req.nextUrl.searchParams.get('id')
  if (!orderId) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const storeService = new StoreService()
    const result = await storeService.updateOrderStatus(orderId, parsed.data.action, actorId, actorName)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro ao atualizar pedido' }, { status: err.status ?? 500 })
  }
}
