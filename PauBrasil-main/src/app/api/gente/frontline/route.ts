import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao, whereEscopoGente } from '@/lib/gente/scope'
import {
  DEPARTAMENTOS,
  TETO_PADRAO,
  mesesDoAno,
  montarLinhas,
  resumirGeral,
  resumirSegmento,
  type Departamento,
} from '@/lib/gente/frontline'

export const dynamic = 'force-dynamic'

/**
 * Acompanhamento Frontline.
 *
 * O GET monta a tela inteira numa resposta: os cargos com QLP meta/real, o
 * cruzamento com as vagas abertas, os resumos por departamento e o histórico
 * mensal. É uma tela de painel — dividir em quatro chamadas só faria os
 * números aparecerem em tempos diferentes.
 *
 * Escopo por operação, como o resto do quadro: o QLP de Patos é de Patos.
 */

const cargoSchema = z.object({
  operacaoId: z.string().min(1, 'Operação é obrigatória'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  atividade: z.string().nullish(),
  departamento: z.enum(['DPO', 'SPO']),
  qlpMeta: z.number().int().min(0).default(0),
  qlpReal: z.number().int().min(0).default(0),
})

const SELECT_CARGO = {
  id: true,
  operacaoId: true,
  cargo: true,
  atividade: true,
  departamento: true,
  qlpMeta: true,
  qlpReal: true,
  ativo: true,
  operacao: { select: { id: true, nome: true } },
} as const

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const escopo = whereEscopoGente(user)
  if (escopo === null) {
    return NextResponse.json({ semEscopo: true, cargos: [], linhas: [] })
  }

  const ano = Number(req.nextUrl.searchParams.get('ano')) || new Date().getFullYear()
  const operacaoId = req.nextUrl.searchParams.get('operacaoId') || undefined

  // Um filtro de operação só pode estreitar o escopo, nunca ampliá-lo.
  const where = { ...escopo, ativo: true, ...(operacaoId ? { operacaoId } : {}) }

  const [cargos, teto, meses, operacoes] = await Promise.all([
    prisma.quadroFrontlineCargo.findMany({
      where,
      orderBy: [{ departamento: 'asc' }, { cargo: 'asc' }],
      // Teto: o catalogo do RH tem 32 cargos por unidade. 2000 cobre oito
      // operacoes com folga e impede que um erro de cadastro vire uma
      // consulta sem fim.
      take: 2000,
      select: SELECT_CARGO,
    }),
    user.empresaId
      ? prisma.quadroFrontlineTeto.findUnique({
          where: { empresaId_ano: { empresaId: user.empresaId, ano } },
          select: { percentual: true },
        })
      : null,
    prisma.quadroFrontlineMes.findMany({
      // 12 meses x 2 departamentos x operacoes do escopo; o teto e formalidade.
      where: { ...escopo, ano, ...(operacaoId ? { operacaoId } : {}) },
      take: 1000,
      select: { departamento: true, mes: true, percentual: true },
    }),
    prisma.operacao.findMany({
      where: { ativo: true, ...(escopo.operacaoId ? { id: escopo.operacaoId } : {}) },
      orderBy: { ordem: 'asc' },
      select: { id: true, nome: true },
    }),
  ])

  const tetoPercentual = teto?.percentual ?? TETO_PADRAO

  // Vagas abertas = meta - real (ver `calcularVagasAbertas`); o Controle de
  // Vagas deixou de entrar nesta conta em 2026-10-07.
  const linhas = montarLinhas(
    cargos.map((c) => ({ ...c, departamento: c.departamento as Departamento })),
    tetoPercentual
  )

  /*
    O histórico mensal é digitado por (operação, departamento). Quando a tela
    mostra mais de uma operação, o mês vira a média das operações — somar
    percentuais de unidades diferentes não significaria nada.
  */
  const historico = DEPARTAMENTOS.map((dep) => {
    const doDep = meses.filter((m) => m.departamento === dep)
    const porMes = new Map<number, number[]>()
    for (const m of doDep) {
      const lista = porMes.get(m.mes) ?? []
      lista.push(m.percentual)
      porMes.set(m.mes, lista)
    }

    const registros = Array.from(porMes, ([mes, valores]) => ({
      mes,
      percentual: valores.reduce((s, v) => s + v, 0) / valores.length,
    }))

    return { departamento: dep, meses: mesesDoAno(registros) }
  })

  return NextResponse.json({
    ano,
    teto: tetoPercentual,
    linhas,
    resumos: DEPARTAMENTOS.map((d) => resumirSegmento(linhas, d, tetoPercentual)),
    geral: resumirGeral(linhas, tetoPercentual),
    historico,
    operacoes,
    podeEditar: operacoes.some((o) => podeEscreverNaOperacao(user, o.id)),
  })
})

export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = cargoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const dados = parsed.data

  if (!podeEscreverNaOperacao(user, dados.operacaoId)) {
    return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
  }

  // A empresa vem da operação de destino, nunca do corpo do pedido.
  const operacao = await prisma.operacao.findUnique({
    where: { id: dados.operacaoId },
    select: { empresaId: true },
  })
  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  const cargo = await prisma.quadroFrontlineCargo.create({
    data: { ...dados, atividade: dados.atividade ?? null, empresaId: operacao.empresaId },
    select: SELECT_CARGO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_FRONTLINE_CARGO_CRIADO',
    targetType: 'QuadroFrontlineCargo',
    targetId: cargo.id,
    meta: { cargo: cargo.cargo, departamento: cargo.departamento, operacaoId: cargo.operacaoId },
  })

  return NextResponse.json(cargo, { status: 201 })
})

/** Teto de comprometimento do ano. É da empresa, não da operação. */
export const PUT = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  const empresaId = empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json(
      { error: 'Seu usuário não está vinculado a uma empresa' },
      { status: 400 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = z
    .object({
      ano: z.number().int().min(2000).max(2100),
      // Teto de 0 desligaria o indicador; acima de 100 não é percentual.
      percentual: z.number().min(0.01).max(100),
    })
    .safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { ano, percentual } = parsed.data

  const teto = await prisma.quadroFrontlineTeto.upsert({
    where: { empresaId_ano: { empresaId, ano } },
    create: { empresaId, ano, percentual },
    update: { percentual },
    select: { ano: true, percentual: true },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_FRONTLINE_TETO_ALTERADO',
    targetType: 'QuadroFrontlineTeto',
    meta: { ano, percentual },
  })

  return NextResponse.json(teto)
})
