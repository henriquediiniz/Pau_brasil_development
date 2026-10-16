import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET!

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photoBase64 } = await req.json()
  if (!photoBase64) return NextResponse.json({ error: 'Foto não fornecida' }, { status: 400 })

  const form = new FormData()
  form.append('file', photoBase64)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.message ?? 'Upload falhou' }, { status: 400 })
  }

  const faceReferenceUrl = data.secure_url as string

  await prisma.user.update({
    where: { id: session.user.id },
    data: { faceReferenceUrl },
  })

  return NextResponse.json({ ok: true, faceReferenceUrl })
}
