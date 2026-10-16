import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function canManage(user: any) {
  return isSysAdmin(user) || user?.isVisitasAdmin === true
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, latitude, longitude, radiusMeters } = await req.json()

  const op = await prisma.operation.update({
    where: { id: params.id },
    data: {
      ...(name != null && { name }),
      ...(latitude != null && { latitude }),
      ...(longitude != null && { longitude }),
      ...(radiusMeters != null && { radiusMeters }),
    },
  })
  return NextResponse.json(op)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManage(session.user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.operation.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
