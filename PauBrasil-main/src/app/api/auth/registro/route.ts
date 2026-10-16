import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { ALLOWED_EMAIL_DOMAIN, LOGIN_RATE_LIMIT } from '@/lib/config'
import { normalizeEmail, validatePasswordPolicy } from '@/lib/user-provisioning'

export const dynamic = 'force-dynamic'

// Rate limiting by IP (same in-memory pattern as auth.ts)
const registroAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): void {
  const now = Date.now()
  const record = registroAttempts.get(ip)
  if (record && now < record.resetAt) {
    if (record.count >= LOGIN_RATE_LIMIT.maxAttempts) {
      const remaining = Math.ceil((record.resetAt - now) / 60_000)
      throw new Error(`Muitas tentativas. Tente novamente em ${remaining} minuto${remaining !== 1 ? 's' : ''}.`)
    }
    registroAttempts.set(ip, { ...record, count: record.count + 1 })
  } else {
    registroAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_LIMIT.windowMs })
  }
}

const registroSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z
    .string()
    .email('E-mail inválido')
    .transform(normalizeEmail)
    .refine((e) => e.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), 'Domínio inválido'),
  password: z.string().min(10, 'Senha deve ter pelo menos 10 caracteres'),
  confirmPassword: z.string(),
  empresaId: z.string().min(1, 'Empresa obrigatória'),
  functionId: z.string().optional(),
  note: z.string().max(500).optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  try {
    checkRateLimit(ip)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

  const parsed = registroSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password, empresaId, functionId, note } = parsed.data

  try {
    validatePasswordPolicy(password, { name, email })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  // Check existing user
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    return NextResponse.json({ error: 'Este e-mail já possui uma conta ativa.' }, { status: 409 })
  }

  // Check existing pending registration
  const existingPending = await prisma.pendingRegistration.findFirst({
    where: { email, status: 'PENDING' },
    select: { id: true },
  })
  if (existingPending) {
    return NextResponse.json({ error: 'Já existe uma solicitação pendente para este e-mail.' }, { status: 409 })
  }

  // Validate empresa
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, ativo: true },
  })
  if (!empresa || !empresa.ativo) {
    return NextResponse.json({ error: 'Empresa inválida ou inativa.' }, { status: 400 })
  }

  // Validate function if provided
  if (functionId) {
    const func = await prisma.function.findUnique({
      where: { id: functionId },
      select: { id: true, empresaId: true },
    })
    if (!func) return NextResponse.json({ error: 'Função inválida.' }, { status: 400 })
    if (func.empresaId && func.empresaId !== empresaId) {
      return NextResponse.json({ error: 'Função não pertence à empresa selecionada.' }, { status: 400 })
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const registration = await prisma.pendingRegistration.create({
    data: { name, email, passwordHash, empresaId, functionId, note },
    select: { id: true },
  })

  void audit({
    actorId: 'system',
    actorName: name,
    action: 'USER_REGISTRATION_REQUESTED',
    targetType: 'PendingRegistration',
    targetId: registration.id,
    meta: { email, empresaId, functionId: functionId ?? null },
    ip,
  })

  return NextResponse.json({ ok: true })
}
