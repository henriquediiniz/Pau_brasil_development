import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'
import { listarNewsletterGestao, newsletterPostSchema } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  return NextResponse.json(await listarNewsletterGestao())
}

export async function POST(req: NextRequest) {
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const parsed = newsletterPostSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const post = await prisma.newsletterPost.create({
    data: { ...parsed.data, createdById: auth.ctx.user.id },
  })
  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_NEWSLETTER_CRIADA',
    targetType: 'NewsletterPost',
    targetId: post.id,
    meta: { title: post.title, company: post.company },
  })
  revalidatePath('/')
  return NextResponse.json(post, { status: 201 })
}
