import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isRhAdmin, isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { ALLOWED_EMAIL_DOMAIN, USERS_PAGE_SIZE } from '@/lib/config'
import {
  createProvisionedUser,
  normalizeEmail,
} from '@/lib/user-provisioning'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true, name: true, email: true, role: true, nivel: true,
  isUPBAdmin: true, isEmpresaAdmin: true,
  functionId: true, units: true, operationIds: true, company: true, empresaId: true,
  managerId: true, photoUrl: true, isActive: true, createdAt: true, updatedAt: true,
  mustChangePassword: true, passwordResetExpiresAt: true,
  function: { select: { name: true } },
  manager: { select: { id: true, name: true } },
  empresa: { select: { id: true, nome: true } },
} as const

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const search = searchParams.get('search')?.trim() ?? ''
  const status = searchParams.get('status')
  const access = searchParams.get('access')

  const where = {
    ...(status === 'ativos' ? { isActive: true } : {}),
    ...(status === 'inativos' ? { isActive: false } : {}),
    ...(access === 'admin' ? { role: { in: ['RH_ADMIN', 'SYS_ADMIN'] as ('RH_ADMIN' | 'SYS_ADMIN')[] } } : {}),
    ...(access === 'upb' ? { isUPBAdmin: true } : {}),
    ...(access === 'empresa' ? { isEmpresaAdmin: true } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    total,
    page,
    pageSize: USERS_PAGE_SIZE,
    totalPages: Math.ceil(total / USERS_PAGE_SIZE),
  })
})

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform(normalizeEmail).refine(e => e.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), 'Dominio invalido'),
  password: z.string().min(8).optional(),
  role: z.enum(['USER', 'GESTOR', 'RH_ADMIN', 'SYS_ADMIN']).default('USER'),
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).default('COLABORADOR'),
  isUPBAdmin: z.boolean().default(false),
  isEmpresaAdmin: z.boolean().default(false),
  functionId: z.string().optional(),
  company: z.string().optional(),
  empresaId: z.string().optional(),
  units: z.array(z.string()).default([]),
  operationIds: z.array(z.string()).default([]),
  managerId: z.string().optional(),
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  if (!isSysAdmin(actor)) {
    const requestedElevatedAccess =
      parsed.data.role !== 'USER' ||
      parsed.data.isUPBAdmin ||
      parsed.data.isEmpresaAdmin

    if (requestedElevatedAccess) {
      return NextResponse.json(
        { error: 'RH_ADMIN pode criar colaboradores, mas nao conceder acessos administrativos' },
        { status: 403 }
      )
    }
  }

  let result
  try {
    result = await createProvisionedUser({ actor, req, input: parsed.data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  return NextResponse.json({ ...result.user, setupUrl: result.setupUrl })
})
