/**
 * Carrega na newsletter as campanhas de setembro da revenda de Sousa (as primeiras do site).
 *
 * Uso:
 *   npx tsx prisma/seed-newsletter.ts          # só mostra o que faria
 *   npx tsx prisma/seed-newsletter.ts --gravar # grava
 *
 * Idempotente: pula campanha que já existe com o mesmo título e empresa.
 * Fotos em prisma/seed-data/newsletter/<campanha>/NN.jpg (+ NN-blur.jpg), já reduzidas.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const PASTA = join(__dirname, 'seed-data', 'newsletter')

type Campanha = {
  pasta: string
  title: string
  dateLabel: string
  eventDate: string
  summary: string
  tagline?: string
  alt: string
  fotos: [number, number][]
}

// Fonte: calendário de setembro do plano de comunicação de Sousa (Canva) e fotos do marketing.
const CAMPANHAS: Campanha[] = [
  {
    pasta: 'setembro-amarelo',
    title: 'Setembro Amarelo',
    dateLabel: 'Setembro',
    eventDate: '2026-09-01',
    summary:
      'Mês de prevenção ao suicídio. A revenda de Sousa reuniu as equipes para falar sobre cuidado e saúde emocional.',
    tagline: 'Cuidar também é um ato de amor.',
    alt: 'Equipes da revenda de Sousa na ação do Setembro Amarelo',
    fotos: [
      [1280, 720],
      [1280, 720],
      [1280, 720],
      [1280, 720],
      [788, 1400],
    ],
  },
  {
    pasta: 'dia-do-administrador',
    title: 'Dia do Administrador',
    dateLabel: '09 set',
    eventDate: '2026-09-09',
    summary: 'Homenagem ao time administrativo, que mantém a operação de pé todos os dias.',
    alt: 'Time administrativo da revenda de Sousa recebendo a homenagem do Dia do Administrador',
    fotos: [
      [1400, 788],
      [788, 1400],
    ],
  },
  {
    pasta: 'dia-do-transito',
    title: 'Dia Nacional do Trânsito',
    dateLabel: '25 set',
    eventDate: '2026-09-25',
    summary:
      'Conscientização sobre segurança no trânsito com as equipes da revenda, com cartões de orientação entregues a cada colaborador.',
    alt: 'Ação do Dia Nacional do Trânsito na revenda de Sousa',
    fotos: [
      [788, 1400],
      [788, 1400],
      [788, 1400],
      [960, 1280],
    ],
  },
]

async function main() {
  const gravar = process.argv.includes('--gravar')
  for (const campanha of CAMPANHAS) {
    const existe = await prisma.newsletterPost.findFirst({
      where: { title: campanha.title, company: 'bebidas' },
      select: { id: true },
    })
    if (existe) {
      console.log(`= já existe: ${campanha.title}`)
      continue
    }
    console.log(`${gravar ? '+ criando' : '~ criaria'}: ${campanha.title} (${campanha.fotos.length} fotos)`)
    if (!gravar) continue

    await prisma.newsletterPost.create({
      data: {
        title: campanha.title,
        dateLabel: campanha.dateLabel,
        eventDate: new Date(`${campanha.eventDate}T12:00:00-03:00`),
        company: 'bebidas',
        unit: 'Sousa (PB)',
        summary: campanha.summary,
        tagline: campanha.tagline ?? null,
        published: true,
        photos: {
          create: campanha.fotos.map(([width, height], index) => {
            const nome = String(index + 1).padStart(2, '0')
            const blur = readFileSync(join(PASTA, campanha.pasta, `${nome}-blur.jpg`))
            return {
              position: index,
              alt: campanha.alt,
              width,
              height,
              mimeType: 'image/jpeg',
              data: readFileSync(join(PASTA, campanha.pasta, `${nome}.jpg`)),
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
