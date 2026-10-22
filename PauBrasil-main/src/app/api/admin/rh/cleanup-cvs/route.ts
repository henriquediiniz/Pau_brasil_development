import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { apagarPrivado } from '@/lib/armazenamento'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  // Busca todas as candidaturas finalizadas que ainda têm CV no armazenamento
  const candidaturas = await prisma.candidatura.findMany({
    where: {
      etapa: { in: ['REJEITADO', 'ARQUIVADO'] },
      cvPublicId: { not: null },
    },
    select: { id: true, cvPublicId: true },
  })

  if (candidaturas.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'Nenhum CV para remover.' })
  }

  // Zerar referências no DB primeiro (mais seguro — não fica com referência inválida se o Blob falhar)
  await prisma.candidatura.updateMany({
    where: { id: { in: candidaturas.map(c => c.id) } },
    data: { cvUrl: null, cvPublicId: null },
  })

  // Apagar do Blob em paralelo — erros individuais não bloqueiam os demais
  const publicIds = candidaturas.map(c => c.cvPublicId).filter(Boolean) as string[]
  await Promise.allSettled(publicIds.map(id => apagarPrivado(id)))

  audit({
    actorId:    session.user.id,
    actorName:  session.user.name ?? session.user.email ?? '',
    action:     'CANDIDATURA_CVS_LIMPOS',
    targetType: 'Candidatura',
    meta:       { total: candidaturas.length },
  }).catch(console.error)

  return NextResponse.json({ deleted: candidaturas.length })
})
