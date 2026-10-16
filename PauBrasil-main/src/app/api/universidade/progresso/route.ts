import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, getUpbEnrollmentStatus } from '@/lib/upb-access'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id

  const { episodioId } = await req.json()
  if (!episodioId || typeof episodioId !== 'string') {
    return NextResponse.json({ error: 'episodioId obrigatorio' }, { status: 400 })
  }

  const episodio = await prisma.uPBEpisodio.findUnique({
    where: { id: episodioId },
    select: {
      id: true,
      temporadaId: true,
      temporada: {
        select: {
          titulo: true,
          pontosNoCertificado: true,
          restricaoAcesso: true,
          empresas: true,
          unidades: true,
          funcoesComAcesso: true,
          matriculas: { where: { userId }, select: { status: true } },
          _count: { select: { questoes: true } },
        },
      },
    },
  })

  if (!episodio) return NextResponse.json({ error: 'Episodio nao encontrado' }, { status: 404 })
  if (!canAccessUpbAudience(actor, episodio.temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const matriculaStatus = getUpbEnrollmentStatus(actor, episodio.temporada, episodio.temporada.matriculas[0]?.status ?? null)
  if (episodio.temporada.restricaoAcesso && matriculaStatus !== 'APROVADO') {
    return NextResponse.json({ error: 'Acesso nao autorizado' }, { status: 403 })
  }

  const { progresso, certificado, novoCertificado } = await prisma.$transaction(async (tx) => {
    const progresso = await tx.uPBProgresso.upsert({
      where: { userId_episodioId: { userId, episodioId } },
      update: { concluidoEm: new Date() },
      create: { userId, episodioId, concluidoEm: new Date() },
    })

    const todos = await tx.uPBEpisodio.findMany({
      where: { temporadaId: episodio.temporadaId, publicado: true },
      select: { id: true, progressos: { where: { userId, concluidoEm: { not: null } } } },
    })

    const todosConcluidos = todos.length > 0 && todos.every((e) => e.progressos.length > 0)
    if (!todosConcluidos) return { progresso, certificado: null, novoCertificado: false }

    if ((episodio.temporada._count.questoes ?? 0) > 0) {
      return { progresso, certificado: null, novoCertificado: false }
    }

    const certExistente = await tx.uPBCertificado.findUnique({
      where: { userId_temporadaId: { userId, temporadaId: episodio.temporadaId } },
      select: { id: true },
    })
    const isNovoCertificado = !certExistente

    const certificado = await tx.uPBCertificado.upsert({
      where: { userId_temporadaId: { userId, temporadaId: episodio.temporadaId } },
      update: {},
      create: { userId, temporadaId: episodio.temporadaId },
    })

    if (!isNovoCertificado) {
      return { progresso, certificado, novoCertificado: false }
    }

    const pts = episodio.temporada.pontosNoCertificado ?? 0
    if (pts > 0) {
      const jaCreditado = await tx.pointsLedger.findFirst({
        where: { refType: 'UPBCertificado', refId: certificado.id },
      })

      if (!jaCreditado) {
        await tx.pointsLedger.create({
          data: {
            userId,
            kind: 'EARN',
            status: 'CONFIRMED',
            points: pts,
            refType: 'UPBCertificado',
            refId: certificado.id,
            note: `Certificado UPB: ${episodio.temporada.titulo}`,
          },
        })
      }
    }

    return { progresso, certificado, novoCertificado: true }
  })

  if (certificado && novoCertificado) {
    const pts = episodio.temporada.pontosNoCertificado ?? 0
    const notasPartes = [`Voce concluiu a temporada "${episodio.temporada.titulo}" da Universidade Pau Brasil.`]
    if (pts > 0) notasPartes.push(`+${pts} pontos creditados!`)
    void notify(userId, 'Certificado emitido!', notasPartes.join(' '))
  }

  return NextResponse.json({ progresso, certificado })
}
