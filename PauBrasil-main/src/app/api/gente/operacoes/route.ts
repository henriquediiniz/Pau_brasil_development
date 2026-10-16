import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'
import { resolverEscopoGente, whereGrupoGente } from '@/lib/gente/scope'

export const dynamic = 'force-dynamic'

/**
 * Operações que o usuário enxerga no módulo Gente.
 * Alimenta os filtros e os formulários — a tela nunca monta essa lista sozinha.
 */
export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  // `?escopo=grupo` lista todas as operações da empresa, para as telas de
  // sucessão — que são visão de grupo e precisam filtrar por qualquer revenda,
  // não só pelas do usuário.
  if (req.nextUrl.searchParams.get('escopo') === 'grupo') {
    const doGrupo = whereGrupoGente(user)
    if (doGrupo === null) return NextResponse.json({ items: [], semEscopo: true })

    const items = await prisma.operacao.findMany({
      where: { ativo: true, ...doGrupo },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      select: { id: true, nome: true, nomeAbrev: true },
    })
    return NextResponse.json({ items, grupo: true })
  }

  const escopo = resolverEscopoGente(user)
  if (escopo.tipo === 'nenhuma') return NextResponse.json({ items: [], semEscopo: true })

  const items = await prisma.operacao.findMany({
    where: {
      ativo: true,
      ...(escopo.tipo === 'operacoes'
        ? {
            id: { in: escopo.operacaoIds },
            ...(escopo.empresaId ? { empresaId: escopo.empresaId } : {}),
          }
        : {}),
    },
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    select: { id: true, nome: true, nomeAbrev: true },
  })

  return NextResponse.json({ items })
})
