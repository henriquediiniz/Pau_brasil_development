import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewAudit } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!canViewAudit(user)) {
    await audit({
      actorId: user.id || 'anonymous',
      actorName: user.name || 'Usuário desafiado',
      action: 'SECURITY_ACCESS_DENIED',
      targetType: 'SystemAudit',
      targetId: 'admin/auditoria',
      meta: { path: req.nextUrl.pathname },
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const action     = searchParams.get('action') || undefined
  const targetType = searchParams.get('targetType') || undefined
  const actorId    = searchParams.get('actorId') || undefined
  const page       = parseInt(searchParams.get('page') || '1')
  const limit      = 50
  const skip       = (page - 1) * limit

  const where = {
    ...(action     ? { action }     : {}),
    ...(targetType ? { targetType } : {}),
    ...(actorId    ? { actorId }    : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
})
