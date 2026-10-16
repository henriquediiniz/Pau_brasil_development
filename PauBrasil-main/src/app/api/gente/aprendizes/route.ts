import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_APRENDIZ,
  aprendizSchema,
  serializarAprendiz,
  type AprendizDoBanco,
} from '@/lib/gente/pcd'
import { WHERE_APRENDIZ_OU_ESTAGIARIO, calcularCotaAprendiz } from '@/lib/gente/cotas'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ items: [], total: 0, semEscopo: true })

  const url = req.nextUrl
  const operacaoId = url.searchParams.get('operacaoId')
  const situacao = url.searchParams.get('situacao')
  const q = url.searchParams.get('q')
  /** Atalho para o que o RH precisa agir: contratos perto do fim. */
  const soVencendo = url.searchParams.get('vencendo') === 'true'

  const where: Record<string, unknown> = { ...escopo }

  if (situacao && ['VIGENTE', 'ENCERRADO', 'DESLIGADO'].includes(situacao)) {
    where.situacao = situacao
  }

  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) return NextResponse.json({ items: [], total: 0 })
    where.operacaoId = operacaoId
  }

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { funcao: { contains: q, mode: 'insensitive' } },
      { fundacao: { contains: q, mode: 'insensitive' } },
      { gestorNome: { contains: q, mode: 'insensitive' } },
    ]
  }

  // Base da cota: QLP ativo sem aprendizes e estagiários. Contar os próprios
  // aprendizes inflaria a base que define quantos aprendizes contratar.
  // Total menos excluídos, e não `NOT` — ver `WHERE_APRENDIZ_OU_ESTAGIARIO`.
  const quadroWhere = { ...escopo, ativo: true, ...(operacaoId ? { operacaoId } : {}) }

  const [items, quadroAtivo, foraDaBase, vigentes] = await Promise.all([
    prisma.quadroAprendiz.findMany({
      where,
      orderBy: [{ terminoContrato: 'asc' }, { nome: 'asc' }],
      take: 500,
      select: SELECT_APRENDIZ,
    }),
    prisma.quadroColaborador.count({ where: quadroWhere }),
    prisma.quadroColaborador.count({ where: { ...quadroWhere, ...WHERE_APRENDIZ_OU_ESTAGIARIO } }),
    prisma.quadroAprendiz.count({
      where: { ...escopo, situacao: 'VIGENTE', ...(operacaoId ? { operacaoId } : {}) },
    }),
  ])

  const serializados = items.map((a) => serializarAprendiz(a as unknown as AprendizDoBanco))
  const filtrados = soVencendo
    ? serializados.filter((a) => a.vigencia.situacao === 'vencendo' || a.vigencia.situacao === 'vencido')
    : serializados

  return NextResponse.json({
    items: filtrados,
    total: filtrados.length,
    cota: calcularCotaAprendiz(quadroAtivo - foraDaBase, vigentes),
    vencendo: serializados.filter((a) => a.vigencia.situacao === 'vencendo').length,
    vencidos: serializados.filter((a) => a.vigencia.situacao === 'vencido').length,
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

  const parsed = aprendizSchema.safeParse(body)
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

  const aprendiz = await prisma.quadroAprendiz.create({
    data: { ...dados, empresaId },
    select: SELECT_APRENDIZ,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_APRENDIZ_CRIADO',
    targetType: 'QuadroAprendiz',
    targetId: aprendiz.id,
    meta: { nome: aprendiz.nome, operacao: operacao.nome },
  })

  return NextResponse.json(serializarAprendiz(aprendiz as unknown as AprendizDoBanco), {
    status: 201,
  })
})
