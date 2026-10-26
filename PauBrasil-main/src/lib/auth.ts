import { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ALLOWED_EMAIL_DOMAIN, JWT_REFRESH_INTERVAL_MS } from '@/lib/config'
import { consumirTentativa, liberarTentativas, mensagemLimite } from '@/lib/limite-tentativas'

const loginSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .refine((e) => e.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`), {
      message: `Apenas e-mails @${ALLOWED_EMAIL_DOMAIN} são permitidos`,
    }),
  password: z.string().min(6, 'Senha mínima de 6 caracteres'),
  totpToken: z.string().optional(),
})

const TOKEN_REFRESH_INTERVAL_MS = JWT_REFRESH_INTERVAL_MS

async function refreshTokenState(token: JWT) {
  if (!token.id) return token

  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      nivel: true,
      isActive: true,
      isUPBAdmin: true,
      isEmpresaAdmin: true,
      isItinerantLeader: true,
      isVisitasAdmin: true,
      leaderTitle: true,
      faceReferenceUrl: true,
      functionId: true,
      company: true,
      empresaId: true,
      units: true,
      operationIds: true,
      photoUrl: true,
      mustChangePassword: true,
    },
  })

  if (!user) {
    return {
      ...token,
      isActive: false,
      isUPBAdmin: false,
      isEmpresaAdmin: false,
      functionId: null,
      company: null,
      empresaId: null,
      units: [],
      operationIds: [],
      photoUrl: null,
      lastValidatedAt: Date.now(),
    }
  }

  return {
    ...token,
    name: user.name,
    email: user.email,
    role: user.role,
    nivel: user.nivel,
    isActive: user.isActive,
    isUPBAdmin: user.isActive ? user.isUPBAdmin : false,
    isEmpresaAdmin:    user.isActive ? user.isEmpresaAdmin : false,
    isItinerantLeader: user.isActive ? user.isItinerantLeader : false,
    isVisitasAdmin:    user.isActive ? (user as any).isVisitasAdmin : false,
    leaderTitle:       user.isActive ? (user.leaderTitle ?? null) : null,
    faceReferenceUrl:  user.isActive ? ((user as any).faceReferenceUrl ?? null) : null,
    functionId: user.isActive ? user.functionId : null,
    company: user.isActive ? user.company : null,
    empresaId: user.isActive ? user.empresaId : null,
    units: user.isActive ? user.units : [],
    operationIds: user.isActive ? user.operationIds : [],
    photoUrl: user.isActive ? user.photoUrl ?? null : null,
    mustChangePassword: user.isActive ? (user as any).mustChangePassword ?? false : false,
    lastValidatedAt: Date.now(),
  }
}

export const authOptions: NextAuthOptions = {
  // Sessão de 4 horas (reduzido de 8h)
  session: { strategy: 'jwt', maxAge: 60 * 60 * 4 },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:      { label: 'E-mail', type: 'email' },
        password:   { label: 'Senha',  type: 'password' },
        totpToken:  { label: '', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          throw new Error(parsed.error.errors[0].message)
        }

        const { email, password, totpToken } = parsed.data

        // Limite de tentativas por e-mail antes de qualquer consulta ao usuário
        const limite = await consumirTentativa('login', email)
        if (!limite.ok) throw new Error(mensagemLimite(limite))

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

        if (!user) {
          // Timing attack mitigation: comparar contra hash válido para igualar tempo de resposta
          // hash pré-computado de uma senha aleatória — nunca corresponderá a nenhum login
          await bcrypt.compare(password, '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewIy3fTVLlxW3Pu.')

          const pending = await prisma.pendingRegistration.findFirst({
            where: { email: email.toLowerCase(), status: 'PENDING' },
            select: { id: true },
          })
          if (pending) throw new Error('Seu cadastro está aguardando aprovação.')

          const rejected = await prisma.pendingRegistration.findFirst({
            where: { email: email.toLowerCase(), status: 'REJECTED' },
            select: { id: true },
          })
          if (rejected) throw new Error('Seu cadastro foi rejeitado. Entre em contato com o suporte.')

          throw new Error('Credenciais inválidas')
        }

        if (!(user as any).isActive) throw new Error('Conta desativada. Entre em contato com o RH.')

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          void audit({
            actorId: user.id, actorName: user.name,
            action: 'SECURITY_LOGIN_FAILURE', targetType: 'User', targetId: user.id,
            meta: { email: email.toLowerCase(), reason: 'Senha incorreta' },
          })
          throw new Error('Credenciais inválidas')
        }

        // TOTP check for admin roles
        const totpEnabled = (user as any).totpEnabled ?? false
        const totpSecret  = (user as any).totpSecret  ?? null
        if (totpEnabled && totpSecret) {
          // Só avisa que falta o código; o cliente reenvia o login com ele.
          // (Havia um token temporário assinado aqui, mas nenhuma tela o usava.)
          if (!totpToken) throw new Error('TOTP_REQUIRED:')
          const OTPAuth = await import('otpauth')
          const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(totpSecret) })
          const delta = totp.validate({ token: totpToken, window: 1 })
          if (delta === null) throw new Error('Código 2FA inválido')
        }

        // Login bem-sucedido — zera o contador de tentativas
        await liberarTentativas('login', email)

        return {
          id:              user.id,
          name:            user.name,
          email:           user.email,
          role:            user.role,
          nivel:           user.nivel,
          isActive:        user.isActive,
          isUPBAdmin:      user.isUPBAdmin,
          isEmpresaAdmin:    user.isEmpresaAdmin,
          isItinerantLeader: (user as any).isItinerantLeader ?? false,
          isVisitasAdmin:    (user as any).isVisitasAdmin ?? false,
          leaderTitle:       (user as any).leaderTitle ?? null,
          faceReferenceUrl:  (user as any).faceReferenceUrl ?? null,
          functionId:      user.functionId,
          company:         user.company,
          empresaId:       user.empresaId,
          units:           user.units,
          operationIds:    (user as any).operationIds ?? [],
          photoUrl:        user.photoUrl ?? null,
          mustChangePassword: (user as any).mustChangePassword ?? false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id              = user.id
        token.role            = user.role
        token.nivel           = user.nivel
        token.isActive        = user.isActive
        token.isUPBAdmin      = user.isUPBAdmin
        token.isEmpresaAdmin  = user.isEmpresaAdmin
        token.isItinerantLeader = (user as any).isItinerantLeader ?? false
        token.isVisitasAdmin    = (user as any).isVisitasAdmin ?? false
        token.leaderTitle       = (user as any).leaderTitle ?? null
        token.faceReferenceUrl  = (user as any).faceReferenceUrl ?? null
        token.functionId      = user.functionId
        token.company         = user.company
        token.empresaId       = user.empresaId
        token.units           = user.units
        token.operationIds       = (user as any).operationIds ?? []
        token.photoUrl           = user.photoUrl ?? null
        token.mustChangePassword = (user as any).mustChangePassword ?? false
        token.lastValidatedAt    = Date.now()
        return token
      }

      const shouldRefresh =
        typeof token.id === 'string' &&
        (typeof token.lastValidatedAt !== 'number' ||
          Date.now() - token.lastValidatedAt >= TOKEN_REFRESH_INTERVAL_MS)

      if (shouldRefresh) {
        token = await refreshTokenState(token)
      }

      if (trigger === 'update' && updateData?.photoUrl !== undefined) {
        token.photoUrl = updateData.photoUrl
      }
      if (trigger === 'update' && updateData?.mustChangePassword !== undefined) {
        token.mustChangePassword = updateData.mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (!token.id || token.isActive === false) {
        return null as any
      }

      session.user.id              = token.id
      session.user.role            = token.role
      session.user.nivel           = token.nivel
      session.user.isActive        = token.isActive
      session.user.isUPBAdmin      = token.isUPBAdmin
      session.user.isEmpresaAdmin  = token.isEmpresaAdmin
      session.user.isItinerantLeader = token.isItinerantLeader ?? false
      session.user.isVisitasAdmin    = token.isVisitasAdmin ?? false
      session.user.leaderTitle       = token.leaderTitle ?? null
      session.user.faceReferenceUrl  = token.faceReferenceUrl ?? null
      session.user.functionId      = token.functionId
      session.user.company         = token.company
      session.user.empresaId       = token.empresaId
      session.user.units           = token.units
      session.user.operationIds       = token.operationIds ?? []
      session.user.photoUrl           = token.photoUrl ?? null
      session.user.mustChangePassword = token.mustChangePassword ?? false
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NEXTAUTH_URL?.startsWith('https://') ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
      },
    },
  },
}
