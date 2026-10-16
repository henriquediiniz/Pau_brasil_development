import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StoreService } from '@/services/StoreService'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await prisma.rewardProduct.findMany({
    where: { active: true },
    orderBy: { pointsCost: 'asc' },
    include: { _count: { select: { orders: true } } },
  })
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=300' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const userName = session.user.name ?? 'Colaborador'
  const { productId } = await req.json()

  if (!productId) return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 })

  try {
    const storeService = new StoreService()
    const result = await storeService.redeemProduct(userId, productId, userName)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro ao resgatar' }, { status: err.status ?? 500 })
  }
}
