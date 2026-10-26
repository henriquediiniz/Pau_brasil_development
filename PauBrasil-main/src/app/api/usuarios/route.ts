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

const ALLOWED_DOMAIN = 'grupopaubrasil.com.br'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    include: {
      function: { select: { name: true } },
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users.map(u => ({ ...u, passwordHash: undefined })))
}

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().refine(e => e.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`), 'Domínio inválido'),
  password: z.string().min(8),
  role: z.enum(['USER', 'GESTOR', 'RH_ADMIN', 'SYS_ADMIN']).default('USER'),
  nivel: z.enum(['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'DIRETO', 'PRESIDENTE']).default('COLABORADOR'),
  functionId: z.string().optional(),
  company: z.string().optional(),
  units: z.array(z.string()).default([]),
  managerId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const { password, ...rest } = parsed.data
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { ...rest, email: rest.email.toLowerCase(), passwordHash },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'USER_CREATED',
    targetType: 'User',
    targetId: user.id,
    meta: { targetName: user.name, role: user.role, email: user.email },
  })

  return NextResponse.json({ ...user, passwordHash: undefined })
}
