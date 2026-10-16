import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

// Credenciais em variáveis de ambiente privadas — nunca usar NEXT_PUBLIC_ para segredos de servidor
const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET

const TRANSFORM: Record<string, string> = {
  '16/9': 'c_fill,g_face,w_1280,h_720,q_auto,f_auto',
  '1/1':  'c_fill,g_face,w_800,h_800,q_auto,f_auto',
  '4/3':  'c_fill,g_face,w_1024,h_768,q_auto,f_auto',
}

const ALLOWED_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const token = await getToken({ req })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error('CLOUDINARY_CLOUD_NAME ou CLOUDINARY_UPLOAD_PRESET não configurados no .env')
    return NextResponse.json({ error: 'Serviço de upload não configurado' }, { status: 500 })
  }

  const formData = await req.formData()
  const file       = formData.get('file') as File | null
  const aspectRatio = (formData.get('aspectRatio') as string) || '16/9'

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  // Validar tipo de arquivo
  if (!ALLOWED_MIME_PREFIXES.includes(file.type)) {
    return NextResponse.json({ error: 'Apenas imagens JPEG, PNG, WebP ou GIF são permitidas' }, { status: 400 })
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 10 MB)' }, { status: 413 })
  }

  const cloudForm = new FormData()
  cloudForm.append('file', file)
  cloudForm.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: cloudForm }
  )

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.message ?? 'Upload falhou' }, { status: 400 })
  }

  const transform = TRANSFORM[aspectRatio] ?? TRANSFORM['16/9']
  const url = (data.secure_url as string).replace('/upload/', `/upload/${transform}/`)

  return NextResponse.json({ url })
}
