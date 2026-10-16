import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id

  const [certificados, user] = await Promise.all([
    prisma.uPBCertificado.findMany({
      where: { userId },
      orderBy: { emitidoEm: 'desc' },
      include: { temporada: { select: { id: true, titulo: true, descricao: true, capa: true } } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { function: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({ certificados, functionName: user?.function?.name ?? null })
}
