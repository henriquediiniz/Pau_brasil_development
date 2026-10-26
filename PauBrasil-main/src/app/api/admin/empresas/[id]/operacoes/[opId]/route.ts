import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  nomeAbrev: z.string().max(30).nullable().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
})

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string; opId: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const op = await prisma.operacao.update({
    where: { id: params.opId, empresaId: params.id },
    data: parsed.data,
  })

  return NextResponse.json(op)
})

export const DELETE = withHandler(async (_: NextRequest, { params }: { params: { id: string; opId: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  await prisma.operacao.update({
    where: { id: params.opId, empresaId: params.id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
})
