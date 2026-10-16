import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFeedPayload } from '@/lib/feed-api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const result = await getFeedPayload(session, {
    findFeedEvents: () =>
      prisma.feedEvent.findMany({
        where: session?.user?.id ? { userId: session.user.id } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, photoUrl: true } },
        },
      }),
  })

  return NextResponse.json(result.body, { status: result.status })
}
