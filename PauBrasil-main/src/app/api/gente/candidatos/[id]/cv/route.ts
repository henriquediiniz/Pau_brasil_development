import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { autenticarGente, autor } from '@/lib/gente/api'
import {
  MENSAGEM_SEM_ARMAZENAMENTO,
  armazenamentoConfigurado,
  chaveDeCvValida,
  lerPrivado,
} from '@/lib/armazenamento'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Entrega o currículo do candidato.
 *
 * O arquivo é privado no Vercel Blob: nunca sai na listagem nem no detalhe,
 * só por aqui, com registro em auditoria **antes** de servir.
 * Currículo é dado pessoal: quem abriu e quando precisa ficar registrado
 * mesmo que o download falhe depois.
 */
export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
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
  if (!chaveDeCvValida(candidato.cvPublicId)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (!armazenamentoConfigurado()) {
    return NextResponse.json({ error: MENSAGEM_SEM_ARMAZENAMENTO }, { status: 500 })
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

  const arquivo = await lerPrivado(candidato.cvPublicId).catch((error) => {
    console.error('[gente/cv] falha ao buscar no Blob', error)
    return undefined
  })
  if (arquivo === undefined) {
    return NextResponse.json({ error: 'Erro ao buscar o arquivo' }, { status: 502 })
  }
  if (arquivo === null) {
    return NextResponse.json(
      { error: 'O arquivo do currículo não foi encontrado no armazenamento.' },
      { status: 404 },
    )
  }

  const filename =
    candidato.cvOriginalFilename ?? `cv_${candidato.nome.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(arquivo.stream, {
    headers: {
      'Content-Type': candidato.cvMimeType ?? 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'no-store, private',
    },
  })
})
