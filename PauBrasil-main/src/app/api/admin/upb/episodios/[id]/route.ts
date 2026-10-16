import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessCompanyScope, isUpbAdmin, type SessionUser } from '@/lib/auth-helpers'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/

function normalizeVideoUrl(url: string): string | null {
  try {
    const u = new URL(url)
    let id: string | null = null
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
    else if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v')
    if (!id || !YT_ID_RE.test(id)) return null
    return `https://www.youtube.com/watch?v=${id}`
  } catch {
    return null
  }
}

const updateSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descricao: z.string().max(1000).nullable().optional(),
  videoUrl: z.string().url().optional(),
  duracaoMin: z.number().int().min(0).optional(),
  ordem: z.number().int().min(0).optional(),
  publicado: z.boolean().optional(),
})

async function checkEpisodioAccess(id: string, actor: SessionUser): Promise<boolean> {
  const episodio = await prisma.uPBEpisodio.findUnique({
    where: { id },
    select: { temporada: { select: { empresas: true } } },
  })

  return episodio != null && canAccessCompanyScope(actor, episodio.temporada.empresas)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await checkEpisodioAccess(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { videoUrl, ...rest } = parsed.data
  let normalizedUrl: string | undefined

  if (videoUrl !== undefined) {
    const url = normalizeVideoUrl(videoUrl)
    if (!url) return NextResponse.json({ error: 'URL de video YouTube invalida' }, { status: 400 })
    normalizedUrl = url
  }

  const episodio = await prisma.uPBEpisodio.update({
    where: { id: params.id },
    data: { ...rest, ...(normalizedUrl ? { videoUrl: normalizedUrl } : {}) },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'UPB_EPISODIO_ATUALIZADO',
    targetType: 'UPBEpisodio',
    targetId: params.id,
    meta: { fields: Object.keys(parsed.data), titulo: episodio.titulo },
  })

  return NextResponse.json(episodio)
}
