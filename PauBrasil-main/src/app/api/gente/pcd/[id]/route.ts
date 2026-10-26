import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_PCD, pcdPatchSchema, serializarPcd, type PcdDoBanco } from '@/lib/gente/pcd'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.quadroPcd.findFirst({
    where: { id: params.id, ...escopo },
    select: SELECT_PCD,
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(serializarPcd(item as unknown as PcdDoBanco))
})

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const atual = await prisma.quadroPcd.findFirst({
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

  const parsed = pcdPatchSchema.safeParse(body)
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

  const item = await prisma.quadroPcd.update({
    where: { id: params.id },
    data: { ...dados, ...(empresaId ? { empresaId } : {}) },
    select: SELECT_PCD,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_ATUALIZADO',
    targetType: 'QuadroPcd',
    targetId: item.id,
    // Campos sim, valores não: `deficiencia` é dado de saúde.
    meta: { nome: item.nome, campos: Object.keys(dados) },
  })

  return NextResponse.json(serializarPcd(item as unknown as PcdDoBanco))
})

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.quadroPcd.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, laudoBlobKey: true, operacao: { select: { nome: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  // Excluir o cadastro apaga o laudo junto: deixar dado de saúde órfão no blob
  // seria manter exposição sem nenhum registro apontando para ela.
  if (item.laudoBlobKey) {
    await del(item.laudoBlobKey).catch((e) => console.error('[gente/pcd] falha ao apagar laudo', e))
  }

  await prisma.quadroPcd.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_EXCLUIDO',
    targetType: 'QuadroPcd',
    targetId: params.id,
    meta: { nome: item.nome, operacao: item.operacao?.nome, laudoApagado: !!item.laudoBlobKey },
  })

  return NextResponse.json({ ok: true })
})
