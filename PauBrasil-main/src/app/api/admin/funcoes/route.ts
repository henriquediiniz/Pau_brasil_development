import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageEmpresa, isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withHandler(async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.empresaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // SYS_ADMIN: todas as funcoes. isEmpresaAdmin: apenas funcoes da propria empresa.
  const where = isSysAdmin(actor) ? {} : { empresaId: actor.empresaId }

  const functions = await prisma.function.findMany({
    where,
    include: {
      tasks: {
        orderBy: { points: 'desc' },
        select: {
          id: true,
          title: true,
          points: true,
          frequency: true,
          requireApproval: true,
          requireEvidence: true,
          active: true,
          daysOfWeek: true,
          nextTaskDefinitionId: true,
          nextTaskDefinition: {
            select: {
              id: true,
              title: true,
              function: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(functions, {
    headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
  })
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!canManageEmpresa(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.empresaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome e obrigatorio' }, { status: 400 })

  // SYS_ADMIN cria global (empresaId null); isEmpresaAdmin cria vinculada a sua empresa.
  const empresaId = isSysAdmin(actor) ? null : actor.empresaId

  const func = await prisma.function.create({ data: { name, description, empresaId } })
  return NextResponse.json(func)
})
