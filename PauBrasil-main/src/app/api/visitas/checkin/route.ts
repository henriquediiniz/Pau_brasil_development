import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { haversineMeters } from '@/lib/geo'
import { audit } from '@/lib/audit'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET!
const RATE_LIMIT_MINUTES = 30

async function uploadWithRetry(base64: string, maxRetries = 3): Promise<string> {
  const delays = [500, 1000, 2000]
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const form = new FormData()
      form.append('file', base64)
      form.append('upload_preset', UPLOAD_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Upload falhou')
      return data.secure_url as string
    } catch (err) {
      if (attempt === maxRetries) throw err
      await new Promise(r => setTimeout(r, delays[attempt] ?? 2000))
    }
  }
  throw new Error('Upload falhou após todas as tentativas')
}

function isValidCoord(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { operationSlug, latitude, longitude, photoBase64, faceValid } = await req.json()

  if (!operationSlug || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !isValidCoord(latitude, longitude)) {
    return NextResponse.json({ error: 'Coordenadas GPS inválidas' }, { status: 400 })
  }

  const operation = await prisma.operation.findUnique({ where: { slug: operationSlug } })
  if (!operation) return NextResponse.json({ error: 'Operação não encontrada' }, { status: 404 })

  // Rate limit: impede check-in válido duplicado nos últimos RATE_LIMIT_MINUTES minutos
  const cutoff = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000)
  const recent = await prisma.leaderVisit.findFirst({
    where: { userId: session.user.id, operationSlug, status: 'valid', checkedInAt: { gte: cutoff } },
    select: { checkedInAt: true },
  })
  if (recent) {
    const retryAfter = Math.ceil((recent.checkedInAt.getTime() + RATE_LIMIT_MINUTES * 60 * 1000 - Date.now()) / 1000)
    return NextResponse.json(
      { error: `Check-in já realizado nesta filial há menos de ${RATE_LIMIT_MINUTES} minutos.`, retryAfter },
      { status: 429 }
    )
  }

  const distance = haversineMeters(latitude, longitude, operation.latitude, operation.longitude)
  const gpsValid = distance <= operation.radiusMeters

  if (!gpsValid) {
    await prisma.leaderVisit.create({
      data: {
        userId: session.user.id,
        operationSlug,
        operationName: operation.name,
        latitude,
        longitude,
        gpsValid: false,
        faceValid: false,
        status: 'blocked_gps',
      },
    })
    return NextResponse.json(
      {
        error: `Você está a ${Math.round(distance)}m da filial ${operation.name}. Raio permitido: ${operation.radiusMeters}m.`,
        distanceMeters: Math.round(distance),
        radiusMeters: operation.radiusMeters,
        operationName: operation.name,
      },
      { status: 422 }
    )
  }

  if (!faceValid) {
    await prisma.leaderVisit.create({
      data: {
        userId: session.user.id,
        operationSlug,
        operationName: operation.name,
        latitude,
        longitude,
        gpsValid: true,
        faceValid: false,
        status: 'blocked_face',
      },
    })
    return NextResponse.json({ error: 'Rosto não reconhecido.' }, { status: 422 })
  }

  let photoUrl: string | undefined
  if (photoBase64) {
    try {
      photoUrl = await uploadWithRetry(photoBase64)
    } catch (err: any) {
      void audit({
        actorId: session.user.id,
        actorName: session.user.name ?? '',
        action: 'CHECKIN_PHOTO_UPLOAD_FAILED',
        targetType: 'Operation',
        targetId: operationSlug,
        meta: { error: err?.message ?? 'unknown' },
      })
    }
  }

  const visit = await prisma.leaderVisit.create({
    data: {
      userId: session.user.id,
      operationSlug,
      operationName: operation.name,
      latitude,
      longitude,
      gpsValid: true,
      faceValid: true,
      status: 'valid',
      photoUrl,
    },
  })

  void notify(
    session.user.id,
    `✅ Check-in registrado`,
    `Visita em ${operation.name} confirmada com sucesso.`,
    undefined,
    '/app/visitas/dashboard',
  )

  return NextResponse.json({ ok: true, visitId: visit.id })
}
