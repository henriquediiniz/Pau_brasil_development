import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await prisma.rewardProduct.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(products)
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, pointsCost, stock } = await req.json()
  if (!title || !pointsCost) return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const product = await prisma.rewardProduct.create({
    data: { title, description, pointsCost: parseInt(pointsCost), stock: stock ? parseInt(stock) : null },
  })
  return NextResponse.json(product)
})
