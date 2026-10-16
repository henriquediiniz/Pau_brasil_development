import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import { pcdMetaSchema } from '@/lib/gente/pcd'

export const dynamic = 'force-dynamic'

/**
 * Meta mensal de contratação de PCD.
 *
 * Convive com a cota legal calculada em `cotas.ts`: a lei diz o mínimo, e o RH
 * pode se comprometer com um ritmo próprio para chegar lá. As duas aparecem
 * lado a lado na tela, porque cumprir a meta interna e estar regular são
 * coisas diferentes.
 */

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ items: [], semEscopo: true })

  const ano = parseInt(req.nextUrl.searchParams.get('ano') ?? String(new Date().getUTCFullYear()))
  const operacaoId = req.nextUrl.searchParams.get('operacaoId')

  const where: Record<string, unknown> = { ...escopo, ano }
  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) return NextResponse.json({ items: [] })
    where.operacaoId = operacaoId
  }

  const items = await prisma.quadroPcdMeta.findMany({
    where,
    orderBy: [{ mes: 'asc' }],
    select: {
      id: true,
      ano: true,
      mes: true,
      meta: true,
      real: true,
      operacaoId: true,
      operacao: { select: { nome: true } },
    },
  })

  return NextResponse.json({ items, ano })
})

/** Cria ou atualiza a meta do mês — o RH revisa o mesmo mês várias vezes. */
export const PUT = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = pcdMetaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { operacaoId, ano, mes, meta, real } = parsed.data

  if (!podeEscreverNaOperacao(user, operacaoId)) {
    return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
  }

  const operacao = await prisma.operacao.findUnique({
    where: { id: operacaoId },
    select: { nome: true, empresaId: true },
  })
  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  const registro = await prisma.quadroPcdMeta.upsert({
    where: { empresaId_operacaoId_ano_mes: { empresaId, operacaoId, ano, mes } },
    create: { empresaId, operacaoId, ano, mes, meta, real },
    update: { meta, real },
    select: { id: true, ano: true, mes: true, meta: true, real: true },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_META_DEFINIDA',
    targetType: 'QuadroPcdMeta',
    targetId: registro.id,
    meta: { operacao: operacao.nome, ano, mes, valorMeta: meta, valorReal: real },
  })

  return NextResponse.json(registro)
})
