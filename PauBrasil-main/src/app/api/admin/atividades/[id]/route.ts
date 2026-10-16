import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  points: z.number().int().min(1).max(10000).optional(),
  requireEvidence: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  dailyLimit: z.number().int().min(1).max(100).optional(),
  active: z.boolean().optional(),
  nextTaskDefinitionId: z.string().nullable().optional(),
})

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const task = await prisma.taskDefinition.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(task)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft delete: preserva historico de instancias.
  await prisma.taskDefinition.update({ where: { id: params.id }, data: { active: false } })
  return NextResponse.json({ success: true })
})
