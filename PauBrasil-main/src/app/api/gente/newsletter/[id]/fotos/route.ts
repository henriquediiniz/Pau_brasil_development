import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'
import {
  NEWSLETTER_FOTO_MAX_BYTES,
  NEWSLETTER_FOTOS_POR_CAMPANHA,
  tipoDaImagem,
  urlFotoNewsletter,
} from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

const metaSchema = z.object({
  alt: z.string().trim().min(3).max(160),
  width: z.coerce.number().int().min(50).max(4000),
  height: z.coerce.number().int().min(50).max(4000),
  // Miniatura gerada no navegador (poucos KB); serve de fundo desfocado.
  blur: z.string().startsWith('data:image/').max(8000),
})

/** Recebe uma foto já reduzida no navegador (JPEG ou WebP) e a guarda no banco. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const post = await prisma.newsletterPost.findUnique({
    where: { id: params.id },
    select: { id: true, _count: { select: { photos: true } } },
  })
  if (!post) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  if (post._count.photos >= NEWSLETTER_FOTOS_POR_CAMPANHA) {
    return NextResponse.json(
      { error: `Limite de ${NEWSLETTER_FOTOS_POR_CAMPANHA} fotos por campanha` },
      { status: 400 },
    )
  }

  const form = await req.formData().catch(() => null)
  const arquivo = form?.get('arquivo')
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: 'Envie a foto no campo "arquivo"' }, { status: 400 })
  }
  if (arquivo.size > NEWSLETTER_FOTO_MAX_BYTES) {
    return NextResponse.json({ error: 'Foto grande demais depois da redução' }, { status: 400 })
  }
  const meta = metaSchema.safeParse(Object.fromEntries(form!.entries()))
  if (!meta.success) {
    return NextResponse.json({ error: 'Dados da foto inválidos', detalhes: meta.error.flatten() }, { status: 400 })
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const mimeType = tipoDaImagem(bytes)
  if (!mimeType) return NextResponse.json({ error: 'Use fotos JPEG ou WebP' }, { status: 400 })

  const foto = await prisma.newsletterPhoto.create({
    data: {
      postId: post.id,
      position: post._count.photos,
      alt: meta.data.alt,
      width: meta.data.width,
      height: meta.data.height,
      blur: meta.data.blur,
      mimeType,
      data: Buffer.from(bytes),
    },
    select: { id: true, alt: true, width: true, height: true, blur: true, position: true },
  })

  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_NEWSLETTER_FOTO_ADICIONADA',
    targetType: 'NewsletterPost',
    targetId: post.id,
    meta: { fotoId: foto.id, bytes: bytes.length },
  })
  revalidatePath('/')
  return NextResponse.json({ ...foto, src: urlFotoNewsletter(foto.id) }, { status: 201 })
}
