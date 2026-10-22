import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { isRhAdmin } from '@/lib/auth-helpers'
import { extractCvData } from '@/lib/cv-parser'
import {
  MENSAGEM_SEM_ARMAZENAMENTO,
  armazenamentoConfigurado,
  novaChaveCv,
  salvarPrivado,
} from '@/lib/armazenamento'

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

  // ── Upload para o Vercel Blob privado ────────────────────────────────────────
  if (!armazenamentoConfigurado())
    return NextResponse.json({ error: MENSAGEM_SEM_ARMAZENAMENTO }, { status: 500 })

  let salvo: { chave: string; url: string }
  try {
    salvo = await salvarPrivado(novaChaveCv(), buffer, 'application/pdf')
  } catch (error) {
    console.error('[importar-cv] falha ao salvar no Blob', error)
    return NextResponse.json({ error: 'Erro ao salvar o arquivo.' }, { status: 502 })
  }

  return NextResponse.json({
    cvUrl:             salvo.url,
    cvPublicId:        salvo.chave,
    cvOriginalFilename: file.name,
    cvSizeBytes:       file.size,
    cvMimeType:        file.type,
    cvHash,
    ...extracted,
  })
}
