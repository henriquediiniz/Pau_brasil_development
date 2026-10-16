import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageEmpresa, isSysAdmin, type SessionUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

async function checkAccess(funcaoId: string, actor: SessionUser) {
  if (isSysAdmin(actor)) return true
  if (!actor.isEmpresaAdmin || !actor.empresaId) return false

  const funcao = await prisma.function.findUnique({
    where: { id: funcaoId },
    select: { empresaId: true },
  })

  return funcao?.empresaId === actor.empresaId
}

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await checkAccess(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })

  const func = await prisma.function.update({
    where: { id: params.id },
    data: { name, description: description || null },
  })

  return NextResponse.json(func)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!await checkAccess(params.id, actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const usersWithFunc = await prisma.user.count({ where: { functionId: params.id } })
  if (usersWithFunc > 0) {
    return NextResponse.json(
      { error: `Nao e possivel excluir: ${usersWithFunc} colaborador(es) vinculado(s) a esta funcao.` },
      { status: 409 }
    )
  }

  await prisma.taskDefinition.deleteMany({ where: { functionId: params.id } })
  await prisma.function.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
})
