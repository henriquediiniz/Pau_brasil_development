import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const orders = await prisma.redemptionOrder.findMany({
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
})
