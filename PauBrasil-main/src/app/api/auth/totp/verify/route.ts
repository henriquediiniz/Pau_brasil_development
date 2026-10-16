import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as OTPAuth from 'otpauth'
export const dynamic = 'force-dynamic'

// Temp token expires in 5 minutes
const TEMP_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? 'fallback-temp-secret'
)

export async function POST(req: NextRequest) {
  const { token, tempToken } = await req.json()
  if (!token || !tempToken) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify temp token to get userId
  let userId: string
  try {
    const { jwtVerify } = await import('jose')
    const { payload } = await jwtVerify(tempToken, TEMP_SECRET)
    userId = payload.sub as string
    if (!userId) throw new Error('no sub')
  } catch {
    return NextResponse.json({ error: 'Token expirado ou inválido' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  })
  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: '2FA não configurado' }, { status: 400 })
  }

  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.totpSecret) })
  const delta = totp.validate({ token, window: 1 })
  if (delta === null) return NextResponse.json({ error: 'Código inválido' }, { status: 422 })

  return NextResponse.json({ ok: true, userId })
}
