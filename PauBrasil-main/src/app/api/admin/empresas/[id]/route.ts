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
  slug: z.string().optional(),
  ativo: z.boolean().optional(),
})

export const GET = withHandler(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: params.id },
    include: {
      operacoes: { orderBy: { ordem: 'asc' } },
      _count: { select: { usuarios: { where: { isActive: true } } } },
    },
  })

  if (!empresa) return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  return NextResponse.json(empresa)
})

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const empresa = await prisma.empresa.update({
    where: { id: params.id },
    data: parsed.data,
    include: { operacoes: { orderBy: { ordem: 'asc' } }, _count: { select: { usuarios: true } } },
  })

  return NextResponse.json(empresa)
})

export const DELETE = withHandler(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  await prisma.empresa.update({ where: { id: params.id }, data: { ativo: false } })
  return NextResponse.json({ ok: true })
})
