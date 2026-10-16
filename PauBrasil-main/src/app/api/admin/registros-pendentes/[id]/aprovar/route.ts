import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isRhAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const aprovarSchema = z.object({
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).default('COLABORADOR'),
  operationIds: z.array(z.string()).default([]),
  managerId: z.string().optional(),
})

export const POST = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isRhAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = aprovarSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const reg = await prisma.pendingRegistration.findUnique({
    where: { id: params.id },
    include: { empresa: { select: { id: true, nome: true } }, function: { select: { id: true, name: true } } },
  })
  if (!reg) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
  if (reg.status !== 'PENDING') return NextResponse.json({ error: 'Registro não está pendente' }, { status: 409 })

  const { nivel, operationIds, managerId } = parsed.data

  // Resolve operation names for units cache
  let units: string[] = []
  if (operationIds.length > 0) {
    const ops = await prisma.operacao.findMany({
      where: { id: { in: operationIds }, empresaId: reg.empresaId },
      select: { nome: true },
    })
    units = ops.map((o) => o.nome)
  }

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: reg.name,
        email: reg.email,
        passwordHash: reg.passwordHash,
        role: 'USER',
        nivel,
        empresaId: reg.empresaId,
        functionId: reg.functionId ?? null,
        managerId: managerId ?? null,
        operationIds,
        units,
        mustChangePassword: false,
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    }),
    prisma.pendingRegistration.update({
      where: { id: params.id },
      data: { status: 'APPROVED', reviewedById: actor.id, reviewedAt: new Date() },
    }),
  ])

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'USER_REGISTRATION_APPROVED',
    targetType: 'PendingRegistration',
    targetId: params.id,
    meta: { email: reg.email, name: reg.name, userId: user.id, nivel },
  })

  return NextResponse.json({ ok: true, userId: user.id })
})
