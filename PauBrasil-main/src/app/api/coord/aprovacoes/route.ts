import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isCoordLevel, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, nivel: true },
  })

  const effectiveUser = {
    ...session.user,
    role: me?.role ?? session.user.role,
    nivel: me?.nivel ?? session.user.nivel,
  }

  if (!isCoordLevel(effectiveUser) && !isSysAdmin(effectiveUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Coord/Supervisor sees only direct subordinates
  const subs = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })
  const userIdFilter = subs.map(s => s.id)

  const pendingTasks = await prisma.taskInstance.findMany({
    where: {
      status: 'DONE',
      userId: { in: userIdFilter },
    },
    include: {
      user: { select: { id: true, name: true, email: true, company: true, units: true } },
      taskDefinition: { select: { title: true, points: true, requireEvidence: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(pendingTasks)
}
