import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_CANDIDATO,
  SITUACOES_FINAIS,
  candidatoPatchSchema,
  serializarCandidato,
  type CandidatoDoBanco,
} from '@/lib/gente/candidato'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

/** 404 em vez de 403: fora do escopo, a existência do candidato não é revelada. */
async function buscarNoEscopo(id: string, escopo: Record<string, unknown>) {
  return prisma.recCandidato.findFirst({ where: { id, ...escopo }, select: SELECT_CANDIDATO })
}

export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  const candidato = await buscarNoEscopo(params.id, escopo)
  if (!candidato) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  return NextResponse.json(serializarCandidato(candidato as unknown as CandidatoDoBanco))
})

export const PATCH = withHandler<Ctx>(async (req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  const atual = await buscarNoEscopo(params.id, escopo)
  if (!atual) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = candidatoPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const dados = parsed.data

  // Mover de operação exige permissão nas duas pontas.
  let empresaId: string | undefined
  if (dados.operacaoId && dados.operacaoId !== atual.operacaoId) {
    if (!podeEscreverNaOperacao(user, dados.operacaoId)) {
      return NextResponse.json({ error: 'Operação de destino fora do seu escopo' }, { status: 403 })
    }
    const destino = await prisma.operacao.findUnique({
      where: { id: dados.operacaoId },
      select: { empresaId: true },
    })
    if (!destino) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
    empresaId = destino.empresaId
  }

  if (dados.vagaId) {
    const vaga = await prisma.recVaga.findFirst({
      where: { id: dados.vagaId, ...escopo },
      select: { id: true },
    })
    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada no seu escopo' }, { status: 404 })
    }
  }

  // Encerrar o processo sem data deixa o histórico sem o "quando".
  const situacaoFinal = dados.situacaoFinal ?? atual.situacaoFinal
  const dataFinal = dados.dataSituacaoFinal ?? atual.dataSituacaoFinal
  if (situacaoFinal && SITUACOES_FINAIS.includes(situacaoFinal) && !dataFinal) {
    return NextResponse.json(
      { error: 'Informe a data da situação final ao encerrar o processo' },
      { status: 400 }
    )
  }

  const candidato = await prisma.recCandidato.update({
    where: { id: params.id },
    data: {
      ...dados,
      ...(dados.email !== undefined ? { email: dados.email || null } : {}),
      ...(empresaId ? { empresaId } : {}),
    },
    select: SELECT_CANDIDATO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_ATUALIZADO',
    targetType: 'RecCandidato',
    targetId: candidato.id,
    meta: {
      campos: Object.keys(dados),
      nome: candidato.nome,
      ...(dados.situacao && dados.situacao !== atual.situacao
        ? { situacaoAnterior: atual.situacao, situacaoNova: dados.situacao }
        : {}),
    },
  })

  return NextResponse.json(serializarCandidato(candidato as unknown as CandidatoDoBanco))
})

export const DELETE = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  const candidato = await buscarNoEscopo(params.id, escopo)
  if (!candidato) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  // As etapas caem por cascata (onDelete: Cascade no schema).
  await prisma.recCandidato.delete({ where: { id: params.id } })

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_EXCLUIDO',
    targetType: 'RecCandidato',
    targetId: params.id,
    meta: {
      nome: candidato.nome,
      operacao: candidato.operacao?.nome,
      situacao: candidato.situacao,
      vinhaDoBancoDeTalentos: !!candidato.candidaturaId,
    },
  })

  return NextResponse.json({ ok: true })
})
