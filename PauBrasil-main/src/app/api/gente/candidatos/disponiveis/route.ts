import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 30

/**
 * Candidaturas do Banco de Talentos que ainda não entraram no processo seletivo.
 *
 * O filtro `recCandidato: null` é o que evita oferecer duas vezes a mesma
 * pessoa — a relação é 1-para-1 por `candidaturaId @unique`.
 *
 * Candidatura não tem operação (quem se candidata pelo site escolhe cidade,
 * não filial), então esta lista não é filtrada por escopo. Quem decide a
 * operação é o RH no momento de promover, e aí sim o escopo é aplicado.
 */
export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta

  const url = req.nextUrl
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const q = url.searchParams.get('q')
  const etapa = url.searchParams.get('etapa')

  const where: Record<string, unknown> = { recCandidato: null }

  if (etapa) where.etapa = etapa
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { cidade: { contains: q, mode: 'insensitive' } },
    ]
  }

  /*
    A contagem por etapa e o que transforma o filtro em informacao. Sem ela o
    RH escolhe "Aprovados" no escuro e nao sabe se o resultado vazio significa
    "ninguem passou" ou "o filtro quebrou".

    Ela ignora o filtro de etapa (senao so contaria a propria) mas respeita a
    busca, para os numeros baterem com o que esta na tela.
  */
  const { etapa: _semEtapa, ...whereSemEtapa } = where

  const [total, items, porEtapa] = await Promise.all([
    prisma.candidatura.count({ where }),
    prisma.candidatura.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cidade: true,
        estado: true,
        cargosInteresse: true,
        etapa: true,
        createdAt: true,
        cvPublicId: true,
      },
    }),
    prisma.candidatura.groupBy({
      by: ['etapa'],
      where: whereSemEtapa,
      _count: true,
    }),
  ])

  return NextResponse.json({
    items: items.map(({ cvPublicId, ...c }) => ({ ...c, temCurriculo: !!cvPublicId })),
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
    porEtapa: Object.fromEntries(porEtapa.map((e) => [e.etapa, e._count])),
    totalGeral: porEtapa.reduce((s, e) => s + e._count, 0),
  })
})
