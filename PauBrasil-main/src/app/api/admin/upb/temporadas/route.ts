import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { urlDeImagemSchema } from '@/lib/armazenamento'
import { withHandler } from '@/lib/api-handler'

const createSchema = z.object({
  titulo: z.string().min(1).max(200),
  descricao: z.string().max(1000).optional(),
  capa: urlDeImagemSchema.optional().or(z.literal('')),
  restricaoAcesso: z.boolean().optional(),
  empresas: z.array(z.string()).default([]),
  unidades: z.array(z.string()).default([]),
  preRequisitos: z.array(z.string()).default([]),
  validadeDias: z.number().int().min(1).nullable().optional(),
})

export const GET = withHandler(async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const where = isSysAdmin(actor) ? {} : { empresas: { has: actor.company as string } }

  const temporadas = await prisma.uPBTemporada.findMany({
    where,
    orderBy: { ordem: 'asc' },
    include: {
      episodios: { orderBy: { ordem: 'asc' } },
      _count: { select: { certificados: true, questoes: true } },
    },
  })

  return NextResponse.json(temporadas)
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  // Admin de empresa: forca a inclusao da propria empresa.
  const empresas = isSysAdmin(actor)
    ? parsed.data.empresas
    : Array.from(new Set([...(parsed.data.empresas ?? []), actor.company as string]))

  const maxOrdem = await prisma.uPBTemporada.aggregate({ _max: { ordem: true } })
  const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1

  const temporada = await prisma.uPBTemporada.create({
    data: { ...parsed.data, empresas, capa: parsed.data.capa || null, ordem: novaOrdem },
  })

  revalidatePath('/universidade-pb')

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'UPB_TEMPORADA_CRIADA',
    targetType: 'UPBTemporada',
    targetId: temporada.id,
    meta: { titulo: temporada.titulo },
  })

  return NextResponse.json(temporada)
})
