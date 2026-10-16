import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isCoordLevel, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

export async function GET(req: NextRequest) {
  const user = await getEffectiveUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageCoordActivities(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const functions = await prisma.function.findMany({
    include: { tasks: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(functions)
}

export async function POST(req: NextRequest) {
  const user = await getEffectiveUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageCoordActivities(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { functionId, title, description, points, frequency, daysOfWeek, requireApproval, requireEvidence } = body

  if (!functionId || !title) return NextResponse.json({ error: 'functionId e title são obrigatórios' }, { status: 400 })

  const task = await prisma.taskDefinition.create({
    data: {
      functionId, title,
      description: description || null,
      points: Number(points) || 10,
      frequency: frequency || 'DAILY',
      daysOfWeek: daysOfWeek || [],
      requireApproval: Boolean(requireApproval),
      requireEvidence: Boolean(requireEvidence),
    },
  })
  return NextResponse.json(task, { status: 201 })
}
