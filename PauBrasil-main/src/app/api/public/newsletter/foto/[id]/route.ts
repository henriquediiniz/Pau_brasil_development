import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autenticarGente } from '@/lib/gente/api'

export const dynamic = 'force-dynamic'

/**
 * Serve a foto de uma campanha da newsletter.
 * Campanha publicada: pública, com cache longo (uma foto nunca muda; editar = nova foto).
 * Campanha em rascunho: só para quem acessa o módulo Gente (pré-visualização).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const foto = await prisma.newsletterPhoto.findUnique({
    where: { id: params.id },
    select: { data: true, mimeType: true, post: { select: { published: true } } },
  })
  if (!foto) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  if (!foto.post.published) {
    const auth = await autenticarGente()
    if (!auth.ok) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(foto.data), {
    headers: {
      'Content-Type': foto.mimeType,
      'Cache-Control': foto.post.published
        ? 'public, max-age=31536000, immutable'
        : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
