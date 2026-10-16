import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import { SELECT_INTERNO, SITUACOES_INTERNO, internoSchema } from '@/lib/gente/sucessao'
import { ehLotacao, whereLotacao } from '@/lib/gente/matriz-filial'
import { operacoesDoPolo, poloPorSlug } from '@/lib/gente/polos'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) return NextResponse.json({ items: [], total: 0, semEscopo: true })

  const url = req.nextUrl
  const operacaoId = url.searchParams.get('operacaoId')
  const situacao = url.searchParams.get('situacao')
  const lotacao = url.searchParams.get('lotacao')
  const polo = url.searchParams.get('polo')
  const q = url.searchParams.get('q')

  const where: Record<string, unknown> = { ...escopo }

  if (situacao && (SITUACOES_INTERNO as readonly string[]).includes(situacao)) {
    where.situacao = situacao
  }
  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) return NextResponse.json({ items: [], total: 0 })
    where.operacaoId = operacaoId
  }
  // `matrizOuFilial` e texto livre da planilha, entao o filtro reconhece o
  // termo em vez de exigir igualdade — senao metade da base ficaria de fora.
  if (lotacao && ehLotacao(lotacao)) {
    Object.assign(where, whereLotacao(lotacao))
  }
  /*
    Polo regional (Patos + Sume, Sousa + Itaporanga...). Vira uma lista de
    operacoes, reconhecidas pela cidade no nome. O escopo do usuario continua
    no `where`, entao uma operacao do polo que ele nao enxerga simplesmente
    nao traz ninguem.
  */
  const poloEscolhido = polo ? poloPorSlug(polo) : undefined
  if (poloEscolhido) {
    const todas = await prisma.operacao.findMany({ select: { id: true, nome: true, nomeAbrev: true } })
    const ids = operacoesDoPolo(poloEscolhido, todas).map((o) => o.id)
    // Se ja havia uma operacao escolhida, o polo so estreita: fora dele, nada.
    where.operacaoId = { in: operacaoId ? ids.filter((id) => id === operacaoId) : ids }
  }
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { cargoAtual: { contains: q, mode: 'insensitive' } },
      { cargoPretendido: { contains: q, mode: 'insensitive' } },
    ]
  }

  const items = await prisma.recCandidatoInterno.findMany({
    where,
    orderBy: [{ situacao: 'asc' }, { nome: 'asc' }],
    take: 500,
    select: SELECT_INTERNO,
  })

  return NextResponse.json({
    items,
    total: items.length,
    prontos: items.filter((i) => i.possuiRequisitos && i.situacao === 'AGUARDANDO').length,
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

  const parsed = internoSchema.safeParse(body)
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

  const item = await prisma.recCandidatoInterno.create({
    data: { ...dados, empresaId },
    select: SELECT_INTERNO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_INTERNO_CRIADO',
    targetType: 'RecCandidatoInterno',
    targetId: item.id,
    meta: { nome: item.nome, operacao: operacao.nome, cargoPretendido: item.cargoPretendido },
  })

  return NextResponse.json(item, { status: 201 })
})
