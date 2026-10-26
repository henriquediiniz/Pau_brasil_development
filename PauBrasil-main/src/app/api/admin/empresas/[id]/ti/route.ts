import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'
import bcrypt from 'bcryptjs'
import { z } from '@/lib/zod'
import { withHandler } from '@/lib/api-handler'

const ALLOWED_DOMAIN = 'grupopaubrasil.com.br'

const createTiSchema = z.object({
  name:     z.string().min(2, 'Nome muito curto').max(100),
  email:    z.string().email('E-mail inválido')
              .refine(e => e.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`), `Apenas e-mails @${ALLOWED_DOMAIN}`),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(128),
})

// POST — cria um novo usuário TI admin para a empresa
export const POST = withHandler(async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: params.id } })
  if (!empresa) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const raw = await req.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const parsed = createTiSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER',
      isEmpresaAdmin: true,
      company: empresa.nome,
      empresaId: empresa.id,
    },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json(user, { status: 201 })
})

// PATCH — remove flag isEmpresaAdmin de um usuário existente
export const PATCH = withHandler(async (req: NextRequest, props: { params: Promise<{ id: string }> }) => {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, isEmpresaAdmin } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isEmpresaAdmin: !!isEmpresaAdmin },
    select: { id: true, name: true, email: true, isEmpresaAdmin: true },
  })

  return NextResponse.json(user)
})
