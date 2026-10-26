import { NextRequest, NextResponse } from 'next/server'
import { put, del, get } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { audit } from '@/lib/audit'
import { withHandler } from '@/lib/api-handler'
import { canViewDadoSensivel } from '@/lib/auth-helpers'
import { autenticarGente, autor } from '@/lib/gente/api'
import { LAUDO_MIME_ACEITOS, LAUDO_TAMANHO_MAXIMO } from '@/lib/gente/pcd'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Laudo de PCD — dado de saúde, art. 11 da LGPD.
 *
 * Foi exatamente este arquivo que ficou publicamente exposto no Firestore do
 * app antigo, em base64 dentro de um documento com `allow read: if true`.
 * Aqui ele vive em blob privado, a chave nunca sai numa listagem, e toda
 * leitura exige `canViewDadoSensivel` e fica registrada **antes** de servir —
 * o evento auditável é o acesso, não o sucesso do download.
 */

async function carregar(id: string, escopo: Record<string, unknown>) {
  return prisma.quadroPcd.findFirst({
    where: { id, ...escopo },
    select: {
      id: true,
      nome: true,
      laudoBlobKey: true,
      laudoOriginalFilename: true,
      laudoMimeType: true,
      operacao: { select: { nome: true } },
    },
  })
}

// ─── GET: entrega o laudo ─────────────────────────────────────────────────────

export const GET = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente()
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (!canViewDadoSensivel(user)) {
    return NextResponse.json(
      { error: 'Você não tem permissão para ver o laudo' },
      { status: 403 }
    )
  }

  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const pcd = await carregar(params.id, escopo)
  if (!pcd) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (!pcd.laudoBlobKey) {
    return NextResponse.json({ error: 'Esta pessoa não tem laudo anexado' }, { status: 404 })
  }

  // Auditoria antes de buscar o arquivo.
  await audit({
    ...autor(user),
    action: 'GENTE_PCD_LAUDO_ACESSADO',
    targetType: 'QuadroPcd',
    targetId: pcd.id,
    meta: { nome: pcd.nome, operacao: pcd.operacao?.nome },
  })

  /*
    `get` do SDK, **nao** `fetch` na URL.

    O blob e privado: a URL sozinha nao abre, e um `fetch` cru nela volta 403.
    Era esse o bug — o laudo subia normalmente e so a leitura falhava, com
    "Erro ao buscar o arquivo". O `get` assina a requisicao com o
    `BLOB_READ_WRITE_TOKEN`, que e o que torna o arquivo alcancavel sem
    torna-lo publico.
  */
  let arquivo
  try {
    arquivo = await get(pcd.laudoBlobKey, { access: 'private' })
  } catch (e) {
    console.error('[gente/laudo] falha ao buscar blob', e)
    return NextResponse.json({ error: 'Erro ao buscar o arquivo' }, { status: 502 })
  }

  if (!arquivo || arquivo.statusCode !== 200) {
    // O cadastro aponta para um arquivo que nao esta mais no armazenamento.
    // Dizer isso e melhor que "erro": o RH sabe que precisa anexar de novo.
    console.error('[gente/laudo] blob ausente:', pcd.id)
    return NextResponse.json(
      { error: 'O arquivo do laudo não foi encontrado no armazenamento. Anexe o laudo novamente.' },
      { status: 404 }
    )
  }

  const filename = pcd.laudoOriginalFilename ?? `laudo_${pcd.nome.replace(/\s+/g, '_')}.pdf`

  return new NextResponse(arquivo.stream, {
    headers: {
      'Content-Type': pcd.laudoMimeType ?? arquivo.blob.contentType ?? 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      // Dado de saude nao fica em cache de navegador nem de CDN.
      'Cache-Control': 'no-store, private',
    },
  })
})

// ─── POST: anexa o laudo ──────────────────────────────────────────────────────

export const POST = withHandler<Ctx>(async (req: NextRequest, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (!canViewDadoSensivel(user)) {
    return NextResponse.json({ error: 'Sem permissão para anexar laudo' }, { status: 403 })
  }
  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const pcd = await carregar(params.id, escopo)
  if (!pcd) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Armazenamento de arquivos não configurado' }, { status: 500 })
  }

  const form = await req.formData()
  const arquivo = form.get('arquivo')

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: 'Envie o arquivo no campo "arquivo"' }, { status: 400 })
  }
  if (arquivo.size > LAUDO_TAMANHO_MAXIMO) {
    return NextResponse.json(
      { error: `Arquivo maior que ${LAUDO_TAMANHO_MAXIMO / 1024 / 1024} MB` },
      { status: 400 }
    )
  }
  if (!(LAUDO_MIME_ACEITOS as readonly string[]).includes(arquivo.type)) {
    return NextResponse.json(
      { error: 'Formato não aceito. Envie PDF, JPEG, PNG ou WebP.' },
      { status: 400 }
    )
  }

  const extensao = arquivo.name.split('.').pop() ?? 'pdf'
  const chave = `laudos-pcd/${pcd.id}-${Date.now()}.${extensao}`

  const blob = await put(chave, arquivo, {
    access: 'private',
    contentType: arquivo.type,
    addRandomSuffix: false,
  })

  // Trocar o laudo apaga o anterior: guardar versões antigas de dado de saúde
  // sem necessidade aumenta a superfície exposta sem benefício.
  const anterior = pcd.laudoBlobKey
  if (anterior) {
    await del(anterior).catch((e) => console.error('[gente/laudo] falha ao apagar anterior', e))
  }

  await prisma.quadroPcd.update({
    where: { id: pcd.id },
    data: {
      laudoBlobKey: blob.url,
      laudoOriginalFilename: arquivo.name,
      laudoMimeType: arquivo.type,
      laudoSizeBytes: arquivo.size,
    },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_LAUDO_ANEXADO',
    targetType: 'QuadroPcd',
    targetId: pcd.id,
    meta: { nome: pcd.nome, tamanhoBytes: arquivo.size, substituiuAnterior: !!anterior },
  })

  return NextResponse.json({ ok: true, temLaudo: true })
})

// ─── DELETE: remove o laudo ───────────────────────────────────────────────────

export const DELETE = withHandler<Ctx>(async (_req, ctx) => {
  const params = await ctx.params
  const auth = await autenticarGente({ escrita: true })
  if (!auth.ok) return auth.resposta
  const { user, where: escopo } = auth.ctx

  if (!canViewDadoSensivel(user)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  if (escopo === null) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const pcd = await carregar(params.id, escopo)
  if (!pcd) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  if (!pcd.laudoBlobKey) return NextResponse.json({ ok: true, temLaudo: false })

  await del(pcd.laudoBlobKey).catch((e) => console.error('[gente/laudo] falha ao apagar', e))

  await prisma.quadroPcd.update({
    where: { id: pcd.id },
    data: {
      laudoBlobKey: null,
      laudoOriginalFilename: null,
      laudoMimeType: null,
      laudoSizeBytes: null,
    },
  })

  await audit({
    ...autor(user),
    action: 'GENTE_PCD_LAUDO_REMOVIDO',
    targetType: 'QuadroPcd',
    targetId: pcd.id,
    meta: { nome: pcd.nome },
  })

  return NextResponse.json({ ok: true, temLaudo: false })
})
