import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canAccessCompanyScope, isUpbAdmin } from '@/lib/auth-helpers'
import { audit } from '@/lib/audit'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z } from 'zod'

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    return null
  } catch {
    return null
  }
}

function normalizeVideoUrl(url: string): string | null {
  const id = extractYoutubeId(url)
  if (!id || !YT_ID_RE.test(id)) return null
  return `https://www.youtube.com/watch?v=${id}`
}

const createSchema = z.object({
  temporadaId: z.string().min(1),
  titulo: z.string().min(1).max(200),
  descricao: z.string().max(1000).optional(),
  videoUrl: z.string().url(),
  duracaoMin: z.number().int().min(0).default(0),
  ordem: z.number().int().min(0).default(0),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: parsed.data.temporadaId },
    select: { id: true, empresas: true },
  })
  if (!temporada) return NextResponse.json({ error: 'Temporada nao encontrada' }, { status: 404 })
  if (!canAccessCompanyScope(actor, temporada.empresas)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const normalizedUrl = normalizeVideoUrl(parsed.data.videoUrl)
  if (!normalizedUrl) return NextResponse.json({ error: 'URL de video YouTube invalida' }, { status: 400 })

  const episodio = await prisma.uPBEpisodio.create({
    data: { ...parsed.data, videoUrl: normalizedUrl },
  })

  void audit({
    actorId: actor.id,
    actorName: actor.name ?? 'Admin',
    action: 'UPB_EPISODIO_CRIADO',
    targetType: 'UPBEpisodio',
    targetId: episodio.id,
    meta: { titulo: episodio.titulo, temporadaId: episodio.temporadaId },
  })

  return NextResponse.json(episodio)
}
