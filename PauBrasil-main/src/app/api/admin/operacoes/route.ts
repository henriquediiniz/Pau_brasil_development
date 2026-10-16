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

  const ops = await prisma.operation.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(ops, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug, name, latitude, longitude, radiusMeters } = await req.json()
  if (!slug || !name || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const op = await prisma.operation.create({
    data: { slug, name, latitude, longitude, radiusMeters: radiusMeters ?? 200 },
  })
  return NextResponse.json(op)
}
