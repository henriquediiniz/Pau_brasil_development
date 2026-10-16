import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessCompanyScope, isUpbAdmin, type SessionUser } from '@/lib/auth-helpers'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descricao: z.string().max(1000).nullable().optional(),
  capa: z.string().url().nullable().optional(),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
  restricaoAcesso: z.boolean().optional(),
  pontosNoCertificado: z.number().int().min(0).max(100000).optional(),
  empresas: z.array(z.string()).optional(),
  unidades: z.array(z.string()).optional(),
  funcoesComAcesso: z.array(z.string()).optional(),
  preRequisitos: z.array(z.string()).optional(),
  validadeDias: z.number().int().min(1).nullable().optional(),
})

async function checkTemporadaAccess(id: string, actor: SessionUser): Promise<boolean> {
  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id },
    select: { empresas: true },
  })

  return temporada != null && canAccessCompanyScope(actor, temporada.empresas)
}

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await checkTemporadaAccess(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const temporada = await prisma.uPBTemporada.update({
    where: { id: params.id },
    data: parsed.data,
  })

  if ('ativo' in parsed.data) {
    revalidatePath('/universidade-pb')
  }

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'UPB_TEMPORADA_ATUALIZADA',
    targetType: 'UPBTemporada',
    targetId: params.id,
    meta: { fields: Object.keys(parsed.data), titulo: temporada.titulo },
  })

  return NextResponse.json(temporada)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await checkTemporadaAccess(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft delete: preserva historico de progressos e certificados.
  const temporada = await prisma.uPBTemporada.update({
    where: { id: params.id },
    data: { ativo: false },
  })

  revalidatePath('/universidade-pb')

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'UPB_TEMPORADA_DELETADA',
    targetType: 'UPBTemporada',
    targetId: params.id,
    meta: { titulo: temporada.titulo },
  })

  return NextResponse.json(temporada)
})
