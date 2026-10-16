import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import { ehFrontline, indexarFrontline } from '@/lib/gente/frontline-cargo'
import { resumirFrontline } from '@/lib/gente/painel-frontline'

export const dynamic = 'force-dynamic'

/**
 * Painel do frontline na tela de Candidatos.
 *
 * Rota separada da listagem de propósito: a lista é paginada e o painel fala
 * do conjunto inteiro. Calcular os dois juntos obrigaria a buscar tudo em toda
 * troca de página, e o número mudaria conforme o filtro — o oposto do que um
 * resumo serve para dizer.
 */

const TETO = 5000

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopoBase } = auth.ctx

  if (escopoBase === null) return NextResponse.json({ semEscopo: true })

  /*
    O painel segue o filtro de operacao da lista (PO, 2026-10-07). Como no
    resto do modulo, o filtro so estreita o escopo, nunca o amplia.
  */
  const operacaoId = req.nextUrl.searchParams.get('operacaoId')
  if (operacaoId && !podeEscreverNaOperacao(user, operacaoId)) {
    return NextResponse.json({ semEscopo: true })
  }
  const escopo = operacaoId ? { ...escopoBase, operacaoId } : escopoBase

  const [descritivos, candidatos, vagasAbertas] = await Promise.all([
    prisma.recCargo.findMany({
      where: { ativo: true },
      take: 1000,
      select: { id: true, cargo: true, frontline: true },
    }),
    /*
      Só o que o resumo conta. Trazer o candidato inteiro para somar por
      operação carregaria currículo, etapas e observação de cada um.
    */
    prisma.recCandidato.findMany({
      where: escopo,
      take: TETO,
      select: {
        cargo: true,
        situacao: true,
        operacao: { select: { id: true, nome: true } },
        vaga: { select: { cargoId: true } },
      },
    }),
    prisma.recVaga.findMany({
      where: { ...escopo, status: 'ABERTA' },
      take: TETO,
      select: { cargo: true, cargoId: true, quantidadeVagas: true },
    }),
  ])

  const indice = indexarFrontline(descritivos)

  const resumo = resumirFrontline({
    candidatos: candidatos.map((c) => ({
      cargo: c.cargo,
      situacao: c.situacao,
      operacaoId: c.operacao?.id ?? null,
      operacaoNome: c.operacao?.nome ?? null,
      frontline: ehFrontline({ cargo: c.cargo, vagaCargoId: c.vaga?.cargoId ?? null }, indice),
    })),
    vagasAbertas: vagasAbertas.map((v) => ({
      cargo: v.cargo,
      quantidade: v.quantidadeVagas ?? 1,
      frontline: ehFrontline({ cargo: v.cargo, vagaCargoId: v.cargoId }, indice),
    })),
    cargosMarcados: descritivos.filter((d) => d.frontline).length,
    nomesOficiais: descritivos.map((d) => d.cargo),
  })

  return NextResponse.json(resumo)
})
