import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const BACKUP_KEYS = ['backup_enabled', 'backup_hour_utc', 'backup_retention_days'] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: [...BACKUP_KEYS] } },
  })

  const result: Record<string, string> = {}
  for (const key of BACKUP_KEYS) {
    result[key] = configs.find(c => c.key === key)?.value ?? ''
  }

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isSysAdmin(session.user as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  for (const key of BACKUP_KEYS) {
    if (body[key] !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(body[key]), updatedBy: session.user.id },
        create: { key, value: String(body[key]), updatedBy: session.user.id },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
