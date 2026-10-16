import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessCompanyScope, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  enunciado: z.string().min(1).max(2000).optional(),
  ordem: z.number().int().min(0).optional(),
  opcoes: z.array(z.object({
    texto: z.string().min(1).max(500),
    correta: z.boolean().default(false),
    ordem: z.number().int().min(0).default(0),
  })).min(2).max(6).optional(),
})

async function canManageQuestao(id: string, actor: Awaited<ReturnType<typeof getEffectiveSessionUser>>) {
  const questao = await prisma.uPBQuestao.findUnique({
    where: { id },
    select: { temporada: { select: { empresas: true } } },
  })

  return questao != null && canAccessCompanyScope(actor, questao.temporada.empresas)
}

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await canManageQuestao(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { opcoes, ...rest } = parsed.data

  const questao = await prisma.$transaction(async (tx) => {
    if (opcoes) {
      await tx.uPBQuestaoOpcao.deleteMany({ where: { questaoId: params.id } })
      await tx.uPBQuestaoOpcao.createMany({
        data: opcoes.map(opcao => ({ ...opcao, questaoId: params.id })),
      })
    }

    // Incrementa versão sempre que o enunciado muda — preserva integridade dos logs históricos
    const data = rest.enunciado !== undefined
      ? { ...rest, versao: { increment: 1 } }
      : rest

    return tx.uPBQuestao.update({
      where: { id: params.id },
      data,
      include: { opcoes: { orderBy: { ordem: 'asc' } } },
    })
  })

  return NextResponse.json(questao)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await canManageQuestao(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.uPBQuestao.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
})
