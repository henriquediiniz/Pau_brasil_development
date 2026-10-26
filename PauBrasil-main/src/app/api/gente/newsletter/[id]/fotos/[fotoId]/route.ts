import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string; fotoId: string }> }
) {
  const params = await props.params;
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const removida = await prisma.newsletterPhoto.deleteMany({
    where: { id: params.fotoId, postId: params.id },
  })
  if (removida.count === 0) return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })

  // Reajusta as posições para continuarem sequenciais.
  const restantes = await prisma.newsletterPhoto.findMany({
    where: { postId: params.id },
    select: { id: true },
    orderBy: { position: 'asc' },
  })
  await prisma.$transaction(
    restantes.map((foto, position) =>
      prisma.newsletterPhoto.update({ where: { id: foto.id }, data: { position } }),
    ),
  )

  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_NEWSLETTER_FOTO_REMOVIDA',
    targetType: 'NewsletterPost',
    targetId: params.id,
    meta: { fotoId: params.fotoId },
  })
  revalidatePath('/')
  return NextResponse.json({ ok: true })
}
