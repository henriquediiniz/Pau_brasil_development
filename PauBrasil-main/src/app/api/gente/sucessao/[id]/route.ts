import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao, whereGrupoGente } from '@/lib/gente/scope'
import { SELECT_SUCESSAO, horizonteProntidao, sucessaoPatchSchema } from '@/lib/gente/sucessao'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  // Leitura acompanha o pipeline: visão de grupo.
  const escopo = whereGrupoGente(user)
  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.recSucessao.findFirst({
    where: { id: params.id, ...escopo },
    select: SELECT_SUCESSAO,
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json({
    ...item,
    horizonte: horizonteProntidao(item),
    editavel: podeEscreverNaOperacao(user, item.operacaoId),
  })
})

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const escopo = whereGrupoGente(user)
  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const atual = await prisma.recSucessao.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, cargoSucessao: true, nomeSucessor: true, operacaoId: true },
  })
  if (!atual) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Ver o plano do grupo é uma coisa; editar o registro de outra revenda é
  // outra. Como a leitura é ampla, a recusa aqui explica o motivo em vez de
  // devolver um 404 que pareceria bug.
  if (!podeEscreverNaOperacao(user, atual.operacaoId)) {
    return NextResponse.json(
      { error: 'Este mapeamento é de outra operação. Você pode consultá-lo, mas não editar.' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = sucessaoPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const dados = parsed.data

  let empresaId: string | undefined
  if (dados.operacaoId && dados.operacaoId !== atual.operacaoId) {
    if (!podeEscreverNaOperacao(user, dados.operacaoId)) {
      return NextResponse.json({ error: 'Operação de destino fora do seu escopo' }, { status: 403 })
    }
    const destino = await prisma.operacao.findUnique({
      where: { id: dados.operacaoId },
      select: { empresaId: true },
    })
    if (!destino) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
    empresaId = destino.empresaId
  }

  const item = await prisma.recSucessao.update({
    where: { id: params.id },
    data: { ...dados, ...(empresaId ? { empresaId } : {}) },
    select: SELECT_SUCESSAO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_SUCESSAO_ATUALIZADA',
    targetType: 'RecSucessao',
    targetId: item.id,
    meta: {
      cargoSucessao: item.cargoSucessao,
      sucessor: item.nomeSucessor,
      campos: Object.keys(dados),
    },
  })

  return NextResponse.json({ ...item, horizonte: horizonteProntidao(item) })
})

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const escopo = whereGrupoGente(user)
  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.recSucessao.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, cargoSucessao: true, nomeSucessor: true, operacaoId: true },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (!podeEscreverNaOperacao(user, item.operacaoId)) {
    return NextResponse.json(
      { error: 'Este mapeamento é de outra operação. Você pode consultá-lo, mas não excluir.' },
      { status: 403 }
    )
  }

  await prisma.recSucessao.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_SUCESSAO_EXCLUIDA',
    targetType: 'RecSucessao',
    targetId: params.id,
    meta: { cargoSucessao: item.cargoSucessao, sucessor: item.nomeSucessor },
  })

  return NextResponse.json({ ok: true })
})
