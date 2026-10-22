import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { armazenamentoConfigurado, novaChaveCv, salvarPrivado } from '@/lib/armazenamento'

export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const PDF_MAGIC = '%PDF'

// Rate limit: 10 uploads por IP por hora
const uploadRateMap = new Map<string, { count: number; resetAt: number }>()

function checkUploadRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = uploadRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    uploadRateMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkUploadRateLimit(ip)) {
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
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2 MB.' }, { status: 400 })
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
    select: { id: true, nome: true }
  })

  if (duplicado) {
    return NextResponse.json({ 
      error: `Este currículo exato já foi enviado recente para o Banco de Talentos (registrado como ${duplicado.nome}).` 
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
