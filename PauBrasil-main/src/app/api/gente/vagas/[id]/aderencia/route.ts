import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { isSysAdmin } from '@/lib/auth-helpers'
import { autenticarGente } from '@/lib/gente/api'
import { analisarAderencia, encontrarDescritivo } from '@/lib/gente/aderencia'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Confere uma vaga contra o descritivo de cargo padrão.
 *
 * A análise é determinística (`src/lib/gente/aderencia.ts`) — o RH precisa
 * poder cobrar a correção mostrando exatamente qual campo divergiu, e uma
 * resposta que muda a cada execução não serve para isso.
 */
export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const vaga = await prisma.recVaga.findFirst({
    where: { id: params.id, ...escopo },
    select: {
      id: true,
      cargo: true,
      // O vínculo explícito, quando a vaga foi aberta a partir do descritivo.
      cargoId: true,
      area: true,
      requisitosMinimos: true,
      formacao: true,
      informacoesComplementares: true,
      empresaId: true,
      operacao: { select: { nome: true } },
    },
  })
  if (!vaga) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })

  const cargos = await prisma.recCargo.findMany({
    where: {
      ativo: true,
      ...(isSysAdmin(user) ? {} : { empresaId: vaga.empresaId }),
    },
    select: {
      id: true,
      cargo: true,
      area: true,
      formacao: true,
      exigencias: true,
      experienciaSugerida: true,
      competenciasSugeridas: true,
      testes: true,
      etapasProcesso: true,
      descricaoAtividades: true,
      precisaAderenciaRaio: true,
    },
  })

  const descritivo = encontrarDescritivo(vaga, cargos)
  const resultado = analisarAderencia(vaga, descritivo)

  return NextResponse.json({
    vaga: { id: vaga.id, cargo: vaga.cargo, area: vaga.area, operacao: vaga.operacao?.nome },
    descritivo: descritivo
      ? { id: descritivo.id, cargo: descritivo.cargo, area: descritivo.area }
      : null,
    ...resultado,
  })
})
