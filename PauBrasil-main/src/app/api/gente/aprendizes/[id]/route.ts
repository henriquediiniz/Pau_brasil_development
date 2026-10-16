import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_APRENDIZ,
  aprendizPatchSchema,
  serializarAprendiz,
  type AprendizDoBanco,
} from '@/lib/gente/pcd'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.quadroAprendiz.findFirst({
    where: { id: params.id, ...escopo },
    select: SELECT_APRENDIZ,
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  return NextResponse.json(serializarAprendiz(item as unknown as AprendizDoBanco))
})

export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const atual = await prisma.quadroAprendiz.findFirst({
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

  const parsed = aprendizPatchSchema.safeParse(body)
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

  const item = await prisma.quadroAprendiz.update({
    where: { id: params.id },
    data: { ...dados, ...(empresaId ? { empresaId } : {}) },
    select: SELECT_APRENDIZ,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_APRENDIZ_ATUALIZADO',
    targetType: 'QuadroAprendiz',
    targetId: item.id,
    meta: { nome: item.nome, campos: Object.keys(dados) },
  })

  return NextResponse.json(serializarAprendiz(item as unknown as AprendizDoBanco))
})

export const DELETE = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const item = await prisma.quadroAprendiz.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, situacao: true, operacao: { select: { nome: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.quadroAprendiz.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_APRENDIZ_EXCLUIDO',
    targetType: 'QuadroAprendiz',
    targetId: params.id,
    meta: { nome: item.nome, operacao: item.operacao?.nome, situacao: item.situacao },
  })

  return NextResponse.json({ ok: true })
})
