import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const PENDING_SELECT = {
  id: true,
  name: true,
  email: true,
  empresaId: true,
  functionId: true,
  note: true,
  status: true,
  rejectedReason: true,
  reviewedById: true,
  reviewedAt: true,
  createdAt: true,
  empresa: { select: { id: true, nome: true } },
  function: { select: { id: true, name: true } },
} as const

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!actor.isEmpresaAdmin || !actor.empresaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const status = (searchParams.get('status') ?? 'PENDING') as 'PENDING' | 'APPROVED' | 'REJECTED'

  const where = { status, empresaId: actor.empresaId }

  const [registros, total] = await prisma.$transaction([
    prisma.pendingRegistration.findMany({
      where,
      select: PENDING_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.pendingRegistration.count({ where }),
  ])

  return NextResponse.json({
    registros,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  })
}
