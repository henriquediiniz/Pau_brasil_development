import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'
import { autenticarGente, autor } from '@/lib/gente/api'
import { ORDEM_GESTAO, SCHEMAS, ehTipoEndo, tabelaEndo } from '@/lib/endomarketing'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ tipo: string }> }

export async function GET(_req: NextRequest, props: Params) {
  const params = await props.params;
  if (!ehTipoEndo(params.tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 404 })
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  return NextResponse.json(await tabelaEndo(params.tipo).findMany({ orderBy: ORDEM_GESTAO[params.tipo] }))
}

export async function POST(req: NextRequest, props: Params) {
  const params = await props.params;
  if (!ehTipoEndo(params.tipo)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 404 })
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta

  const parsed = SCHEMAS[params.tipo].safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 400 })
  }

  const item = await tabelaEndo(params.tipo).create({
    data: { ...parsed.data, createdById: auth.ctx.user.id },
  })
  await audit({
    ...autor(auth.ctx.user),
    action: 'GENTE_ENDOMARKETING_CRIADO',
    targetType: `Endo:${params.tipo}`,
    targetId: String(item.id),
  })
  revalidatePath('/')
  revalidatePath('/nossa-gente')
  return NextResponse.json(item, { status: 201 })
}
