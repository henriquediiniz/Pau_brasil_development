import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = ['SYS_ADMIN', 'RH_ADMIN']

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const secret = new OTPAuth.Secret()
  const totp = new OTPAuth.TOTP({
    issuer: 'Pau Brasil Portal',
    label: session.user.email ?? session.user.name ?? 'user',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  const uri = totp.toString()
  const qrDataUrl = await QRCode.toDataURL(uri)

  // Store secret temporarily (not yet enabled)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret.base32 },
  })

  return NextResponse.json({ qrDataUrl, secret: secret.base32 })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_ROLES.includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { token } = await req.json()
  if (!token || !/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totpSecret: true } })
  if (!user?.totpSecret) return NextResponse.json({ error: 'Setup não iniciado' }, { status: 400 })

  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(user.totpSecret) })
  const delta = totp.validate({ token, window: 1 })
  if (delta === null) return NextResponse.json({ error: 'Código inválido' }, { status: 422 })

  await prisma.user.update({ where: { id: session.user.id }, data: { totpEnabled: true } })
  return NextResponse.json({ ok: true })
}
