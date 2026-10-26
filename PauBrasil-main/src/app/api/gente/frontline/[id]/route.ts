import { NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao, whereEscopoGente } from '@/lib/gente/scope'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  cargo: z.string().min(1).optional(),
  atividade: z.string().nullish(),
  departamento: z.enum(['DPO', 'SPO']).optional(),
  qlpMeta: z.number().int().min(0).optional(),
  qlpReal: z.number().int().min(0).optional(),
  ativo: z.boolean().optional(),
})

/** Carrega dentro do escopo e confere se o usuário pode escrever ali. */
async function carregarParaEscrita(id: string, user: Parameters<typeof podeEscreverNaOperacao>[0]) {
  const escopo = whereEscopoGente(user)
  if (escopo === null) return { erro: NextResponse.json({ error: 'Não encontrado' }, { status: 404 }) }

  const item = await prisma.quadroFrontlineCargo.findFirst({
    where: { id, ...escopo },
    select: { id: true, cargo: true, operacaoId: true, departamento: true },
  })
  if (!item) return { erro: NextResponse.json({ error: 'Não encontrado' }, { status: 404 }) }

  if (!podeEscreverNaOperacao(user, item.operacaoId)) {
    return {
      erro: NextResponse.json(
        { error: 'Este cargo é de outra operação. Você pode consultá-lo, mas não editar.' },
        { status: 403 }
      ),
    }
  }

  return { item }
}

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const carregado = await carregarParaEscrita(params.id, user)
  if (carregado.erro) return carregado.erro

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const item = await prisma.quadroFrontlineCargo.update({
    where: { id: params.id },
    data: { ...parsed.data, atividade: parsed.data.atividade ?? undefined },
    select: {
      id: true, cargo: true, atividade: true, departamento: true,
      qlpMeta: true, qlpReal: true, ativo: true, operacaoId: true,
      operacao: { select: { id: true, nome: true } },
    },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_FRONTLINE_CARGO_ATUALIZADO',
    targetType: 'QuadroFrontlineCargo',
    targetId: item.id,
    meta: { cargo: item.cargo, campos: Object.keys(parsed.data) },
  })

  return NextResponse.json(item)
})

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const carregado = await carregarParaEscrita(params.id, user)
  if (carregado.erro) return carregado.erro

  await prisma.quadroFrontlineCargo.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_FRONTLINE_CARGO_EXCLUIDO',
    targetType: 'QuadroFrontlineCargo',
    targetId: params.id,
    meta: { cargo: carregado.item!.cargo, departamento: carregado.item!.departamento },
  })

  return NextResponse.json({ ok: true })
})
