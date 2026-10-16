import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageActivityDefinitions } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

  const { functionId, title, description, frequency, daysOfWeek, points, requireEvidence, requireApproval, dailyLimit } = await req.json()
  if (!functionId || !title || !points) return NextResponse.json({ error: 'Campos obrigatórios: functionId, title, points' }, { status: 400 })

  const task = await prisma.taskDefinition.create({
    data: { functionId, title, description, frequency: frequency ?? 'DAILY', daysOfWeek: daysOfWeek ?? [1,2,3,4,5], points: parseInt(points), requireEvidence: requireEvidence ?? false, requireApproval: requireApproval ?? false, dailyLimit: dailyLimit ?? 1 },
  })
  return NextResponse.json(task)
}
