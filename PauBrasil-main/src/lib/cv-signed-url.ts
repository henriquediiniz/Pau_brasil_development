import { createHash } from 'crypto'

/**
 * URL assinada e de vida curta para baixar um currículo do Cloudinary.
 *
 * Os CVs ficam em `raw/upload` com acesso restrito: a URL crua nunca sai para
 * o cliente, só este link assinado, gerado no servidor a cada acesso.
 *
 * NOTA: `src/app/api/admin/rh/candidaturas/[id]/cv-url/route.ts` tem hoje uma
 * cópia desta lógica. Vale consolidar as duas neste arquivo — código de
 * assinatura duplicado é o tipo de coisa que diverge em silêncio.
 */

export const CV_TTL_SECONDS = 3600

export function cloudinaryConfigurado(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

export function buildCvSignedUrl(publicId: string, expiresAt: number): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const timestamp = Math.floor(Date.now() / 1000)

  const paramsToSign = `expires_at=${expiresAt}&public_id=${publicId}&timestamp=${timestamp}&type=upload`
  const signature = createHash('sha1').update(paramsToSign + apiSecret).digest('hex')

  const qs = new URLSearchParams({
    public_id: publicId,
    type: 'upload',
    expires_at: String(expiresAt),
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  }).toString()

  return `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?${qs}`
}
