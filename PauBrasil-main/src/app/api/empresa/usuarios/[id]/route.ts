import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageEmpresa, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { updateProvisionedUser } from '@/lib/user-provisioning'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).optional(),
  isEmpresaAdmin: z.boolean().optional(),
  functionId: z.string().nullable().optional(),
  units: z.array(z.string()).optional(),
  operationIds: z.array(z.string()).optional(),
  managerId: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const actorIsSysAdmin = isSysAdmin(actor)
  const rawBody = await req.json().catch(() => null)
  if (rawBody === null) return NextResponse.json({ error: 'Body invalido' }, { status: 400 })

  const parsed = updateSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (!actorIsSysAdmin && parsed.data.isEmpresaAdmin !== undefined) {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem alterar este campo' },
      { status: 403 }
    )
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { empresaId: true },
  })
  if (!target) return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })

  if (!actorIsSysAdmin && target.empresaId !== actor.empresaId) {
    return NextResponse.json({ error: 'Sem permissao para editar este usuario' }, { status: 403 })
  }

  let user
  try {
    user = await updateProvisionedUser({
      actor,
      targetUserId: params.id,
      input: parsed.data,
      defaultEmpresaId: actor.empresaId,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const actorIsSysAdmin = isSysAdmin(actor)

  if (!actorIsSysAdmin) {
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { empresaId: true } })
    if (!target || target.empresaId !== actor.empresaId) {
      return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
    }
  }

  if (params.id === actor.id) {
    return NextResponse.json({ error: 'Voce nao pode desativar sua propria conta' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
    select: { name: true, email: true },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin Empresa',
    action: 'USER_DEACTIVATED',
    targetType: 'User',
    targetId: params.id,
    meta: { targetName: user.name, email: user.email },
  })

  return NextResponse.json({ ok: true })
}
