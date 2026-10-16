import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao, whereGrupoGente } from '@/lib/gente/scope'
import {
  SELECT_SUCESSAO,
  consolidarCobertura,
  horizonteProntidao,
  sucessaoSchema,
} from '@/lib/gente/sucessao'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  // A lista acompanha o pipeline: visão de grupo. Se só a lista fosse presa à
  // operação, os dois mostrariam números diferentes do mesmo assunto.
  const escopo = whereGrupoGente(user)
  if (escopo === null) return NextResponse.json({ items: [], total: 0, semEscopo: true })

  const url = req.nextUrl
  const operacaoId = url.searchParams.get('operacaoId')
  const q = url.searchParams.get('q')
  const incluirInativos = url.searchParams.get('incluirInativos') === 'true'

  const where: Record<string, unknown> = { ...escopo }
  if (!incluirInativos) where.ativo = true

  if (operacaoId) where.operacaoId = operacaoId
  if (q) {
    where.OR = [
      { cargoSucessao: { contains: q, mode: 'insensitive' } },
      { nomeSucessor: { contains: q, mode: 'insensitive' } },
      { areaCargoSucessao: { contains: q, mode: 'insensitive' } },
    ]
  }

  const items = await prisma.recSucessao.findMany({
    where,
    orderBy: [{ cargoSucessao: 'asc' }, { nomeSucessor: 'asc' }],
    take: 500,
    select: SELECT_SUCESSAO,
  })

  const cobertura = consolidarCobertura(items)

  return NextResponse.json({
    // `editavel` evita botão morto: a leitura é do grupo, mas editar continua
    // preso às operações do usuário. Sem isso, a tela ofereceria "Editar" em
    // registro de outra revenda e o salvamento falharia depois.
    items: items.map((s) => ({
      ...s,
      horizonte: horizonteProntidao(s),
      editavel: podeEscreverNaOperacao(user, s.operacaoId),
    })),
    total: items.length,
    cobertura,
    // O número que interessa não é quantos sucessores existem, é quantos
    // cargos ficariam descobertos amanhã.
    cargosEmRisco: cobertura.filter((c) => c.emRisco).length,
    cargosMapeados: cobertura.length,
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

  const parsed = sucessaoSchema.safeParse(body)
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

  const item = await prisma.recSucessao.create({
    data: { ...dados, empresaId },
    select: SELECT_SUCESSAO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_SUCESSAO_CRIADA',
    targetType: 'RecSucessao',
    targetId: item.id,
    meta: {
      cargoSucessao: item.cargoSucessao,
      sucessor: item.nomeSucessor,
      operacao: operacao.nome,
    },
  })

  return NextResponse.json({ ...item, horizonte: horizonteProntidao(item) }, { status: 201 })
})
