import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'
import { newsletterPatchSchema } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const post = await prisma.newsletterPost.findUnique({
    where: { id: params.id },
    include: {
      photos: {
        select: { id: true, alt: true, width: true, height: true, blur: true, position: true },
        orderBy: { position: 'asc' },
      },
    },
  })
  if (!post) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const parsed = newsletterPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }
  const { photos, ...campos } = parsed.data

  const existente = await prisma.newsletterPost.findUnique({
    where: { id: params.id },
    select: { id: true, photos: { select: { id: true } } },
  })
  if (!existente) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  if (photos) {
    const ids = new Set(existente.photos.map((f) => f.id))
    if (photos.length !== ids.size || photos.some((f) => !ids.has(f.id))) {
      return NextResponse.json({ error: 'A lista de fotos não confere com a campanha' }, { status: 400 })
    }
  }

  await prisma.$transaction([
    prisma.newsletterPost.update({ where: { id: params.id }, data: campos }),
    ...(photos ?? []).map((foto, position) =>
      prisma.newsletterPhoto.update({ where: { id: foto.id }, data: { alt: foto.alt, position } }),
    ),
  ])

  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_NEWSLETTER_ATUALIZADA',
    targetType: 'NewsletterPost',
    targetId: params.id,
    meta: { campos: Object.keys(campos), fotosReordenadas: !!photos },
  })
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const post = await prisma.newsletterPost
    .delete({ where: { id: params.id }, select: { id: true, title: true } })
    .catch(() => null)
  if (!post) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })

  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_NEWSLETTER_EXCLUIDA',
    targetType: 'NewsletterPost',
    targetId: post.id,
    meta: { title: post.title },
  })
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
