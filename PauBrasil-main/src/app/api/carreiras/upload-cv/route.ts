import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { armazenamentoConfigurado, novaChaveCv, salvarPrivado } from '@/lib/armazenamento'
import { consumirTentativa, ipDe } from '@/lib/limite-tentativas'

export const dynamic = 'force-dynamic'

import { CV_MAX_BYTES, CV_MAX_TEXTO } from '@/lib/carreiras-perfil'
const PDF_MAGIC = '%PDF'

export async function POST(req: NextRequest) {
  if (!(await consumirTentativa('uploadCv', ipDe(req))).ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
  }

  // Validar tamanho
  if (file.size > CV_MAX_BYTES) {
    return NextResponse.json({ error: `Arquivo muito grande. Máximo ${CV_MAX_TEXTO}.` }, { status: 400 })
  }

  // Validar MIME type declarado
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 })
  }

  // Validar assinatura real do arquivo (primeiros 4 bytes = %PDF)
  const buffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(buffer)
  const header = fileBuffer.subarray(0, 4).toString('ascii')
  if (!header.startsWith(PDF_MAGIC)) {
    return NextResponse.json({ error: 'Arquivo inválido. O conteúdo não é um PDF.' }, { status: 400 })
  }

  // Deduplicação Criptográfica (World-Class)
  // Checa se os bytes do currículo já existem no banco antes mesmo de subir o arquivo
  const cvHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')
  const duplicado = await prisma.candidatura.findFirst({
    where: { cvHash },
    select: { id: true }
  })

  // Sem o nome de quem enviou: quem sobe o mesmo PDF não precisa saber de quem é o cadastro.
  if (duplicado) {
    return NextResponse.json({
      error: 'Este currículo já está no nosso Banco de Talentos. Se quiser atualizar seus dados, envie uma versão nova do PDF.',
    }, { status: 409 })
  }

  // Upload para o Vercel Blob privado (o arquivo só é entregue pelas rotas do RH)
  if (!armazenamentoConfigurado()) {
    console.error('[upload-cv] BLOB_READ_WRITE_TOKEN não configurado')
    return NextResponse.json({ error: 'Configuração de upload indisponível' }, { status: 500 })
  }

  let salvo: { chave: string; url: string }
  try {
    salvo = await salvarPrivado(novaChaveCv(), fileBuffer, 'application/pdf')
  } catch (error) {
    console.error('[upload-cv] falha ao salvar no Blob', error)
    return NextResponse.json({ error: 'Erro ao salvar arquivo. Tente novamente.' }, { status: 502 })
  }

  return NextResponse.json({
    url:              salvo.url,
    publicId:         salvo.chave,
    originalFilename: file.name,
    sizeBytes:        file.size,
    mimeType:         file.type,
    cvHash:           cvHash,
  })
}
