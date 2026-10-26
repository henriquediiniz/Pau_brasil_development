import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { validatePasswordPolicy } from '@/lib/user-provisioning'
import bcrypt from 'bcryptjs'
import { z, mensagemDeValidacao } from '@/lib/zod'

const schema = z.object({
  password: z.string().min(10),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id as string

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  try {
    validatePasswordPolicy(parsed.data.password, { name: user.name, email: user.email })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  })

  void audit({
    actorId: userId,
    actorName: user.name,
    action: 'USER_PASSWORD_FORCED_CHANGE',
    targetType: 'User',
    targetId: userId,
    ip: req.headers.get('x-forwarded-for') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
