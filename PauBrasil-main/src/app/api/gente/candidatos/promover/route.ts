import { NextRequest, NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { empresaPadraoGente, podeEscreverNaOperacao } from '@/lib/gente/scope'
import {
  SELECT_CANDIDATO,
  serializarCandidato,
  type CandidatoDoBanco,
} from '@/lib/gente/candidato'

export const dynamic = 'force-dynamic'

const schema = z.object({
  candidaturaId: z.string().min(1),
  operacaoId: z.string().min(1),
  vagaId: z.string().nullish(),
  cargo: z.string().nullish(),
})

/**
 * A ponte entre os dois funis.
 *
 * Até aqui o Banco de Talentos (`Candidatura`, quem se candidatou pelo site) e
 * o processo seletivo do RH (`RecCandidato`) eram listas separadas, e passar
 * alguém de uma para outra era digitação manual. Esta rota promove a
 * candidatura, copiando os dados e deixando o vínculo registrado.
 *
 * A candidatura original é preservada: ela é o registro de que a pessoa se
 * inscreveu, com o consentimento LGPD que ela deu. O que nasce aqui é o
 * acompanhamento do processo.
 */
export const POST = withHandler(async (req: NextRequest) => {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { candidaturaId, operacaoId, vagaId, cargo } = parsed.data

  if (!podeEscreverNaOperacao(user, operacaoId)) {
    return NextResponse.json({ error: 'Operação fora do seu escopo' }, { status: 403 })
  }

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: candidaturaId },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      cidade: true,
      estado: true,
      cargosInteresse: true,
      mensagem: true,
      cvUrl: true,
      cvPublicId: true,
      cvOriginalFilename: true,
      cvMimeType: true,
      cvSizeBytes: true,
      cvHash: true,
      recCandidato: { select: { id: true } },
    },
  })

  if (!candidatura) {
    return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 })
  }

  // `candidaturaId` é único: cada candidatura vira no máximo um candidato.
  if (candidatura.recCandidato) {
    return NextResponse.json(
      {
        error: 'Esta candidatura já está no processo seletivo',
        candidatoId: candidatura.recCandidato.id,
      },
      { status: 409 }
    )
  }

  const operacao = await prisma.operacao.findUnique({
    where: { id: operacaoId },
    select: { id: true, nome: true, empresaId: true },
  })
  if (!operacao) {
    return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })
  }

  if (vagaId && escopo) {
    const vaga = await prisma.recVaga.findFirst({
      where: { id: vagaId, ...escopo },
      select: { id: true },
    })
    if (!vaga) {
      return NextResponse.json({ error: 'Vaga não encontrada no seu escopo' }, { status: 404 })
    }
  }

  const empresaId = operacao.empresaId ?? empresaPadraoGente(user)
  if (!empresaId) {
    return NextResponse.json({ error: 'Não foi possível determinar a empresa' }, { status: 400 })
  }

  const candidato = await prisma.recCandidato.create({
    data: {
      empresaId,
      operacaoId,
      candidaturaId: candidatura.id,
      vagaId: vagaId ?? null,
      nome: candidatura.nome,
      email: candidatura.email,
      telefone: candidatura.telefone,
      // Sem cargo informado, usa o primeiro interesse declarado na candidatura.
      cargo: cargo ?? candidatura.cargosInteresse[0] ?? null,
      residencia: [candidatura.cidade, candidatura.estado].filter(Boolean).join(' - ') || null,
      observacao: candidatura.mensagem,
      origemCurriculo: 'PORTAL_CARREIRAS',
      situacao: 'EM_ANDAMENTO',
      // O currículo é o mesmo arquivo já enviado pela pessoa no site.
      cvUrl: candidatura.cvUrl,
      cvPublicId: candidatura.cvPublicId,
      cvOriginalFilename: candidatura.cvOriginalFilename,
      cvMimeType: candidatura.cvMimeType,
      cvSizeBytes: candidatura.cvSizeBytes,
      cvHash: candidatura.cvHash,
    },
    select: SELECT_CANDIDATO,
  })

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_PROMOVIDO',
    targetType: 'RecCandidato',
    targetId: candidato.id,
    meta: {
      nome: candidato.nome,
      candidaturaId: candidatura.id,
      operacao: operacao.nome,
      vagaId: vagaId ?? null,
    },
  })

  return NextResponse.json(serializarCandidato(candidato as unknown as CandidatoDoBanco), {
    status: 201,
  })
})
