import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_DESLIGAMENTO, calcularTurnover, desligamentoSchema } from '@/lib/gente/quadro'
import { ehPeriodoValido, filtroDeData, resolverIntervalo } from '@/lib/gente/dashboard'
import { ehFormatoExportacao, responderExportacao } from '@/lib/gente/responder-exportacao'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ items: [], total: 0, page: 1, pages: 0, semEscopo: true })
  }

  const url = req.nextUrl
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(300, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(PAGE_SIZE))))

  const operacaoId = url.searchParams.get('operacaoId')
  const setor = url.searchParams.get('setor')
  const q = url.searchParams.get('q')
  const periodoBruto = url.searchParams.get('periodo') ?? 'tudo'
  const periodo = ehPeriodoValido(periodoBruto) ? periodoBruto : 'tudo'

  // `?export=xlsx` (padrão da tela) ou `?export=csv` para outras ferramentas.
  const exportBruto = url.searchParams.get('export')
  const formatoExport = ehFormatoExportacao(exportBruto) ? exportBruto : null

  const where: Record<string, unknown> = { ...escopo }

  if (setor === 'DPO' || setor === 'SPO') where.setor = setor

  const corte = filtroDeData(resolverIntervalo(periodo, new Date(), {
    de: url.searchParams.get('de'),
    ate: url.searchParams.get('ate'),
  }))
  if (corte) where.dataDesligamento = corte

  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ items: [], total: 0, page: 1, pages: 0 })
    }
    where.operacaoId = operacaoId
  }

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { cargo: { contains: q, mode: 'insensitive' } },
      { motivo: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (formatoExport) {
    const todos = await prisma.quadroDesligamento.findMany({
      where,
      orderBy: { dataDesligamento: 'desc' },
      select: SELECT_DESLIGAMENTO,
    })

    await audit({
      ...autor(user),
      action: 'GENTE_QUADRO_EXPORTADO',
      targetType: 'QuadroDesligamento',
      meta: {
        total: todos.length,
        formato: formatoExport,
        filtros: { operacaoId, setor, q, periodo },
      },
    })

    return responderExportacao(
      {
        titulo: 'Desligamentos',
        cabecalhos: ['Nome', 'Unidade', 'Cargo', 'Área', 'Setor', 'Data', 'Motivo'],
        linhas: todos.map((d) => [
          d.nome,
          d.operacao?.nome ?? null,
          d.cargo,
          d.area,
          d.setor,
          d.dataDesligamento,
          d.motivo,
        ]),
      },
      'desligamentos',
      formatoExport
    )
  }

  const [total, items, quadroAtivo] = await Promise.all([
    prisma.quadroDesligamento.count({ where }),
    prisma.quadroDesligamento.findMany({
      where,
      orderBy: { dataDesligamento: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: SELECT_DESLIGAMENTO,
    }),
    prisma.quadroColaborador.count({ where: { ...escopo, ativo: true } }),
  ])

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    periodo,
    quadroAtivo,
    turnover: calcularTurnover(total, quadroAtivo),
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

  const parsed = desligamentoSchema.safeParse(body)
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

  const operacao = await prisma.operacao.findUnique({
    where: { id: dados.operacaoId },
    select: { nome: true, empresaId: true },
  })
  if (!operacao) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  const desligamento = await prisma.quadroDesligamento.create({
    data: { ...dados, empresaId },
    select: SELECT_DESLIGAMENTO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_DESLIGAMENTO_REGISTRADO',
    targetType: 'QuadroDesligamento',
    targetId: desligamento.id,
    meta: {
      nome: desligamento.nome,
      operacao: operacao.nome,
      dataDesligamento: desligamento.dataDesligamento.toISOString().slice(0, 10),
      origem: 'cadastro direto',
    },
  })

  return NextResponse.json(desligamento, { status: 201 })
})
