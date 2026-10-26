import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'

const createSchema = z.object({
  nome: z.string().min(2).max(100),
  nomeAbrev: z.string().max(30).optional(),
  ordem: z.number().int().optional(),
})

export async function GET(_: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const operacoes = await prisma.operacao.findMany({
    where: { empresaId: params.id },
    orderBy: { ordem: 'asc' },
  })

  return NextResponse.json(operacoes)
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const count = await prisma.operacao.count({ where: { empresaId: params.id } })

  try {
    const op = await prisma.operacao.create({
      data: {
        ...parsed.data,
        empresaId: params.id,
        ordem: parsed.data.ordem ?? count,
      },
    })
    return NextResponse.json(op, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Operacao ja cadastrada nesta empresa' }, { status: 409 })
  }
}
