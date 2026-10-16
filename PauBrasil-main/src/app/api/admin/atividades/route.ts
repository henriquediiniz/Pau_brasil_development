import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  functionId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  points: z.number().int().min(1).max(10000),
  requireEvidence: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  dailyLimit: z.number().int().min(1).max(100).default(1),
  nextTaskDefinitionId: z.string().nullable().optional(),
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const task = await prisma.taskDefinition.create({ data: parsed.data })
  return NextResponse.json(task)
})
