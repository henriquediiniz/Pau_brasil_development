/**
 * Newsletter do site institucional: campanhas cadastradas no módulo Gente.
 * As fotos ficam no banco (bytea) e são servidas por /api/public/newsletter/foto/[id].
 */

import { z } from '@/lib/zod'
import { prisma } from '@/lib/prisma'
import { HUB_COMPANIES, type HubNews } from '@/lib/hub-content'

/** Quantas campanhas publicadas aparecem no topo da home. */
export const NEWSLETTER_LIMITE_SITE = 8

/** Foto já reduzida no navegador; acima disso algo saiu errado no cliente. */
export const NEWSLETTER_FOTO_MAX_BYTES = 1_500_000
export const NEWSLETTER_FOTOS_POR_CAMPANHA = 12

const slugsEmpresas = HUB_COMPANIES.map((c) => c.slug) as [string, ...string[]]

export const newsletterPostSchema = z.object({
  title: z.string().trim().min(3).max(80),
  dateLabel: z.string().trim().min(2).max(20),
  eventDate: z.coerce.date(),
  company: z.enum(slugsEmpresas),
  unit: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(10).max(320),
  tagline: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  published: z.boolean().optional(),
})

export const newsletterPatchSchema = newsletterPostSchema.partial().extend({
  /** Nova ordem e textos alternativos das fotos já enviadas. */
  photos: z
    .array(z.object({ id: z.string().min(1), alt: z.string().trim().min(3).max(160) }))
    .max(NEWSLETTER_FOTOS_POR_CAMPANHA)
    .optional(),
})

export function urlFotoNewsletter(id: string) {
  return `/api/public/newsletter/foto/${id}`
}

/** Confere o tipo pelo conteúdo do arquivo, não pela extensão nem pelo cabeçalho do envio. */
export function tipoDaImagem(bytes: Uint8Array): 'image/jpeg' | 'image/webp' | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  const texto = (inicio: number, fim: number) =>
    Array.from(bytes.slice(inicio, fim), (b) => String.fromCharCode(b)).join('')
  const riff = texto(0, 4)
  const webp = texto(8, 12)
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp'
  return null
}

const FOTO_SELECT = { id: true, alt: true, width: true, height: true, blur: true, position: true } as const

/** Campanhas publicadas no formato do componente do site. Sem banco, devolve lista vazia. */
export async function listarNewsletterPublicada(limite: number | null = NEWSLETTER_LIMITE_SITE): Promise<HubNews[]> {
  try {
    const posts = await prisma.newsletterPost.findMany({
      where: { published: true, photos: { some: {} } },
      orderBy: { eventDate: 'desc' },
      ...(limite ? { take: limite } : {}),
      include: { photos: { select: FOTO_SELECT, orderBy: { position: 'asc' } } },
    })
    return posts.map((post) => ({
      slug: post.id,
      title: post.title,
      date: post.dateLabel,
      company: post.company,
      unit: post.unit,
      summary: post.summary,
      tagline: post.tagline ?? undefined,
      photos: post.photos.map((foto) => ({
        src: urlFotoNewsletter(foto.id),
        blur: foto.blur,
        width: foto.width,
        height: foto.height,
        alt: foto.alt,
      })),
    }))
  } catch (error) {
    // Build local sem DATABASE_URL ou banco fora do ar: a home continua no ar, só sem a newsletter.
    console.error('[newsletter] falha ao ler campanhas', error)
    return []
  }
}

export async function listarNewsletterGestao() {
  return prisma.newsletterPost.findMany({
    orderBy: { eventDate: 'desc' },
    include: { photos: { select: FOTO_SELECT, orderBy: { position: 'asc' } } },
  })
}
