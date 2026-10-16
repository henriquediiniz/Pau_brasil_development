import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  photoUrl: z.string().url(),
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const userName = session.user.name ?? ''

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await prisma.user.update({
    where: { id: userId },
    data: { photoUrl: parsed.data.photoUrl },
  })

  void audit({
    actorId: userId,
    actorName: userName,
    action: 'USER_PHOTO_UPDATED',
    targetType: 'User',
    targetId: userId,
    meta: {},
  })

  return NextResponse.json({ photoUrl: parsed.data.photoUrl })
}
