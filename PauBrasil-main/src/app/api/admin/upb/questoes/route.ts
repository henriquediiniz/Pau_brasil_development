import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessCompanyScope, isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const createSchema = z.object({
  temporadaId: z.string(),
  enunciado: z.string().min(1).max(2000),
  ordem: z.number().int().min(0).default(0),
  opcoes: z.array(z.object({
    texto: z.string().min(1).max(500),
    correta: z.boolean().default(false),
    ordem: z.number().int().min(0).default(0),
  })).min(2).max(6),
})

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const temporadaId = req.nextUrl.searchParams.get('temporadaId')
  if (!temporadaId) return NextResponse.json({ error: 'temporadaId obrigatorio' }, { status: 400 })

  if (!isSysAdmin(actor)) {
    const temporada = await prisma.uPBTemporada.findUnique({
      where: { id: temporadaId },
      select: { empresas: true },
    })
    if (!temporada || !canAccessCompanyScope(actor, temporada.empresas)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const questoes = await prisma.uPBQuestao.findMany({
    where: { temporadaId },
    orderBy: { ordem: 'asc' },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  })

  return NextResponse.json(questoes)
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: parsed.data.temporadaId },
    select: { empresas: true },
  })
  if (!temporada || !canAccessCompanyScope(actor, temporada.empresas)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { temporadaId, enunciado, ordem, opcoes } = parsed.data

  const questao = await prisma.uPBQuestao.create({
    data: {
      temporadaId,
      enunciado,
      ordem,
      opcoes: { create: opcoes },
    },
    include: { opcoes: { orderBy: { ordem: 'asc' } } },
  })

  return NextResponse.json(questao, { status: 201 })
})
