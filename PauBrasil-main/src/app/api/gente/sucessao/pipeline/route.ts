import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'
import { whereGrupoGente } from '@/lib/gente/scope'
import { montarPipeline, type ItemPipeline } from '@/lib/gente/pipeline'

export const dynamic = 'force-dynamic'

/**
 * Visão de pipeline: indicadores, trilhas de carreira e matriz nível × área.
 *
 * A consolidação é feita em memória (`src/lib/gente/pipeline.ts`) porque as
 * regras derivam do texto do cargo — reescrevê-las em SQL criaria uma segunda
 * verdade, e a classificação precisa bater exatamente com o que a tela mostra.
 */
export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user } = auth.ctx

  // Sucessão é visão de grupo: quem é de Patos precisa enxergar quem está
  // sendo preparado nas outras revendas. Ver `whereGrupoGente`.
  const escopo = whereGrupoGente(user)
  if (escopo === null) return NextResponse.json({ semEscopo: true })

  const operacaoId = req.nextUrl.searchParams.get('operacaoId')
  const where: Record<string, unknown> = { ...escopo }

  // O filtro é só um recorte da visão do grupo, então qualquer operação da
  // empresa é aceita aqui — diferente das telas presas à unidade.
  if (operacaoId) where.operacaoId = operacaoId

  // Desligados entram: eles aparecem riscados na matriz e contam no indicador.
  const itens = await prisma.recSucessao.findMany({
    where,
    take: 2000,
    select: {
      id: true,
      cargoSucessao: true,
      areaCargoSucessao: true,
      nomeSucessor: true,
      cargoAtualSucessor: true,
      prontoAgora: true,
      pronto1Ano: true,
      pronto2Anos: true,
      houveMovimentacao: true,
      cicloGente: true,
      ativo: true,
      operacao: { select: { nome: true } },
    },
  })

  return NextResponse.json(montarPipeline(itens as unknown as ItemPipeline[]))
})
