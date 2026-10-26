import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, canAccessUpbSeason, getUpbEnrollmentStatus } from '@/lib/upb-access'

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  const userId = actor.id

  const meta = await prisma.uPBTemporada.findUnique({
    where: { id: params.id, ativo: true },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      capa: true,
      restricaoAcesso: true,
      empresas: true,
      unidades: true,
      funcoesComAcesso: true,
      preRequisitos: true,
      validadeDias: true,
      matriculas: { where: { userId }, select: { status: true } },
    },
  })

  if (!meta) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccessUpbAudience(actor, meta)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rawMatricula = meta.matriculas[0] ?? null
  const matriculaStatus = getUpbEnrollmentStatus(actor, meta, rawMatricula?.status ?? null)
  const acessoPermitido = canAccessUpbSeason(actor, meta, rawMatricula?.status ?? null)

  if (!acessoPermitido) {
    return NextResponse.json({
      id: meta.id,
      titulo: meta.titulo,
      descricao: meta.descricao,
      capa: meta.capa,
      restricaoAcesso: true,
      acessoBloqueado: true,
      matriculaStatus,
      episodios: [],
      certificado: null,
      temProva: false,
      quizAprovado: false,
      preRequisitos: meta.preRequisitos,
      preRequisitosStatus: [],
    })
  }

  const now = new Date()

  // Resolve status de cada pré-requisito para exibição no UI
  let preRequisitosStatus: Array<{ temporadaId: string; titulo: string; concluido: boolean; expirado: boolean }> = []
  if (meta.preRequisitos.length > 0) {
    const [prereqTemporadas, prereqCerts] = await Promise.all([
      prisma.uPBTemporada.findMany({
        where: { id: { in: meta.preRequisitos } },
        select: { id: true, titulo: true },
      }),
      prisma.uPBCertificado.findMany({
        where: { userId, temporadaId: { in: meta.preRequisitos } },
        select: { temporadaId: true, validoAte: true },
      }),
    ])

    const certMap = new Map(prereqCerts.map(c => [c.temporadaId, c]))

    preRequisitosStatus = prereqTemporadas.map(t => {
      const cert = certMap.get(t.id)
      const expirado = cert ? (cert.validoAte !== null && cert.validoAte <= now) : false
      return {
        temporadaId: t.id,
        titulo: t.titulo,
        concluido: !!cert && !expirado,
        expirado,
      }
    })
  }

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: params.id },
    include: {
      episodios: {
        where: { publicado: true },
        orderBy: { ordem: 'asc' },
        include: { progressos: { where: { userId } } },
      },
      certificados: { where: { userId } },
      tentativas: { where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { questoes: true } },
    },
  })

  if (!temporada) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rawCert = temporada.certificados[0] ?? null
  // Certificado expirado é tratado como inexistente para fins de acesso
  const certValido = rawCert && (rawCert.validoAte === null || rawCert.validoAte > now)
    ? rawCert
    : null

  const ultimaTentativa = temporada.tentativas[0] ?? null

  return NextResponse.json({
    ...temporada,
    acessoBloqueado: false,
    matriculaStatus,
    certificado: certValido,
    certExpirado: rawCert !== null && certValido === null,
    temProva: temporada._count.questoes > 0,
    quizAprovado: ultimaTentativa?.aprovado ?? false,
    preRequisitosStatus,
  })
}
