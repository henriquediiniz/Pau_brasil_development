import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rewardId } = body // Can be null to unpin

    if (rewardId) {
      const reward = await prisma.rewardProduct.findUnique({ where: { id: rewardId } })
      if (!reward) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const user = await prisma.user.update({
      where: { id: token.sub },
      data: { targetRewardId: rewardId || null },
    })

    return NextResponse.json({ success: true, targetRewardId: user.targetRewardId })
  } catch (error) {
    console.error('Error updating target reward:', error)
    return NextResponse.json({ error: 'Erro ao configurar meta' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req })
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { targetReward: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ targetReward: user.targetReward })
  } catch (error) {
    console.error('Error fetching target reward:', error)
    return NextResponse.json({ error: 'Erro ao buscar meta' }, { status: 500 })
  }
}
