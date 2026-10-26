import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_COLABORADOR, colaboradorPatchSchema } from '@/lib/gente/quadro'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  const item = await prisma.quadroColaborador.findFirst({
    where: { id: params.id, ...escopo },
    select: SELECT_COLABORADOR,
  })
  if (!item) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  /*
    Auditoria **antes** de servir, como no laudo de PCD: o registro de quem viu
    o CPF não pode depender de a resposta chegar.

    O CPF sai completo para todo usuário do módulo, por decisão do PO, então
    este log é o que resta para saber quem consultou o quê.
  */
  if (item.cpf) {
    await audit({
      ...autor(user),
      action: 'GENTE_DADO_SENSIVEL_ACESSADO',
      targetType: 'QuadroColaborador',
      targetId: item.id,
      meta: { campo: 'cpf', nome: item.nome },
    })
  }

  return NextResponse.json(item)
})

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  const atual = await prisma.quadroColaborador.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, operacaoId: true },
  })
  if (!atual) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = colaboradorPatchSchema.safeParse(body)
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

  const item = await prisma.quadroColaborador.update({
    where: { id: params.id },
    data: { ...dados, ...(empresaId ? { empresaId } : {}) },
    select: SELECT_COLABORADOR,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_QUADRO_ATUALIZADO',
    targetType: 'QuadroColaborador',
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

  if (escopo === null) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  const item = await prisma.quadroColaborador.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true, ativo: true, operacao: { select: { nome: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })

  await prisma.quadroColaborador.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_QUADRO_EXCLUIDO',
    targetType: 'QuadroColaborador',
    targetId: params.id,
    meta: { nome: item.nome, operacao: item.operacao?.nome, estavaAtivo: item.ativo },
  })

  return NextResponse.json({ ok: true })
})
