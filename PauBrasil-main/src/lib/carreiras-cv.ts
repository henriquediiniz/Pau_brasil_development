import { createHash, randomUUID } from 'crypto'

export interface UploadedCvEntry {
  token: string
  publicId: string
  url: string
  originalFilename: string
  sizeBytes: number
  mimeType: string
  createdAt: number
  expiresAt: number
}

const UPLOAD_TTL_MS = 30 * 60 * 1000

const globalForCarreirasCv = globalThis as typeof globalThis & {
  carreirasCvUploads?: Map<string, UploadedCvEntry>
}

const uploadRegistry = globalForCarreirasCv.carreirasCvUploads ?? new Map<string, UploadedCvEntry>()

if (!globalForCarreirasCv.carreirasCvUploads) {
  globalForCarreirasCv.carreirasCvUploads = uploadRegistry
}

function purgeExpiredUploads(now = Date.now()) {
  for (const [token, entry] of Array.from(uploadRegistry.entries())) {
    if (entry.expiresAt <= now) {
      uploadRegistry.delete(token)
    }
  }
}

export function registerUploadedCv(params: Omit<UploadedCvEntry, 'token' | 'createdAt' | 'expiresAt'>) {
  purgeExpiredUploads()

  const token = randomUUID()
  const createdAt = Date.now()
  const entry: UploadedCvEntry = {
    token,
    createdAt,
    expiresAt: createdAt + UPLOAD_TTL_MS,
    ...params,
  }

  uploadRegistry.set(token, entry)
  return entry
}

export function getUploadedCv(token: string) {
  purgeExpiredUploads()

  const entry = uploadRegistry.get(token)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    uploadRegistry.delete(token)
    return null
  }
  return entry
}

export function consumeUploadedCv(token: string) {
  const entry = getUploadedCv(token)
  if (!entry) return null
  uploadRegistry.delete(token)
  return entry
}

export function forgetUploadedCv(token: string) {
  uploadRegistry.delete(token)
}

export async function destroyUploadedCv(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret || !publicId) {
    return false
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signatureBase = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(signatureBase).digest('hex')

  const form = new FormData()
  form.append('public_id', publicId)
  form.append('invalidate', 'true')
  form.append('timestamp', String(timestamp))
  form.append('api_key', apiKey)
  form.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`, {
    method: 'POST',
    body: form,
  })

  return response.ok
}

export async function discardUploadedCv(token: string) {
  const entry = getUploadedCv(token)
  if (!entry) return

  forgetUploadedCv(token)

  try {
    await destroyUploadedCv(entry.publicId)
  } catch (error) {
    console.error('[carreiras-cv] failed to destroy uploaded cv', { token, publicId: entry.publicId, error })
  }
}
