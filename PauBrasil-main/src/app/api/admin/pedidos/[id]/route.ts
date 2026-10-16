import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { status } = await req.json()
  const validStatuses = ['APPROVED', 'DELIVERED', 'CANCELED']

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const order = await prisma.redemptionOrder.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  if (status === 'CANCELED' && order.status !== 'CANCELED') {
    // Reversal
    await prisma.$transaction([
      prisma.redemptionOrder.update({ where: { id: params.id }, data: { status } }),
      prisma.pointsLedger.create({
        data: {
          userId: order.userId,
          kind: 'REVERSAL',
          status: 'CONFIRMED',
          points: order.pointsCost,
          refType: 'RedemptionOrder',
          refId: order.id,
          note: 'Estorno de resgate cancelado',
        },
      }),
      prisma.rewardProduct.update({
        where: { id: order.productId },
        data: { stock: { increment: 1 } },
      }),
    ])
  } else {
    await prisma.redemptionOrder.update({ where: { id: params.id }, data: { status } })
  }

  return NextResponse.json({ success: true })
})
