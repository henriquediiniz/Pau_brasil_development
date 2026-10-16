import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { destroyUploadedCv } from '@/lib/carreiras-cv'
import { log } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/rh/candidaturas/[id]/erasure
 *
 * Direito ao esquecimento (LGPD art. 18 §1 VI).
 * Remove permanentemente todos os dados pessoais do candidato:
 * - Registro de Candidatura e notas associadas
 * - CV armazenado no Cloudinary
 * Gera audit log antes de deletar para rastreabilidade regulatória.
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const candidatura = await prisma.candidatura.findUnique({
    where: { id: params.id },
    select: {
      id:    true,
      nome:  true,
      email: true,
      cvPublicId: true,
    },
  })

  if (!candidatura) return NextResponse.json({ error: 'Candidatura não encontrada' }, { status: 404 })

  // Audit antes de deletar — registrar quem solicitou e quais dados serão removidos
  await audit({
    actorId:    session.user.id,
    actorName:  session.user.name ?? session.user.email ?? '',
    action:     'CANDIDATURA_ERASURE_LGPD',
    targetType: 'Candidatura',
    targetId:   candidatura.id,
    meta: {
      nomeAnonimizado: candidatura.nome.split(' ')[0] + ' ***',
      emailDominio:    candidatura.email.split('@')[1] ?? '***',
      tinhaCV:         !!candidatura.cvPublicId,
      solicitadoPor:   session.user.email,
    },
  })

  // Deletar CV do Cloudinary (best-effort — não bloqueia a deleção local se Cloudinary falhar)
  if (candidatura.cvPublicId) {
    try {
      await destroyUploadedCv(candidatura.cvPublicId)
    } catch {
      // Falha no Cloudinary não impede a erasure do banco — logar e continuar
      log.error({ err: { publicId: candidatura.cvPublicId } }, '[erasure] falha ao deletar CV do Cloudinary')
    }
  }

  // Deletar candidatura — NotaCandidatura é deletada via cascade (onDelete: Cascade no schema)
  await prisma.candidatura.delete({ where: { id: params.id } })

  return NextResponse.json({ deleted: true })
}
