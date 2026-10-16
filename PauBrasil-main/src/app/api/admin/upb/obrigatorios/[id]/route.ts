import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessCompanyScope, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const PATCH = withHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const obrigatorio = await prisma.uPBObrigatorio.findUnique({
    where: { id: params.id },
    select: { temporada: { select: { empresas: true } } },
  })
  if (!obrigatorio || !canAccessCompanyScope(actor, obrigatorio.temporada.empresas)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data: Record<string, any> = {}
  if (body.empresas !== undefined) data.empresas = body.empresas
  if (body.unidades !== undefined) data.unidades = body.unidades
  if (body.funcoes !== undefined) data.funcoes = body.funcoes
  if (body.prazo !== undefined) data.prazo = new Date(body.prazo)

  const updated = await prisma.uPBObrigatorio.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
})

export const DELETE = withHandler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const obrigatorio = await prisma.uPBObrigatorio.findUnique({
    where: { id: params.id },
    select: { temporada: { select: { empresas: true } } },
  })
  if (!obrigatorio || !canAccessCompanyScope(actor, obrigatorio.temporada.empresas)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.uPBObrigatorio.update({
    where: { id: params.id },
    data: { ativo: false },
  })

  return NextResponse.json({ ok: true })
})
