import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageEmpresa } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const empresaId = user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sem empresa vinculada' }, { status: 400 })
  }

  const operacoes = await prisma.operacao.findMany({
    where: { empresaId, ativo: true },
    orderBy: { ordem: 'asc' },
  })

  return NextResponse.json(operacoes)
}
