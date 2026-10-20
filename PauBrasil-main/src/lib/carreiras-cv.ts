import { createHash } from 'crypto'

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
