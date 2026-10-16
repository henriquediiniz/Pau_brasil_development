import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageActivityDefinitions } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, nivel: true },
  })

  const effectiveUser = {
    ...session.user,
    role: actor?.role ?? session.user.role,
    nivel: actor?.nivel ?? session.user.nivel,
  }

  if (!canManageActivityDefinitions(effectiveUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await req.json()
  const task = await prisma.taskDefinition.update({ where: { id: params.id }, data })
  return NextResponse.json(task)
}
