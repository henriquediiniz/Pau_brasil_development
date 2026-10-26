import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_INTERNO, internoPatchSchema } from '@/lib/gente/sucessao'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.recCandidatoInterno.findFirst({
    where: { id: params.id, ...escopo },
    select: SELECT_INTERNO,
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // `futurosCargos` é array no banco e texto no formulário.
  return NextResponse.json({ ...item, futurosCargos: item.futurosCargos.join('; ') })
})

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const atual = await prisma.recCandidatoInterno.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, operacaoId: true },
  })
  if (!atual) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = internoPatchSchema.safeParse(body)
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

  const item = await prisma.recCandidatoInterno.update({
    where: { id: params.id },
    data: { ...dados, ...(empresaId ? { empresaId } : {}) },
    select: SELECT_INTERNO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_INTERNO_ATUALIZADO',
    targetType: 'RecCandidatoInterno',
    targetId: item.id,
    meta: { nome: item.nome, campos: Object.keys(dados) },
  })

  return NextResponse.json(item)
})

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.recCandidatoInterno.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, operacao: { select: { nome: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.recCandidatoInterno.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_INTERNO_EXCLUIDO',
    targetType: 'RecCandidatoInterno',
    targetId: params.id,
    meta: { nome: item.nome, operacao: item.operacao?.nome },
  })

  return NextResponse.json({ ok: true })
})
