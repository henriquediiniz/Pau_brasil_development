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
  titulo:      z.string().min(1).max(200),
  meta:        z.number().int().positive(),
  periodo:     z.enum(['mensal', 'trimestral']),
  mes:         z.number().int().min(1).max(12).nullable().optional(),
  trimestre:   z.number().int().min(1).max(4).nullable().optional(),
  ano:         z.number().int().min(2024).max(2030),
  funcaoId:    z.string().nullable().optional(),
  units:       z.array(z.string()).default([]),
  funcoesMeta: z.array(z.string()).default([]),
})

export const GET = withHandler(async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metas = await prisma.metaPontuacao.findMany({
    orderBy: [{ ano: 'desc' }, { periodo: 'asc' }, { mes: 'asc' }],
    include: { funcao: { select: { id: true, name: true } } },
  })

  return NextResponse.json(metas)
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const meta = await prisma.metaPontuacao.create({ data: parsed.data as any })
  return NextResponse.json(meta, { status: 201 })
})
