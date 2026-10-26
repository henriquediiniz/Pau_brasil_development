import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { z, mensagemDeValidacao } from '@/lib/zod'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, getUpbEnrollmentStatus } from '@/lib/upb-access'

/** Verifica se todos os pré-requisitos da temporada têm certificado válido para o usuário. */
async function checkPreRequisitos(userId: string, preRequisitos: string[]): Promise<string[]> {
  if (preRequisitos.length === 0) return []
  const now = new Date()
  const certs = await prisma.uPBCertificado.findMany({
    where: {
      userId,
      temporadaId: { in: preRequisitos },
      OR: [{ validoAte: null }, { validoAte: { gt: now } }],
    },
    select: { temporadaId: true },
  })
  const concluidos = new Set(certs.map(c => c.temporadaId))
  return preRequisitos.filter(id => !concluidos.has(id))
}

export async function GET(_req: NextRequest, props: { params: Promise<{ temporadaId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: params.temporadaId, ativo: true },
    include: {
      questoes: {
        orderBy: { ordem: 'asc' },
        include: {
          opcoes: {
            orderBy: { ordem: 'asc' },
            select: { id: true, texto: true, ordem: true },
          },
        },
      },
      episodios: {
        where: { publicado: true },
        include: { progressos: { where: { userId } } },
      },
      matriculas: { where: { userId } },
    },
  })

  if (!temporada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessUpbAudience(actor, temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const matriculaStatus = getUpbEnrollmentStatus(actor, temporada, temporada.matriculas[0]?.status ?? null)
  if (temporada.restricaoAcesso && matriculaStatus !== 'APROVADO') {
    return NextResponse.json({ error: 'Acesso nao autorizado' }, { status: 403 })
  }

  if (temporada.questoes.length === 0) {
    return NextResponse.json({ error: 'Este curso nao tem prova cadastrada' }, { status: 404 })
  }

  const todosConcluidos = temporada.episodios.length > 0 &&
    temporada.episodios.every((e) => e.progressos.some((p) => p.concluidoEm !== null))

  if (!todosConcluidos) {
    return NextResponse.json({ error: 'Voce precisa concluir todos os episodios antes de fazer a prova' }, { status: 403 })
  }

  const faltantes = await checkPreRequisitos(userId, temporada.preRequisitos)
  if (faltantes.length > 0) {
    return NextResponse.json(
      { error: 'Pre-requisitos nao concluidos', faltantes },
      { status: 403 },
    )
  }

  return NextResponse.json({
    temporadaId: temporada.id,
    titulo: temporada.titulo,
    questoes: temporada.questoes,
  })
}

const submitSchema = z.object({
  respostas: z.record(z.string(), z.string()),
})

export async function POST(req: NextRequest, props: { params: Promise<{ temporadaId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: params.temporadaId, ativo: true },
    include: {
      questoes: { include: { opcoes: true } },
      matriculas: { where: { userId } },
    },
  })

  if (!temporada) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessUpbAudience(actor, temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const matriculaStatus = getUpbEnrollmentStatus(actor, temporada, temporada.matriculas[0]?.status ?? null)
  if (temporada.restricaoAcesso && matriculaStatus !== 'APROVADO') {
    return NextResponse.json({ error: 'Acesso nao autorizado' }, { status: 403 })
  }

  const faltantes = await checkPreRequisitos(userId, temporada.preRequisitos)
  if (faltantes.length > 0) {
    return NextResponse.json(
      { error: 'Pre-requisitos nao concluidos', faltantes },
      { status: 403 },
    )
  }

  const { respostas } = parsed.data
  let acertos = 0
  const total = temporada.questoes.length

  // Avaliação + coleta de dados granulares
  const respostasData: Array<{
    questaoId: string
    questaoVersao: number
    opcaoEscolhidaId: string
    correta: boolean
  }> = []

  for (const questao of temporada.questoes) {
    const opcaoEscolhidaId = respostas[questao.id]
    if (!opcaoEscolhidaId) continue
    const opcaoCorreta = questao.opcoes.find((o) => o.correta)
    const correta = !!(opcaoCorreta && opcaoEscolhidaId === opcaoCorreta.id)
    if (correta) acertos++
    respostasData.push({
      questaoId: questao.id,
      questaoVersao: questao.versao,
      opcaoEscolhidaId,
      correta,
    })
  }

  const aprovado = total > 0 && (acertos / total) >= 0.8

  // Persiste tentativa + respostas granulares em transação
  const tentativa = await prisma.$transaction(async (tx) => {
    const t = await tx.uPBQuizTentativa.create({
      data: { userId, temporadaId: params.temporadaId, acertos, total, aprovado },
    })
    if (respostasData.length > 0) {
      await tx.uPBRespostaUsuario.createMany({
        data: respostasData.map(r => ({ ...r, tentativaId: t.id })),
      })
    }
    return t
  })

  let certificado = null
  if (aprovado) {
    // Calcula validoAte com base em validadeDias da temporada
    const validoAte = temporada.validadeDias
      ? new Date(Date.now() + temporada.validadeDias * 24 * 60 * 60 * 1000)
      : null

    certificado = await prisma.uPBCertificado.upsert({
      where: { userId_temporadaId: { userId, temporadaId: params.temporadaId } },
      // Renovação: atualiza emitidoEm e validoAte (caso o cert estivesse expirado)
      update: { emitidoEm: new Date(), validoAte },
      create: { userId, temporadaId: params.temporadaId, validoAte },
    })

    const isNovo = certificado.createdAt.getTime() === certificado.emitidoEm.getTime()
    if (isNovo) {
      await notify(userId, 'Certificado emitido!', `Você foi aprovado na prova de "${temporada.titulo}" e ganhou seu certificado!`)
    }
  }

  return NextResponse.json({
    acertos,
    total,
    aprovado,
    percentual: total > 0 ? Math.round((acertos / total) * 100) : 0,
    tentativa,
    certificado,
  })
}
