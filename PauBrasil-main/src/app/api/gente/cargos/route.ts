import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { cargoSchema, SELECT_CARGO } from '@/lib/gente/cargo'
import { empresaPadraoGente } from '@/lib/gente/scope'
import { isSysAdmin } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

/**
 * Descritivos de cargo.
 *
 * Diferente do resto do módulo, o descritivo é **da empresa, não da operação**:
 * o padrão de um cargo não muda entre Patos e Sumé. Por isso o escopo aqui é
 * por `empresaId`, e não por `operacaoId`.
 */

/* Schema em `src/lib/gente/cargo.ts`, compartilhado com a rota irma. */

/* SELECT_CARGO em `src/lib/gente/cargo.ts`. */

/** Empresas que o usuário enxerga. SYS_ADMIN vê todas. */
function filtroEmpresa(user: { empresaId?: string | null }, sysAdmin: boolean) {
  if (sysAdmin) return {}
  return user.empresaId ? { empresaId: user.empresaId } : null
}

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const filtro = filtroEmpresa(user, isSysAdmin(user))
  if (filtro === null) return NextResponse.json({ items: [], total: 0, semEmpresa: true })

  const q = req.nextUrl.searchParams.get('q')
  const where: Record<string, unknown> = { ...filtro, ativo: true }

  if (q) {
    where.OR = [
      { cargo: { contains: q, mode: 'insensitive' } },
      { area: { contains: q, mode: 'insensitive' } },
    ]
  }

  const items = await prisma.recCargo.findMany({
    where,
    orderBy: [{ cargo: 'asc' }],
    take: 500,
    select: SELECT_CARGO,
  })

  return NextResponse.json({ items, total: items.length })
})

export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = cargoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const empresaId = empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json(
      { error: 'Seu usuário não está vinculado a uma empresa' },
      { status: 400 }
    )
  }

  const cargo = await prisma.recCargo.create({
    data: { ...parsed.data, empresaId },
    select: SELECT_CARGO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_CARGO_CRIADO',
    targetType: 'RecCargo',
    targetId: cargo.id,
    meta: { cargo: cargo.cargo, area: cargo.area },
  })

  return NextResponse.json(cargo, { status: 201 })
})
