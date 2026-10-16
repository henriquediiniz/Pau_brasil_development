import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function canManage(user: any) {
  return isSysAdmin(user) || user?.isVisitasAdmin === true
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const lideres = await prisma.user.findMany({
    where: { isItinerantLeader: true, isActive: true },
    select: { id: true, name: true, leaderTitle: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(lideres)
}
