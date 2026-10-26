import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { isSysAdmin } from '@/lib/auth-helpers'
import { getEffectiveSessionUser } from '@/lib/session-user'

// Somente SYS_ADMIN pode purgar contas.
// A purga libera o e-mail para novo cadastro, preservando logs de auditoria
// (que registram o nome da pessoa, não o userId).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(actor)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params

  // Não permitir auto-purga
  if (id === actor.id) {
    return NextResponse.json({ error: 'Não é possível purgar a própria conta.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const nome = user.name
  const emailPurgado = user.email

  await prisma.$transaction(async (tx) => {
    // 1. Null out FKs opcionais que referenciam este usuário
    await tx.uPBMatricula.updateMany({ where: { aprovadoPor: id }, data: { aprovadoPor: null } })
    await tx.user.updateMany({ where: { managerId: id }, data: { managerId: null } })

    // 2. Deletar registros de participação próprios
    await tx.pushSubscription.deleteMany({ where: { userId: id } })
    await tx.notification.deleteMany({ where: { userId: id } })
    await tx.uPBCertificado.deleteMany({ where: { userId: id } })
    await tx.uPBProgresso.deleteMany({ where: { userId: id } })
    await tx.uPBQuizTentativa.deleteMany({ where: { userId: id } })
    await tx.uPBMatricula.deleteMany({ where: { userId: id } })
    await tx.notaCandidatura.deleteMany({ where: { autorId: id } })

    // 4. Deletar o usuário — e-mail agora fica livre
    await tx.user.delete({ where: { id } })
  })

  await audit({
    actorId: actor.id,
    actorName: actor.name ?? actor.email ?? 'SYS_ADMIN',
    action: 'USER_PURGED',
    targetType: 'User',
    targetId: id,
    meta: { nome, emailPurgado },
  })

  return NextResponse.json({ ok: true, emailLiberado: emailPurgado })
}
