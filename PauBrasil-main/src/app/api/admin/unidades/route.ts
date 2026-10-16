import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const empresasParam = searchParams.get('empresas')
  const empresasFiltro = empresasParam ? empresasParam.split(',').map(e => e.trim()).filter(Boolean) : []

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      units: { isEmpty: false },
      ...(empresasFiltro.length > 0 ? { company: { in: empresasFiltro } } : {}),
    },
    select: { units: true },
  })

  const all = new Set<string>()
  users.forEach(u => u.units.forEach(unit => all.add(unit)))

  return NextResponse.json(Array.from(all).sort())
})
