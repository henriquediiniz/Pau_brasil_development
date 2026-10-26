import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { isUpbAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'

// DELETE /api/admin/upb/temporadas/[id]/alunos/[userId]/zerar
// Apaga certificado, progresso de episódios e tentativas de quiz do aluno na temporada.
// A matrícula é regredida para PENDENTE (não deletada — mantém o registro de acesso).
export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string; userId: string }> }
) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: temporadaId, userId } = params

  const [temporada, user] = await Promise.all([
    prisma.uPBTemporada.findUnique({
      where: { id: temporadaId },
      select: { titulo: true, episodios: { select: { id: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ])

  if (!temporada) return NextResponse.json({ error: 'Temporada não encontrada' }, { status: 404 })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const episodioIds = temporada.episodios.map(e => e.id)

  await prisma.$transaction(async (tx) => {
    // Apaga respostas vinculadas às tentativas antes de apagar as tentativas
    const tentativas = await tx.uPBQuizTentativa.findMany({
      where: { temporadaId, userId },
      select: { id: true },
    })
    if (tentativas.length > 0) {
      await tx.uPBRespostaUsuario.deleteMany({
        where: { tentativaId: { in: tentativas.map(t => t.id) } },
      })
    }

    await Promise.all([
      tx.uPBCertificado.deleteMany({ where: { temporadaId, userId } }),
      tx.uPBQuizTentativa.deleteMany({ where: { temporadaId, userId } }),
      episodioIds.length > 0
        ? tx.uPBProgresso.deleteMany({ where: { userId, episodioId: { in: episodioIds } } })
        : Promise.resolve(),
      tx.uPBMatricula.updateMany({
        where: { temporadaId, userId },
        data: { status: 'PENDENTE', aprovadoPor: null, nota: null },
      }),
    ])
  })

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? actor.email ?? 'Admin',
    action: 'UPB_RESET',
    targetType: 'UPBTemporada',
    targetId: temporadaId,
    meta: { userId, userName: user.name, userEmail: user.email, temporadaTitulo: temporada.titulo },
  })

  return NextResponse.json({ ok: true })
}
