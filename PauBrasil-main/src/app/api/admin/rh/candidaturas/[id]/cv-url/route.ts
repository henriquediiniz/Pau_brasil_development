import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import {
  MENSAGEM_SEM_ARMAZENAMENTO,
  armazenamentoConfigurado,
  chaveDeCvValida,
  lerPrivado,
} from '@/lib/armazenamento'

export const dynamic = 'force-dynamic'

/** Entrega o currículo de uma candidatura do Banco de Talentos (arquivo privado no Vercel Blob). */
export const GET = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: params.id },
    select: { id: true, cvPublicId: true, cvOriginalFilename: true, nome: true },
  })

  if (!candidatura) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (!candidatura.cvPublicId) {
    return NextResponse.json({ error: 'Currículo não disponível — o arquivo foi removido.' }, { status: 410 })
  }

  if (!chaveDeCvValida(candidatura.cvPublicId)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (!armazenamentoConfigurado()) {
    return NextResponse.json({ error: MENSAGEM_SEM_ARMAZENAMENTO }, { status: 500 })
  }

  const arquivo = await lerPrivado(candidatura.cvPublicId).catch((error) => {
    console.error('[cv-url] falha ao buscar no Blob', error)
    return undefined
  })
  if (arquivo === undefined) return NextResponse.json({ error: 'Erro ao buscar arquivo' }, { status: 502 })
  if (arquivo === null) {
    return NextResponse.json({ error: 'O arquivo do currículo não foi encontrado no armazenamento.' }, { status: 404 })
  }

  // Audit log — fire-and-forget
  audit({
    actorId:    session.user.id,
    actorName:  session.user.name ?? session.user.email ?? '',
    action:     'CANDIDATURA_CV_ACESSADO',
    targetType: 'Candidatura',
    targetId:   params.id,
    meta:       { candidatoNome: candidatura.nome },
  }).catch(console.error)

  const filename = candidatura.cvOriginalFilename ?? `cv_${candidatura.nome.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(arquivo.stream, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      // Dado pessoal: sem cache de navegador nem de CDN.
      'Cache-Control':       'no-store, private',
    },
  })
})
