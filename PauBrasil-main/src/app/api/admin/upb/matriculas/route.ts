export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const temporadaId = req.nextUrl.searchParams.get('temporadaId') ?? undefined

  const where: any = {}
  if (temporadaId) where.temporadaId = temporadaId
  if (!isSysAdmin(actor)) where.temporada = { empresas: { has: actor.company as string } }

  const matriculas = await prisma.uPBMatricula.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      temporada: { select: { id: true, titulo: true } },
    },
  })

  return NextResponse.json(matriculas)
})
