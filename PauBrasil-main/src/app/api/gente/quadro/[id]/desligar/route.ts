import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { SELECT_DESLIGAMENTO, registrarDesligamentoSchema } from '@/lib/gente/quadro'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Desliga alguém do quadro.
 *
 * No app do RH isso eram dois lançamentos manuais em telas diferentes — tirar
 * da lotação e anotar na lista de desligados — e era comum um acontecer sem o
 * outro. Aqui é uma transação: ou os dois, ou nenhum.
 *
 * O registro do quadro não é apagado, só marcado como inativo: quem saiu ainda
 * precisa aparecer no histórico e no cálculo de turnover.
 */
export const POST = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  const colaborador = await prisma.quadroColaborador.findFirst({
    where: { id: params.id, ...escopo },
    select: {
      id: true,
      empresaId: true,
      operacaoId: true,
      userId: true,
      nome: true,
      cargo: true,
      area: true,
      ativo: true,
      operacao: { select: { nome: true } },
    },
  })
  if (!colaborador) {
    return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
  }

  if (!colaborador.ativo) {
    return NextResponse.json(
      { error: 'Este colaborador já está fora do quadro' },
      { status: 409 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = registrarDesligamentoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { dataDesligamento, motivo, setor } = parsed.data

  const desligamento = await prisma.$transaction(async (tx) => {
    const criado = await tx.quadroDesligamento.create({
      data: {
        empresaId: colaborador.empresaId,
        operacaoId: colaborador.operacaoId,
        userId: colaborador.userId,
        nome: colaborador.nome,
        cargo: colaborador.cargo,
        area: colaborador.area,
        setor: setor ?? null,
        dataDesligamento,
        motivo: motivo ?? null,
      },
      select: SELECT_DESLIGAMENTO,
    })

    await tx.quadroColaborador.update({
      where: { id: colaborador.id },
      data: { ativo: false },
    })

    return criado
  })

  await audit({
    ...autor(user),
    action: 'GENTE_DESLIGAMENTO_REGISTRADO',
    targetType: 'QuadroDesligamento',
    targetId: desligamento.id,
    meta: {
      nome: colaborador.nome,
      cargo: colaborador.cargo,
      operacao: colaborador.operacao?.nome,
      colaboradorId: colaborador.id,
      dataDesligamento: dataDesligamento.toISOString().slice(0, 10),
      // Sinaliza para a Fase 3: desligamento de quem tem conta no portal
      // deveria disparar revisão de acesso.
      temUsuarioNoPortal: !!colaborador.userId,
    },
  })

  return NextResponse.json(desligamento, { status: 201 })
})
