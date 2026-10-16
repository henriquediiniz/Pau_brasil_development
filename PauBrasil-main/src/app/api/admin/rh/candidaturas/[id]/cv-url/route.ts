import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

const TTL_SECONDS = 3600

function buildSignedUrl(publicId: string, expiresAt: number): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey    = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const timestamp = Math.floor(Date.now() / 1000)

  const paramsToSign = `expires_at=${expiresAt}&public_id=${publicId}&timestamp=${timestamp}&type=upload`
  const signature = createHash('sha1').update(paramsToSign + apiSecret).digest('hex')

  const qs = new URLSearchParams({
    public_id:  publicId,
    type:       'upload',
    expires_at: String(expiresAt),
    timestamp:  String(timestamp),
    api_key:    apiKey,
    signature,
  }).toString()

  return `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${qs}`
}

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

  if (!candidatura.cvPublicId.startsWith('cvs/')) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary não configurado' }, { status: 500 })
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS
  const signedUrl = buildSignedUrl(candidatura.cvPublicId, expiresAt)

  // Proxy o arquivo pelo Next.js para garantir Content-Type e filename corretos
  const upstream = await fetch(signedUrl)
  if (!upstream.ok) {
    console.error('[cv-url] Cloudinary error:', upstream.status, await upstream.text())
    return NextResponse.json({ error: 'Erro ao buscar arquivo' }, { status: 502 })
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
  const safeFilename = encodeURIComponent(filename)

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${safeFilename}"`,
    },
  })
})
