import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessCompanyScope, isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const schema = z.object({
  status: z.enum(['APROVADO', 'NEGADO']),
  nota: z.string().max(500).optional(),
})

export const PATCH = withHandler(async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  if (!isSysAdmin(actor)) {
    const mat = await prisma.uPBMatricula.findUnique({
      where: { id: params.id },
      select: { temporada: { select: { empresas: true } } },
    })
    if (!mat || !canAccessCompanyScope(actor, mat.temporada.empresas)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const adminId = actor.id
  const adminName = actor.name ?? 'Admin'

  const matricula = await prisma.uPBMatricula.update({
    where: { id: params.id },
    data: { status: parsed.data.status, nota: parsed.data.nota ?? null, aprovadoPor: adminId },
    include: {
      user: { select: { id: true, name: true } },
      temporada: { select: { titulo: true } },
    },
  })

  const msg = parsed.data.status === 'APROVADO'
    ? `Sua solicitacao de acesso ao curso "${matricula.temporada.titulo}" foi aprovada!`
    : `Sua solicitacao de acesso ao curso "${matricula.temporada.titulo}" foi negada.${parsed.data.nota ? ` Motivo: ${parsed.data.nota}` : ''}`

  void notify(matricula.user.id, parsed.data.status === 'APROVADO' ? 'Acesso aprovado!' : 'Acesso negado', msg)

  void audit({
    actorId: adminId,
    actorName: adminName,
    action: 'UPB_MATRICULA_REVISADA',
    targetType: 'UPBMatricula',
    targetId: params.id,
    meta: { status: parsed.data.status, userId: matricula.user.id, temporada: matricula.temporada.titulo },
  })

  return NextResponse.json(matricula)
})
