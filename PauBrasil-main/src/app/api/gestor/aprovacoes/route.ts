import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTeam, isCoordLevel, isSysAdmin } from '@/lib/auth-helpers'

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

  if (!canManageTeam(effectiveUser)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let userIdFilter: string[] | undefined

  if (isCoordLevel(effectiveUser)) {
    // Coord/Supervisor: sees only direct subordinates
    const subs = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })
    userIdFilter = subs.map(s => s.id)
  } else if (!isSysAdmin(effectiveUser)) {
    // Gestor-level users: direct subordinates + their subordinates
    const directSubs = await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })
    const directIds = directSubs.map(s => s.id)
    const indirectSubs = await prisma.user.findMany({ where: { managerId: { in: directIds } }, select: { id: true } })
    userIdFilter = [...directIds, ...indirectSubs.map(s => s.id)]
  }
  // Sysadmin/RH admin: no filter

  const pendingTasks = await prisma.taskInstance.findMany({
    where: {
      status: 'DONE',
      ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, company: true, units: true } },
      taskDefinition: { select: { title: true, points: true, requireEvidence: true } },
    },
    orderBy: [{ isAdHoc: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(pendingTasks)
}
