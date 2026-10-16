import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { extractCvData } from '@/lib/cv-parser'

export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB para import admin
const PDF_MAGIC = '%PDF'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!isRhAdmin(session.user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 }) }

  const file = formData.get('file')
  if (!(file instanceof File))
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })

  if (file.size > MAX_SIZE_BYTES)
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10 MB.' }, { status: 400 })

  if (file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Apenas PDFs são aceitos.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!buffer.subarray(0, 4).toString('ascii').startsWith(PDF_MAGIC))
    return NextResponse.json({ error: 'Conteúdo não é um PDF válido.' }, { status: 400 })

  const cvHash = crypto.createHash('sha256').update(buffer).digest('hex')

  // ── Parse do texto ────────────────────────────────────────────────────────────
  let extracted = { nome: '', email: '', telefone: '', cidade: '', estado: '', cargosRec: [] as string[] }
  try {
    const pdfParse = require('pdf-parse')
    const fn = pdfParse.PDFParse ?? pdfParse
    const { text } = await fn(buffer)
    extracted = extractCvData(text)
  } catch {
    // PDF parseável mas sem texto legível (provavelmente escaneado) — retorna campos vazios
  }

  // ── Upload Cloudinary ─────────────────────────────────────────────────────────
  const cloudName   = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_CV_PRESET

  if (!cloudName || !uploadPreset)
    return NextResponse.json({ error: 'Cloudinary não configurado.' }, { status: 500 })

  const base64  = buffer.toString('base64')
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
    return NextResponse.json({ error: 'Erro ao salvar arquivo no Cloudinary.' }, { status: 502 })
  }

  const cloud = await cloudRes.json()

  return NextResponse.json({
    cvUrl:             cloud.secure_url as string,
    cvPublicId:        cloud.public_id as string,
    cvOriginalFilename: file.name,
    cvSizeBytes:       file.size,
    cvMimeType:        file.type,
    cvHash,
    ...extracted,
  })
}
