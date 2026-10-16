import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeBadges } from '@/lib/badges'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  const badges = await computeBadges(userId)
  return NextResponse.json(badges, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  })
}
