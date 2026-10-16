import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageEmpresa, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/config'
import {
  createProvisionedUser,
  normalizeEmail,
} from '@/lib/user-provisioning'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  nivel: true,
  isEmpresaAdmin: true,
  functionId: true,
  units: true,
  operationIds: true,
  company: true,
  empresaId: true,
  managerId: true,
  photoUrl: true,
  isActive: true,
  createdAt: true,
  mustChangePassword: true,
  passwordResetExpiresAt: true,
  function: { select: { name: true } },
  manager: { select: { id: true, name: true } },
  empresa: { select: { id: true, nome: true } },
} as const

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform(normalizeEmail).refine((e) => e.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), 'Dominio invalido'),
  password: z.string().min(8).optional(),
  nivel: z
    .enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE'])
    .default('COLABORADOR'),
  isEmpresaAdmin: z.boolean().default(false),
  functionId: z.string().optional(),
  units: z.array(z.string()).default([]),
  operationIds: z.array(z.string()).default([]),
  managerId: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const actorIsSysAdmin = isSysAdmin(actor)
  const empresaId = actor.empresaId

  if (!actorIsSysAdmin && !empresaId) {
    return NextResponse.json({ error: 'Usuario sem empresa vinculada' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: actorIsSysAdmin ? {} : { empresaId },
    select: USER_SELECT,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })

  const actorIsSysAdmin = isSysAdmin(actor)
  const actorEmpresaId = actor.empresaId

  if (!actorIsSysAdmin && !actorEmpresaId) {
    return NextResponse.json({ error: 'Usuario sem empresa vinculada' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.isEmpresaAdmin && !actorIsSysAdmin) {
    return NextResponse.json(
      { error: 'Apenas administradores do sistema podem criar admins de empresa' },
      { status: 403 }
    )
  }

  const empresaId = actorIsSysAdmin ? (body.empresaId ?? actorEmpresaId) : actorEmpresaId
  const empresa = empresaId
    ? await prisma.empresa.findUnique({ where: { id: empresaId }, select: { nome: true } })
    : null

  let result
  try {
    result = await createProvisionedUser({
      actor,
      req,
      input: { ...parsed.data, empresaId, company: empresa?.nome ?? undefined },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  return NextResponse.json({ ...result.user, setupUrl: result.setupUrl }, { status: 201 })
}
