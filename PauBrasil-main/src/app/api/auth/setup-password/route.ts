import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validatePasswordPolicy } from '@/lib/user-provisioning'

const setupSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = setupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const tokenHash = crypto.createHash('sha256').update(parsed.data.token).digest('hex')
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
      isActive: true,
    },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'Convite expirado ou inválido' }, { status: 400 })
  }

  // Mesma política do cadastro e da troca de senha (o convite aceitava 8 caracteres sem regra)
  try {
    validatePasswordPolicy(parsed.data.password, user)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        action: 'USER_PASSWORD_SETUP',
        targetType: 'User',
        targetId: user.id,
        meta: { email: user.email },
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
