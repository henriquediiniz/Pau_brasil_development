import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'
import bcrypt from 'bcryptjs'
import { z, mensagemDeValidacao } from '@/lib/zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['USER', 'GESTOR', 'RH_ADMIN', 'SYS_ADMIN']).optional(),
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).optional(),
  functionId: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  units: z.array(z.string()).optional(),
  managerId: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const actorRole = actor.role
  const actorId = actor.id
  const actorName = actor.name ?? 'Admin'

  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })
  }

  // Only SYS_ADMIN can change role or nivel
  if ((parsed.data.role !== undefined || parsed.data.nivel !== undefined) && actorRole !== 'SYS_ADMIN') {
    return NextResponse.json({ error: 'Apenas SYS_ADMIN pode alterar papel ou tipo de acesso' }, { status: 403 })
  }

  const { password, ...rest } = parsed.data
  const data: Record<string, unknown> = { ...rest }

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12)
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    include: {
      function: { select: { name: true } },
      manager: { select: { id: true, name: true } },
    },
  })

  void audit({
    actorId,
    actorName,
    action: password ? 'USER_PASSWORD_CHANGED' : 'USER_UPDATED',
    targetType: 'User',
    targetId: params.id,
    meta: { fields: Object.keys(rest), targetName: user.name },
  })

  return NextResponse.json({ ...user, passwordHash: undefined })
}
