import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSysAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { getEffectiveSessionUser } from '@/lib/session-user'
import { z, mensagemDeValidacao } from '@/lib/zod'

export const dynamic = 'force-dynamic'

function toSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const createSchema = z.object({
  nome: z.string().min(2).max(100),
  slug: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { nome: 'asc' },
    include: {
      operacoes: { orderBy: { ordem: 'asc' } },
      _count: { select: { usuarios: { where: { isActive: true } } } },
      usuarios: {
        where: { isEmpresaAdmin: true, isActive: true },
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json(empresas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getEffectiveSessionUser(session.user)
  if (!isSysAdmin(user)) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: mensagemDeValidacao(parsed.error), detalhes: parsed.error.flatten() }, { status: 400 })

  const { nome } = parsed.data
  const slugVal = parsed.data.slug || toSlug(nome)

  try {
    const empresa = await prisma.empresa.create({
      data: { nome, slug: slugVal },
      include: { operacoes: true, _count: { select: { usuarios: true } } },
    })
    return NextResponse.json(empresa, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Empresa ja cadastrada' }, { status: 409 })
  }
}
