import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isCoordLevel, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

async function getEffectiveUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, nivel: true },
  })

  return {
    ...session.user,
    role: me?.role ?? session.user.role,
    nivel: me?.nivel ?? session.user.nivel,
  }
}

function canManageCoordActivities(user: NonNullable<Awaited<ReturnType<typeof getEffectiveUser>>>) {
  return isCoordLevel(user) || isSysAdmin(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getEffectiveUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageCoordActivities(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.taskDefinition.update({
    where: { id: params.id },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}
