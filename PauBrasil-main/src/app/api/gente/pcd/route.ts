import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_PCD, pcdSchema, serializarPcd, type PcdDoBanco } from '@/lib/gente/pcd'
import { WHERE_APRENDIZ_OU_ESTAGIARIO, calcularCotaPcd } from '@/lib/gente/cotas'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ items: [], total: 0, semEscopo: true })

  const url = req.nextUrl
  const operacaoId = url.searchParams.get('operacaoId')
  const incluirInativos = url.searchParams.get('incluirInativos') === 'true'
  const q = url.searchParams.get('q')

  const where: Record<string, unknown> = { ...escopo }
  if (!incluirInativos) where.ativo = true

  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ items: [], total: 0 })
    }
    where.operacaoId = operacaoId
  }

  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { funcao: { contains: q, mode: 'insensitive' } },
      { deficiencia: { contains: q, mode: 'insensitive' } },
    ]
  }

  // A cota legal sai do quadro, não de um número digitado: é a lei que define.
  //
  // Aprendizes e estagiários ficam fora da base (ver `WHERE_APRENDIZ_OU_ESTAGIARIO`).
  // Conta-se o total e os excluídos, e a base é a diferença: um `NOT` sobre
  // `cargo` descartaria em silêncio quem está sem cargo preenchido, porque
  // `NOT (NULL ILIKE ...)` é NULL no SQL, não verdadeiro.
  const quadroWhere = { ...escopo, ativo: true, ...(operacaoId ? { operacaoId } : {}) }

  const [items, quadroAtivo, foraDaBase, pcdAtivos] = await Promise.all([
    prisma.quadroPcd.findMany({ where, orderBy: { nome: 'asc' }, take: 500, select: SELECT_PCD }),
    prisma.quadroColaborador.count({ where: quadroWhere }),
    prisma.quadroColaborador.count({ where: { ...quadroWhere, ...WHERE_APRENDIZ_OU_ESTAGIARIO } }),
    prisma.quadroPcd.count({
      where: { ...escopo, ativo: true, ...(operacaoId ? { operacaoId } : {}) },
    }),
  ])

  return NextResponse.json({
    items: items.map((p) => serializarPcd(p as unknown as PcdDoBanco)),
    total: items.length,
    cota: calcularCotaPcd(quadroAtivo - foraDaBase, pcdAtivos),
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

  const parsed = pcdSchema.safeParse(body)
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

  const pcd = await prisma.quadroPcd.create({
    data: { ...dados, empresaId },
    select: SELECT_PCD,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_CRIADO',
    targetType: 'QuadroPcd',
    targetId: pcd.id,
    // O tipo de deficiência é dado de saúde: não vai para o log de auditoria.
    meta: { nome: pcd.nome, operacao: operacao.nome },
  })

  return NextResponse.json(serializarPcd(pcd as unknown as PcdDoBanco), { status: 201 })
})
