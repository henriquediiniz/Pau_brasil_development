import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from '@/lib/zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { canAccessUpbAudience, getUpbEnrollmentStatus } from '@/lib/upb-access'

export const dynamic = 'force-dynamic'

const corpoSchema = z.object({
  episodioId: z.string().min(1).max(64),
  posicaoSeg: z.coerce.number().int().min(0).max(24 * 3600),
  duracaoSeg: z.coerce.number().int().min(1).max(24 * 3600).optional(),
})

/**
 * Salva o ponto em que o colaborador parou o vídeo (não marca como assistido).
 * Chamado pelo player a cada poucos segundos, ao pausar e ao sair da página
 * (sendBeacon), então precisa ser leve e tolerar chamadas repetidas.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)

  // sendBeacon envia como texto; aceita JSON em qualquer content-type.
  const parsed = corpoSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { episodioId, posicaoSeg, duracaoSeg } = parsed.data

  const episodio = await prisma.uPBEpisodio.findFirst({
    where: { id: episodioId, publicado: true, temporada: { ativo: true } },
    select: {
      temporada: {
        select: {
          restricaoAcesso: true,
          empresas: true,
          unidades: true,
          funcoesComAcesso: true,
          matriculas: { where: { userId: actor.id }, select: { status: true } },
        },
      },
    },
  })
  if (!episodio || !canAccessUpbAudience(actor, episodio.temporada)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const matricula = getUpbEnrollmentStatus(actor, episodio.temporada, episodio.temporada.matriculas[0]?.status ?? null)
  if (episodio.temporada.restricaoAcesso && matricula !== 'APROVADO') {
    return NextResponse.json({ error: 'Acesso nao autorizado' }, { status: 403 })
  }

  const agora = new Date()
  await prisma.uPBProgresso.upsert({
    where: { userId_episodioId: { userId: actor.id, episodioId } },
    update: { posicaoSeg, ...(duracaoSeg ? { duracaoSeg } : {}), vistoEm: agora },
    create: { userId: actor.id, episodioId, posicaoSeg, duracaoSeg: duracaoSeg ?? null, vistoEm: agora },
  })
  return NextResponse.json({ ok: true })
}

/** Último episódio em andamento do colaborador, para o card "Continue de onde parou". */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actor = await getEffectiveSessionUser(session.user)

  const candidatos = await prisma.uPBProgresso.findMany({
    where: {
      userId: actor.id,
      posicaoSeg: { gt: 0 },
      episodio: { publicado: true, temporada: { ativo: true } },
    },
    orderBy: { vistoEm: 'desc' },
    take: 5,
    select: {
      posicaoSeg: true,
      duracaoSeg: true,
      concluidoEm: true,
      vistoEm: true,
      episodio: {
        select: {
          id: true,
          titulo: true,
          duracaoMin: true,
          temporada: { select: { id: true, titulo: true, capa: true, empresas: true, unidades: true } },
        },
      },
    },
  })

  // Pula o que já terminou de assistir (quase no fim) e o que a pessoa não pode mais ver.
  const emAndamento = candidatos.find((p) => {
    const total = p.duracaoSeg ?? p.episodio.duracaoMin * 60
    const quaseNoFim = total > 0 && p.posicaoSeg >= total - 15
    return !quaseNoFim && canAccessUpbAudience(actor, p.episodio.temporada)
  })
  if (!emAndamento) return NextResponse.json(null)

  const { empresas: _e, unidades: _u, ...temporada } = emAndamento.episodio.temporada
  return NextResponse.json({
    posicaoSeg: emAndamento.posicaoSeg,
    duracaoSeg: emAndamento.duracaoSeg ?? emAndamento.episodio.duracaoMin * 60,
    vistoEm: emAndamento.vistoEm,
    episodio: { id: emAndamento.episodio.id, titulo: emAndamento.episodio.titulo },
    temporada,
  })
}
