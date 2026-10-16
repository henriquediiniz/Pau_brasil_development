import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  agregarCandidatos,
  agregarVagas,
  ehPeriodoValido,
  resolverIntervalo,
  filtroDeData,
  descreverIntervalo,
  type CandidatoParaPainel,
  type VagaParaPainel,
} from '@/lib/gente/dashboard'

export const dynamic = 'force-dynamic'

/**
 * Teto de linhas lidas por agregação.
 *
 * O painel agrega em memória de propósito, para reusar a regra de SLA de
 * `vaga-sla.ts` em vez de reescrevê-la em SQL. Na escala atual do grupo
 * (centenas de registros) isso é folgado; o teto existe para o painel degradar
 * de forma visível, avisando na resposta, em vez de ficar lento em silêncio.
 */
const TETO_LINHAS = 5000

export const GET = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ semEscopo: true })
  }

  const url = req.nextUrl
  const periodoBruto = url.searchParams.get('periodo') ?? '90d'
  const periodo = ehPeriodoValido(periodoBruto) ? periodoBruto : '90d'
  const operacaoId = url.searchParams.get('operacaoId')

  const where: Record<string, unknown> = { ...escopo }

  if (operacaoId) {
    if (!podeEscreverNaOperacao(user, operacaoId)) {
      return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
    }
    where.operacaoId = operacaoId
  }

  const intervalo = resolverIntervalo(periodo, new Date(), {
    de: url.searchParams.get('de'),
    ate: url.searchParams.get('ate'),
  })
  const corte = filtroDeData(intervalo)

  // O corte é sobre a entrada (abertura da vaga / criação do candidato), não
  // sobre o fechamento: o RH quer ver o que entrou no período.
  const whereVagas = { ...where, ...(corte ? { dataAbertura: corte } : {}) }
  const whereCandidatos = { ...where, ...(corte ? { createdAt: corte } : {}) }

  const [vagas, candidatos, candidaturasAguardando, totalVagasSemCorte] = await Promise.all([
    prisma.recVaga.findMany({
      where: whereVagas,
      take: TETO_LINHAS,
      select: {
        status: true,
        dataAbertura: true,
        dataPrevistaFechamento: true,
        dataContratacao: true,
        encerradaEm: true,
        statusFechamentoManual: true,
        quantidadeVagas: true,
        operacaoId: true,
        operacao: { select: { nome: true } },
      },
    }),
    prisma.recCandidato.findMany({
      where: whereCandidatos,
      take: TETO_LINHAS,
      select: {
        situacao: true,
        origemCurriculo: true,
        candidaturaId: true,
        etapas: { select: { chave: true, resultado: true } },
      },
    }),
    // A ponte: quantas pessoas do site ainda não entraram no processo.
    prisma.candidatura.count({ where: { recCandidato: null } }),
    prisma.recVaga.count({ where }),
  ])

  const painelVagas = agregarVagas(vagas as unknown as VagaParaPainel[])
  const painelCandidatos = agregarCandidatos(candidatos as unknown as CandidatoParaPainel[])

  return NextResponse.json({
    periodo,
    intervalo: descreverIntervalo(intervalo),
    vagas: painelVagas,
    candidatos: painelCandidatos,
    candidaturasAguardando,
    /** Vagas fora do recorte de período, para o usuário saber que existem. */
    vagasForaDoPeriodo: Math.max(0, totalVagasSemCorte - painelVagas.total),
    truncado: vagas.length >= TETO_LINHAS || candidatos.length >= TETO_LINHAS,
  })
})
