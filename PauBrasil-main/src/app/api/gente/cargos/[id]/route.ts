import { NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { isSysAdmin } from '@/lib/auth-helpers'
import { autenticarGente, autor } from '@/lib/gente/api'
import { cargoPatchSchema, SELECT_CARGO } from '@/lib/gente/cargo'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

/* Schema em `src/lib/gente/cargo.ts`, compartilhado com a rota irma. */

/* SELECT_CARGO em `src/lib/gente/cargo.ts`. */

/** Descritivo é da empresa, não da operação — o escopo aqui é `empresaId`. */
async function carregar(id: string, user: { empresaId?: string | null }, sysAdmin: boolean) {
  return prisma.recCargo.findFirst({
    where: { id, ...(sysAdmin ? {} : { empresaId: user.empresaId ?? '__sem_empresa' }) },
    select: { ...SELECT_CARGO, empresaId: true },
  })
}

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta

  const item = await carregar(params.id, auth.ctx.user, isSysAdmin(auth.ctx.user))
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(item)
})

export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const atual = await carregar(params.id, user, isSysAdmin(user))
  if (!atual) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = cargoPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const item = await prisma.recCargo.update({
    where: { id: params.id },
    data: parsed.data,
    select: SELECT_CARGO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_CARGO_ATUALIZADO',
    targetType: 'RecCargo',
    targetId: item.id,
    meta: { cargo: item.cargo, campos: Object.keys(parsed.data) },
  })

  return NextResponse.json(item)
})

export const DELETE = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const item = await carregar(params.id, user, isSysAdmin(user))
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const vagasLigadas = await prisma.recVaga.count({ where: { cargoId: params.id } })
  if (vagasLigadas > 0) {
    return NextResponse.json(
      {
        error: `Há ${vagasLigadas} vaga(s) ligada(s) a este descritivo. Desative-o em vez de excluir.`,
      },
      { status: 409 }
    )
  }

  await prisma.recCargo.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_CARGO_EXCLUIDO',
    targetType: 'RecCargo',
    targetId: params.id,
    meta: { cargo: item.cargo, area: item.area },
  })

  return NextResponse.json({ ok: true })
})
