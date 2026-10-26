import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { canViewDadoSensivel } from '@/lib/auth-helpers'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_VAGA,
  serializarVaga,
  vagaPatchSchema,
  type VagaDoBanco,
} from '@/lib/gente/vaga'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Carrega a vaga já filtrada pelo escopo do usuário.
 * Devolver 404 em vez de 403 é deliberado: quem não tem escopo naquela operação
 * não deve conseguir nem confirmar que a vaga existe.
 */
async function buscarNoEscopo(id: string, escopo: Record<string, unknown>) {
  return prisma.recVaga.findFirst({ where: { id, ...escopo }, select: SELECT_VAGA })
}

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const vaga = await buscarNoEscopo(params.id, escopo)
  if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  return NextResponse.json(
    serializarVaga(vaga as unknown as VagaDoBanco, canViewDadoSensivel(user))
  )
})

export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const atual = await buscarNoEscopo(params.id, escopo)
  if (!atual) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = vagaPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const dados = parsed.data

  // Mover a vaga de operação exige permissão nas DUAS pontas, senão daria para
  // empurrar um registro para fora do próprio escopo (ou trazer de fora).
  let unidadeTexto: string | undefined
  let empresaId: string | undefined

  if (dados.operacaoId && dados.operacaoId !== atual.operacaoId) {
    if (!podeEscreverNaOperacao(user, dados.operacaoId)) {
      return NextResponse.json({ error: 'Operação de destino fora do seu escopo' }, { status: 403 })
    }
    const destino = await prisma.operacao.findUnique({
      where: { id: dados.operacaoId },
      select: { nome: true, empresaId: true },
    })
    if (!destino) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

    unidadeTexto = destino.nome
    empresaId = destino.empresaId
  }

  const vaga = await prisma.recVaga.update({
    where: { id: params.id },
    data: {
      ...dados,
      ...(unidadeTexto ? { unidadeTexto } : {}),
      ...(empresaId ? { empresaId } : {}),
    },
    select: SELECT_VAGA,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_VAGA_ATUALIZADA',
    targetType: 'RecVaga',
    targetId: vaga.id,
    meta: { campos: Object.keys(dados), cargo: vaga.cargo },
  })

  return NextResponse.json(
    serializarVaga(vaga as unknown as VagaDoBanco, canViewDadoSensivel(user))
  )
})

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const vaga = await buscarNoEscopo(params.id, escopo)
  if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const vinculados = await prisma.recCandidato.count({ where: { vagaId: params.id } })
  if (vinculados > 0) {
    return NextResponse.json(
      {
        error: `Esta vaga tem ${vinculados} candidato(s) vinculado(s). Cancele a vaga em vez de excluí-la.`,
      },
      { status: 409 }
    )
  }

  await prisma.recVaga.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_VAGA_EXCLUIDA',
    targetType: 'RecVaga',
    targetId: params.id,
    meta: { cargo: vaga.cargo, operacao: vaga.operacao?.nome, status: vaga.status },
  })

  return NextResponse.json({ ok: true })
})
