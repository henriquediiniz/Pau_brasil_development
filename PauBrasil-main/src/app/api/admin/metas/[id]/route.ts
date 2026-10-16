import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  titulo:      z.string().min(1).max(200).optional(),
  meta:        z.number().int().positive().optional(),
  ativo:       z.boolean().optional(),
  funcaoId:    z.string().nullable().optional(),
  units:       z.array(z.string()).optional(),
  funcoesMeta: z.array(z.string()).optional(),
})

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const meta = await prisma.metaPontuacao.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json(meta)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.metaPontuacao.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
})
