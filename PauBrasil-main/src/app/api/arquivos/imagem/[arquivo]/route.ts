import { NextRequest, NextResponse } from 'next/server'
import { lerPrivado } from '@/lib/armazenamento'

export const dynamic = 'force-dynamic'

/**
 * Entrega imagens enviadas pelo portal (foto de perfil, capa da Universidade).
 * O nome é um UUID aleatório, então o endereço não é adivinhável; a imagem
 * nunca muda (trocar gera outro nome), o que permite cache longo.
 */
export async function GET(_req: NextRequest, props: { params: Promise<{ arquivo: string }> }) {
  const params = await props.params;
  if (!/^[A-Za-z0-9-]+\.(jpg|png|webp|gif)$/.test(params.arquivo)) {
    return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
  }

  const arquivo = await lerPrivado(`imagens/${params.arquivo}`).catch((error) => {
    console.error('[arquivos/imagem] falha ao buscar no Blob', error)
    return undefined
  })
  if (arquivo === undefined) return NextResponse.json({ error: 'Erro ao buscar a imagem' }, { status: 502 })
  if (arquivo === null) return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })

  return new NextResponse(arquivo.stream, {
    headers: {
      'Content-Type': arquivo.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
