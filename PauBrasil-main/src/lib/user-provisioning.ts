import crypto from 'crypto'
import type { SessionUser } from '@/lib/auth-helpers'
import { canManageTeamByNivel, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { sendEmail, emailBoasVindas } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

export const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7

const WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'password',
  'senha123',
  'admin123',
  'admin@2026',
  'paubrasil',
  'grupopaubrasil',
])

const AUDIT_FIELDS = [
  'name', 'email', 'role', 'nivel', 'isUPBAdmin',
  'isEmpresaAdmin', 'isItinerantLeader', 'isVisitasAdmin', 'leaderTitle',
  'managedAreaIds', 'functionId', 'company', 'empresaId', 'units', 'operationIds',
  'managerId', 'isActive',
] as const

const USER_SELECT = {
  id: true, name: true, email: true, role: true, nivel: true,
  isUPBAdmin: true, isEmpresaAdmin: true,
  isItinerantLeader: true, isVisitasAdmin: true, leaderTitle: true,
  managedAreaIds: true, functionId: true, units: true, operationIds: true,
  company: true, empresaId: true, managerId: true, photoUrl: true,
  isActive: true, createdAt: true, updatedAt: true,
  function: { select: { name: true } },
  manager: { select: { id: true, name: true } },
  empresa: { select: { id: true, nome: true } },
} as const

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function createInviteToken() {
  const token = crypto.randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
  }
}

export function createTemporaryPassword() {
  return crypto.randomBytes(24).toString('base64url')
}

export function validatePasswordPolicy(password: string, userHint?: { name?: string | null; email?: string | null }) {
  const normalized = password.toLowerCase()
  if (password.length < 10) throw new Error('Senha deve ter pelo menos 10 caracteres')
  if (!/[a-z]/.test(password)) throw new Error('Senha deve conter letra minúscula')
  if (!/[A-Z]/.test(password)) throw new Error('Senha deve conter letra maiúscula')
  if (!/[0-9]/.test(password)) throw new Error('Senha deve conter número')
  if (!/[^A-Za-z0-9]/.test(password)) throw new Error('Senha deve conter caractere especial')
  if (WEAK_PASSWORDS.has(normalized)) throw new Error('Senha muito comum')

  const emailUser = userHint?.email?.split('@')[0]?.toLowerCase()
  const nameParts = userHint?.name?.toLowerCase().split(/\s+/).filter(part => part.length >= 3) ?? []
  if (emailUser && normalized.includes(emailUser)) throw new Error('Senha não pode conter o e-mail do usuário')
  if (nameParts.some(part => normalized.includes(part))) throw new Error('Senha não pode conter o nome do usuário')
}

export function buildSetupUrl(req: Request, token: string) {
  const url = new URL('/login', req.url)
  url.searchParams.set('setupToken', token)
  return url.toString()
}

export async function validateUserProvisioningRefs(params: {
  actor: SessionUser
  targetUserId?: string
  empresaId?: string | null
  functionId?: string | null
  managerId?: string | null
  operationIds?: string[]
}) {
  const { actor, targetUserId } = params
  const operationIds = Array.from(new Set(params.operationIds ?? []))
  const empresaId = params.empresaId || null

  if (empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, nome: true, ativo: true },
    })
    if (!empresa || !empresa.ativo) throw new Error('Empresa inválida ou inativa')
  }

  if (params.functionId) {
    const func = await prisma.function.findUnique({
      where: { id: params.functionId },
      select: { id: true, empresaId: true },
    })
    if (!func) throw new Error('Função inválida')
    if (func.empresaId && empresaId && func.empresaId !== empresaId) {
      throw new Error('Função não pertence à empresa selecionada')
    }
    if (!isSysAdmin(actor) && func.empresaId !== actor.empresaId) {
      throw new Error('Função não pertence à sua empresa')
    }
  }

  if (params.managerId) {
    if (params.managerId === targetUserId) throw new Error('Colaborador não pode ser gestor de si mesmo')
    const manager = await prisma.user.findUnique({
      where: { id: params.managerId },
      select: { id: true, empresaId: true, nivel: true, isActive: true },
    })
    if (!manager || !manager.isActive) throw new Error('Gestor inválido ou inativo')
    if (!canManageTeamByNivel(manager.nivel)) throw new Error('Gestor responsável precisa ter nível de liderança')
    if (empresaId && manager.empresaId !== empresaId) throw new Error('Gestor não pertence à empresa selecionada')
    if (!isSysAdmin(actor) && manager.empresaId !== actor.empresaId) throw new Error('Gestor não pertence à sua empresa')
  }

  if (operationIds.length > 0) {
    if (!empresaId) throw new Error('Selecione uma empresa antes de vincular operações')
    const operacoes = await prisma.operacao.findMany({
      where: { id: { in: operationIds } },
      select: { id: true, nome: true, empresaId: true, ativo: true },
      orderBy: { ordem: 'asc' },
    })
    if (operacoes.length !== operationIds.length) throw new Error('Uma ou mais operações são inválidas')
    if (operacoes.some(op => op.empresaId !== empresaId)) throw new Error('Operação não pertence à empresa selecionada')
    if (operacoes.some(op => !op.ativo)) throw new Error('Operação inativa não pode ser vinculada')
    return { operationIds, units: operacoes.map(op => op.nome) }
  }

  return { operationIds, units: [] }
}

function pickAuditFields(user: Record<string, unknown> | null | undefined) {
  if (!user) return {}
  const out: Record<string, unknown> = {}
  for (const field of AUDIT_FIELDS) out[field] = user[field]
  return out
}

export function buildAuditDiff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const diff: Record<string, { before: unknown; after: unknown }> = {}
  for (const field of AUDIT_FIELDS) {
    const a = JSON.stringify(before[field] ?? null)
    const b = JSON.stringify(after[field] ?? null)
    if (a !== b) diff[field] = { before: before[field] ?? null, after: after[field] ?? null }
  }
  return diff
}

export async function createProvisionedUser(params: {
  actor: SessionUser
  req: Request
  input: {
    name: string
    email: string
    password?: string
    role?: 'USER' | 'GESTOR' | 'RH_ADMIN' | 'SYS_ADMIN'
    nivel?: string
    isUPBAdmin?: boolean
    isEmpresaAdmin?: boolean
    isItinerantLeader?: boolean
    isVisitasAdmin?: boolean
    leaderTitle?: string | null
    managedAreaIds?: string[]
    functionId?: string | null
    company?: string | null
    empresaId?: string | null
    units?: string[]
    operationIds?: string[]
    managerId?: string | null
  }
}) {
  const { actor, req, input } = params
  if (input.password) validatePasswordPolicy(input.password, input)
  const { password: _password, units: _units, operationIds: _operationIds, ...userData } = input

  const provisioning = await validateUserProvisioningRefs({
    actor,
    empresaId: input.empresaId,
    functionId: input.functionId,
    managerId: input.managerId,
    operationIds: input.operationIds,
  })

  const invite = createInviteToken()
  const passwordHash = await bcrypt.hash(input.password ?? createTemporaryPassword(), 12)
  const user = await prisma.user.create({
    data: {
      ...userData,
      email: normalizeEmail(input.email),
      passwordHash,
      units: provisioning.units,
      operationIds: provisioning.operationIds,
      mustChangePassword: true,
      passwordResetTokenHash: invite.tokenHash,
      passwordResetExpiresAt: invite.expiresAt,
    } as Parameters<typeof prisma.user.create>[0]['data'],
    select: USER_SELECT,
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'USER_CREATED',
    targetType: 'User',
    targetId: user.id,
    meta: {
      targetName: user.name,
      role: user.role,
      email: user.email,
      invite: true,
      after: pickAuditFields(user as Record<string, unknown>),
    } as unknown as Prisma.InputJsonValue,
  })

  const setupUrl = buildSetupUrl(req, invite.token)
  const { subject, html } = emailBoasVindas({ nome: user.name, email: user.email, setupUrl })
  void sendEmail(user.email, subject, html)

  return { user, setupUrl }
}

export async function updateProvisionedUser(params: {
  actor: SessionUser
  targetUserId: string
  input: Record<string, unknown>
  defaultEmpresaId?: string | null
}) {
  const { actor, targetUserId, input } = params
  const before = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: USER_SELECT,
  })
  if (!before) throw new Error('Usuario nao encontrado')

  const data: Record<string, unknown> = { ...input }
  const password = typeof data.password === 'string' ? data.password : null
  delete data.password

  if (password) {
    validatePasswordPolicy(password, { name: before.name, email: before.email })
    data.passwordHash = await bcrypt.hash(password, 12)
    data.mustChangePassword = true
  }

  if (
    data.empresaId !== undefined ||
    data.functionId !== undefined ||
    data.managerId !== undefined ||
    data.operationIds !== undefined
  ) {
    const provisioning = await validateUserProvisioningRefs({
      actor,
      targetUserId,
      empresaId: (data.empresaId as string | null | undefined) ?? params.defaultEmpresaId ?? before.empresaId,
      functionId: data.functionId as string | null | undefined,
      managerId: data.managerId as string | null | undefined,
      operationIds: (data.operationIds as string[] | undefined) ?? before.operationIds,
    })
    data.operationIds = provisioning.operationIds
    data.units = provisioning.units
  }

  const after = await prisma.user.update({
    where: { id: targetUserId },
    data,
    select: USER_SELECT,
  })

  const auditAction = password
    ? 'USER_PASSWORD_CHANGED'
    : data.isActive === true
      ? 'USER_REACTIVATED'
      : 'USER_UPDATED'

  const beforeAudit = pickAuditFields(before as Record<string, unknown>)
  const afterAudit = pickAuditFields(after as Record<string, unknown>)

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: auditAction,
    targetType: 'User',
    targetId: targetUserId,
    meta: {
      fields: Object.keys(data).filter(field => field !== 'passwordHash'),
      targetName: after.name,
      before: beforeAudit,
      after: afterAudit,
      diff: buildAuditDiff(beforeAudit, afterAudit),
    } as unknown as Prisma.InputJsonValue,
  })

  return after
}

export { USER_SELECT as PROVISIONED_USER_SELECT }
