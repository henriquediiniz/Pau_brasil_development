import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAccessCompanyScope, isSysAdmin, isUpbAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { withHandler } from '@/lib/api-handler'

export const GET = withHandler(async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!isSysAdmin(actor) && !actor.company) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const obrigatorios = await prisma.uPBObrigatorio.findMany({
    where: {
      ativo: true,
      ...(isSysAdmin(actor) ? {} : { temporada: { empresas: { has: actor.company as string } } }),
    },
    include: { temporada: { select: { id: true, titulo: true, empresas: true } } },
    orderBy: { prazo: 'asc' },
  })

  const allFuncaoIds = Array.from(new Set(obrigatorios.flatMap(o => o.funcoes)))
  const funcoesMap: Record<string, string> = {}
  if (allFuncaoIds.length > 0) {
    const funcoes = await prisma.function.findMany({
      where: { id: { in: allFuncaoIds } },
      select: { id: true, name: true },
    })
    funcoes.forEach(f => { funcoesMap[f.id] = f.name })
  }

  const result = await Promise.all(obrigatorios.map(async (o) => {
    const empresasAlvo = o.empresas.length > 0 ? o.empresas : o.temporada.empresas
    const funcoesAlvo = o.funcoes

    const userWhere = {
      isActive: true,
      ...(empresasAlvo.length > 0 ? { company: { in: empresasAlvo } } : {}),
      ...(funcoesAlvo.length > 0 ? { functionId: { in: funcoesAlvo } } : {}),
    }

    const [elegiveis, concluidos] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.uPBCertificado.count({
        where: {
          temporadaId: o.temporadaId,
          user: userWhere,
        },
      }),
    ])

    return {
      id: o.id,
      temporadaId: o.temporadaId,
      temporadaTitulo: o.temporada.titulo,
      empresas: o.empresas,
      unidades: o.unidades,
      funcoes: o.funcoes,
      funcoesNomes: o.funcoes.map(id => funcoesMap[id] ?? id),
      prazo: o.prazo.toISOString(),
      elegiveis,
      concluidos,
      createdAt: o.createdAt.toISOString(),
    }
  }))

  return NextResponse.json(result)
})

export const POST = withHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const actor = await getEffectiveSessionUser(session.user)
  if (!isUpbAdmin(actor)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { temporadaId, empresas, unidades, funcoes, prazo } = await req.json()
  if (!temporadaId || !prazo) return NextResponse.json({ error: 'temporadaId e prazo sao obrigatorios' }, { status: 400 })

  const temporada = await prisma.uPBTemporada.findUnique({
    where: { id: temporadaId },
    select: { id: true, empresas: true },
  })
  if (!temporada) return NextResponse.json({ error: 'Temporada nao encontrada' }, { status: 404 })
  if (!canAccessCompanyScope(actor, temporada.empresas)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const obrigatorio = await prisma.uPBObrigatorio.create({
    data: {
      temporadaId,
      empresas: empresas ?? [],
      unidades: unidades ?? [],
      funcoes: funcoes ?? [],
      prazo: new Date(prazo),
    },
  })

  return NextResponse.json(obrigatorio, { status: 201 })
})
