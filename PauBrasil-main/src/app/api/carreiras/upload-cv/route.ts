import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

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
  // Checa se os bytes do currículo já existem no banco antes mesmo de subir pro Cloudinary
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

  // Upload para Cloudinary como raw (PDF)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_CV_PRESET

  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary CV preset não configurado')
    return NextResponse.json({ error: 'Configuração de upload indisponível' }, { status: 500 })
  }

  const base64 = Buffer.from(buffer).toString('base64')
  const dataUri = `data:application/pdf;base64,${base64}`

  const uploadForm = new FormData()
  uploadForm.append('file', dataUri)
  uploadForm.append('upload_preset', uploadPreset)
  uploadForm.append('folder', 'cvs')
  uploadForm.append('resource_type', 'raw')

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    { method: 'POST', body: uploadForm }
  )

  if (!cloudRes.ok) {
    const err = await cloudRes.text()
    console.error('Cloudinary upload error:', err)
    return NextResponse.json({ error: 'Erro ao salvar arquivo. Tente novamente.' }, { status: 502 })
  }

  const data = await cloudRes.json()

  return NextResponse.json({
    url:              data.secure_url as string,
    publicId:         data.public_id as string,
    originalFilename: file.name,
    sizeBytes:        file.size,
    mimeType:         file.type,
    cvHash:           cvHash,
  })
}
