/**
 * Importa campanhas da newsletter a partir de um manifesto JSON e de uma pasta de fotos.
 *
 * Uso:
 *   npx tsx prisma/importar-newsletter.ts <manifesto.json> <pasta-das-fotos>          # só mostra o que faria
 *   npx tsx prisma/importar-newsletter.ts <manifesto.json> <pasta-das-fotos> --gravar # grava
 *
 * A pasta tem uma subpasta por campanha (campo "pasta" do manifesto) com NN.jpg e NN-blur.jpg,
 * já reduzidas e sem metadados. As fotos não ficam no Git; vão direto para o banco.
 * Idempotente: pula campanha que já existe com o mesmo título e empresa.
 */

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

type Manifesto = {
  company: string
  unit: string
  campanhas: {
    pasta: string
    title: string
    dateLabel: string
    eventDate: string
    summary: string
    tagline?: string
  }[]
}

/** Largura e altura de um JPEG lendo o marcador SOF (baseline ou progressivo). */
function dimensoesJpeg(bytes: Buffer): [number, number] {
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) throw new Error('JPEG inválido')
    const marcador = bytes[i + 1]
    const tamanho = bytes.readUInt16BE(i + 2)
    if (marcador >= 0xc0 && marcador <= 0xc3) {
      return [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)]
    }
    i += 2 + tamanho
  }
  throw new Error('JPEG sem dimensões')
}

const prisma = new PrismaClient()

async function main() {
  const [manifestoPath, pasta] = process.argv.slice(2)
  const gravar = process.argv.includes('--gravar')
  if (!manifestoPath || !pasta) throw new Error('Uso: importar-newsletter.ts <manifesto.json> <pasta> [--gravar]')
  const manifesto: Manifesto = JSON.parse(readFileSync(manifestoPath, 'utf8'))

  for (const campanha of manifesto.campanhas) {
    const dir = join(pasta, campanha.pasta)
    const fotos = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d{2}\.jpg$/.test(f)).sort() : []
    if (!fotos.length) {
      console.log(`! sem fotos: ${campanha.title}`)
      continue
    }
    const existe = await prisma.newsletterPost.findFirst({
      where: { title: campanha.title, company: manifesto.company },
      select: { id: true },
    })
    if (existe) {
      console.log(`= já existe: ${campanha.title}`)
      continue
    }
    console.log(`${gravar ? '+ criando' : '~ criaria'}: ${campanha.title} (${fotos.length} fotos)`)
    if (!gravar) continue

    await prisma.newsletterPost.create({
      data: {
        title: campanha.title,
        dateLabel: campanha.dateLabel,
        eventDate: new Date(`${campanha.eventDate}T12:00:00-03:00`),
        company: manifesto.company,
        unit: manifesto.unit,
        summary: campanha.summary,
        tagline: campanha.tagline ?? null,
        published: true,
        photos: {
          create: fotos.map((arquivo, position) => {
            const data = readFileSync(join(dir, arquivo))
            const [width, height] = dimensoesJpeg(data)
            const blur = readFileSync(join(dir, arquivo.replace('.jpg', '-blur.jpg')))
            return {
              position,
              alt: `${campanha.title} · ${manifesto.unit}`,
              width,
              height,
              mimeType: 'image/jpeg',
              data,
              blur: `data:image/jpeg;base64,${blur.toString('base64')}`,
            }
          }),
        },
      },
    })
  }
  if (!gravar) console.log('\nNada gravado. Rode com --gravar para criar.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
