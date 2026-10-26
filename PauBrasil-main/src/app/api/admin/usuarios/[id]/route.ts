import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { isRhAdmin, isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { updateProvisionedUser } from '@/lib/user-provisioning'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['USER', 'GESTOR', 'RH_ADMIN', 'SYS_ADMIN']).optional(),
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).optional(),
  isUPBAdmin: z.boolean().optional(),
  isEmpresaAdmin: z.boolean().optional(),
  functionId: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  empresaId: z.string().nullable().optional(),
  units: z.array(z.string()).optional(),
  operationIds: z.array(z.string()).optional(),
  managerId: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
})

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)

  if (!isRhAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const actorIsSysAdmin = isSysAdmin(actor)
  const sensitiveFieldsChanged =
    parsed.data.role !== undefined ||
    parsed.data.nivel !== undefined ||
    parsed.data.isUPBAdmin !== undefined ||
    parsed.data.isEmpresaAdmin !== undefined ||
    parsed.data.company !== undefined ||
    parsed.data.empresaId !== undefined

  if (sensitiveFieldsChanged && !actorIsSysAdmin) {
    return NextResponse.json({ error: 'Apenas SYS_ADMIN pode alterar papel ou acessos administrativos' }, { status: 403 })
  }

  if (!actorIsSysAdmin) {
    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    })

    if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (target.role !== 'USER') {
      return NextResponse.json(
        { error: 'RH_ADMIN não pode alterar contas administrativas' },
        { status: 403 }
      )
    }
  }

  let user
  try {
    user = await updateProvisionedUser({ actor, targetUserId: params.id, input: parsed.data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  return NextResponse.json({ ...user, passwordHash: undefined })
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const actorId = actor.id
  const actorName = actor.name ?? 'Admin'

  if (!isRhAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Impede auto-desativação
  if (params.id === actorId) {
    return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 })
  }

  if (!isSysAdmin(actor)) {
    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    })

    if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (target.role !== 'USER') {
      return NextResponse.json(
        { error: 'RH_ADMIN não pode desativar contas administrativas' },
        { status: 403 }
      )
    }
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  })

  void audit({
    actorId,
    actorName,
    action: 'USER_DEACTIVATED',
    targetType: 'User',
    targetId: params.id,
    meta: { targetName: user.name, email: user.email },
  })

  return NextResponse.json({ ok: true })
})
