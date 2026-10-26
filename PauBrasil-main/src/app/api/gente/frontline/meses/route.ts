import { NextRequest, NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'

export const dynamic = 'force-dynamic'

/**
 * Percentual mensal consolidado, por operação e departamento.
 *
 * É digitado, não calculado. O número que o RH fecha com a Ambev nem sempre
 * bate com a foto do sistema no dia — o mês é fechado com uma média do
 * período, e o painel mostra o instante. Calcular aqui daria um histórico que
 * discorda do que foi reportado.
 */

const schema = z.object({
  operacaoId: z.string().min(1),
  departamento: z.enum(['DPO', 'SPO']),
  ano: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
  percentual: z.number().min(0).max(100),
})

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

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { operacaoId, departamento, ano, mes, percentual } = parsed.data

  if (!podeEscreverNaOperacao(user, operacaoId)) {
    return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
  }

  const operacao = await prisma.operacao.findUnique({
    where: { id: operacaoId },
    select: { empresaId: true },
  })
  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  const registro = await prisma.quadroFrontlineMes.upsert({
    where: { operacaoId_departamento_ano_mes: { operacaoId, departamento, ano, mes } },
    create: { operacaoId, departamento, ano, mes, percentual, empresaId: operacao.empresaId },
    update: { percentual },
    select: { departamento: true, ano: true, mes: true, percentual: true },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_FRONTLINE_MES_ALTERADO',
    targetType: 'QuadroFrontlineMes',
    meta: { operacaoId, departamento, ano, mes, percentual },
  })

  return NextResponse.json(registro)
})
