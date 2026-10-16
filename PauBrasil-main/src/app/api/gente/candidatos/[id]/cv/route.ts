import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import { CV_TTL_SECONDS, buildCvSignedUrl, cloudinaryConfigurado } from '@/lib/cv-signed-url'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

/**
 * Entrega o currículo do candidato.
 *
 * A URL do arquivo nunca sai na listagem nem no detalhe — só por aqui, com
 * link assinado de vida curta e registro em auditoria **antes** de servir.
 * Currículo é dado pessoal: quem abriu e quando precisa ficar registrado
 * mesmo que o download falhe depois.
 */
export const GET = withHandler<Ctx>(async (_req, { params }) => {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (escopo === null) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  const candidato = await prisma.recCandidato.findFirst({
    where: { id: params.id, ...escopo },
    select: {
      id: true,
      nome: true,
      cvPublicId: true,
      cvOriginalFilename: true,
      cvMimeType: true,
      candidaturaId: true,
    },
  })

  if (!candidato) {
    return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
  }

  if (!candidato.cvPublicId) {
    return NextResponse.json({ error: 'Este candidato não tem currículo anexado' }, { status: 404 })
  }

  // Mesma checagem do Banco de Talentos: só serve o que está na pasta de CVs.
  if (!candidato.cvPublicId.startsWith('cvs/')) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (!cloudinaryConfigurado()) {
    return NextResponse.json({ error: 'Cloudinary não configurado' }, { status: 500 })
  }

  // Auditoria antes de servir — o acesso ao dado pessoal é o evento, não o
  // sucesso do download.
  await audit({
    ...autor(user),
    action: 'GENTE_CANDIDATO_CV_ACESSADO',
    targetType: 'RecCandidato',
    targetId: candidato.id,
    meta: {
      candidatoNome: candidato.nome,
      vinhaDoBancoDeTalentos: !!candidato.candidaturaId,
    },
  })

  const expiresAt = Math.floor(Date.now() / 1000) + CV_TTL_SECONDS
  const upstream = await fetch(buildCvSignedUrl(candidato.cvPublicId, expiresAt))

  if (!upstream.ok) {
    console.error('[gente/cv] Cloudinary error:', upstream.status)
    return NextResponse.json({ error: 'Erro ao buscar o arquivo' }, { status: 502 })
  }

  const filename =
    candidato.cvOriginalFilename ?? `cv_${candidato.nome.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': candidato.cvMimeType ?? 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
    },
  })
})
