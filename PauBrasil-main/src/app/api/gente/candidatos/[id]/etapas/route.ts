import { NextResponse } from 'next/server'
import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import {
  SELECT_CANDIDATO,
  etapaSchema,
  serializarCandidato,
  type CandidatoDoBanco,
} from '@/lib/gente/candidato'
import { definicaoEtapa } from '@/lib/gente/etapas'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const corpoSchema = z.object({
  etapas: z.array(etapaSchema).min(1).max(30),
})

/**
 * Registra ou atualiza o resultado de etapas do processo.
 *
 * É `upsert` por (candidato, chave): o RH marca a mesma etapa várias vezes ao
 * longo do processo e o que vale é o último resultado. O autor e a data de
 * avaliação são gravados pelo servidor, nunca vêm do cliente.
 */
export const PATCH = withHandler<Ctx>(async (req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  const candidato = await prisma.recCandidato.findFirst({
    where: { id: params.id, ...escopo },
    select: { id: true, nome: true },
  })
  if (!candidato) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = corpoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', detalhes: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const agora = new Date()

  await prisma.$transaction(
    parsed.data.etapas.map((etapa) =>
      prisma.recCandidatoEtapa.upsert({
        where: { candidatoId_chave: { candidatoId: params.id, chave: etapa.chave } },
        create: {
          candidatoId: params.id,
          chave: etapa.chave,
          ordem: definicaoEtapa(etapa.chave).ordem,
          resultado: etapa.resultado,
          observacao: etapa.observacao ?? null,
          avaliadoPor: user.id,
          avaliadoEm: agora,
        },
        update: {
          resultado: etapa.resultado,
          observacao: etapa.observacao ?? null,
          avaliadoPor: user.id,
          avaliadoEm: agora,
        },
      })
    )
  )

  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_ETAPA_REGISTRADA',
    targetType: 'RecCandidato',
    targetId: params.id,
    meta: {
      nome: candidato.nome,
      etapas: parsed.data.etapas.map((e) => ({
        etapa: definicaoEtapa(e.chave).label,
        resultado: e.resultado,
      })),
    },
  })

  const atualizado = await prisma.recCandidato.findUnique({
    where: { id: params.id },
    select: SELECT_CANDIDATO,
  })

  return NextResponse.json(serializarCandidato(atualizado as unknown as CandidatoDoBanco))
})
