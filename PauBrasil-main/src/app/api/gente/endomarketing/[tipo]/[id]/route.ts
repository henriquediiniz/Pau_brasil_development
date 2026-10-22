import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'
import { SCHEMAS, ehTipoEndo, tabelaEndo } from '@/lib/endomarketing'

export const dynamic = 'force-dynamic'

type Params = { params: { tipo: string; id: string } }

const naoEncontrado = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025'

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!ehTipoEndo(params.tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 404 })
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  // Edição envia o registro completo: reaproveita a mesma validação da criação.
  const parsed = SCHEMAS[params.tipo].safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const item = await tabelaEndo(params.tipo).update({ where: { id: params.id }, data: parsed.data })
    await audit({
      ...autor(auth.ctx.user),
      action: 'GENTE_ENDOMARKETING_ATUALIZADO',
      targetType: `Endo:${params.tipo}`,
      targetId: params.id,
    })
    revalidatePath('/')
    revalidatePath('/nossa-gente')
    return NextResponse.json(item)
  } catch (e) {
    if (naoEncontrado(e)) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!ehTipoEndo(params.tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 404 })
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  try {
    await tabelaEndo(params.tipo).delete({ where: { id: params.id } })
  } catch (e) {
    if (naoEncontrado(e)) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    throw e
  }
  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_ENDOMARKETING_EXCLUIDO',
    targetType: `Endo:${params.tipo}`,
    targetId: params.id,
  })
  revalidatePath('/')
  revalidatePath('/nossa-gente')
  return NextResponse.json({ ok: true })
}
