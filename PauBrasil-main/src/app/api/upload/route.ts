import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
  MENSAGEM_SEM_ARMAZENAMENTO,
  armazenamentoConfigurado,
  novaChaveImagem,
  salvarPrivado,
  urlDaImagem,
} from '@/lib/armazenamento'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/** Tipo pelo conteúdo do arquivo (não pela extensão nem pelo cabeçalho do envio). */
function tipoDaImagem(bytes: Buffer): { mime: string; extensao: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', extensao: 'jpg' }
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: 'image/png', extensao: 'png' }
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP')
    return { mime: 'image/webp', extensao: 'webp' }
  if (bytes.subarray(0, 3).toString('ascii') === 'GIF') return { mime: 'image/gif', extensao: 'gif' }
  return null
}

/**
 * Upload de imagem do portal (foto de perfil, capa de temporada da Universidade).
 * Grava no Vercel Blob privado e devolve o endereço interno que entrega a imagem.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!armazenamentoConfigurado()) {
    console.error('[upload] BLOB_READ_WRITE_TOKEN não configurado')
    return NextResponse.json({ error: MENSAGEM_SEM_ARMAZENAMENTO }, { status: 500 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 10 MB)' }, { status: 413 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const tipo = tipoDaImagem(bytes)
  if (!tipo) {
    return NextResponse.json({ error: 'Apenas imagens JPEG, PNG, WebP ou GIF são permitidas' }, { status: 400 })
  }

  try {
    const { chave } = await salvarPrivado(novaChaveImagem(tipo.extensao), bytes, tipo.mime)
    return NextResponse.json({ url: urlDaImagem(chave) })
  } catch (error) {
    console.error('[upload] falha ao salvar no Blob', error)
    return NextResponse.json({ error: 'Upload falhou. Tente novamente.' }, { status: 502 })
  }
}
