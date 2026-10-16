import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const operations = [
  { slug: 'patos',           name: 'Patos',           latitude: -7.0153,  longitude: -37.2816, radiusMeters: 200 },
  { slug: 'sousa',           name: 'Sousa',           latitude: -6.7626,  longitude: -38.2298, radiusMeters: 200 },
  { slug: 'itaporanga',      name: 'Itaporanga',      latitude: -7.3043,  longitude: -38.1524, radiusMeters: 200 },
  { slug: 'sume',            name: 'Sumé',            latitude: -7.6714,  longitude: -36.8825, radiusMeters: 200 },
  { slug: 'guarabira',       name: 'Guarabira',       latitude: -6.8548,  longitude: -35.4908, radiusMeters: 200 },
  { slug: 'brumado',         name: 'Brumado',         latitude: -14.2044, longitude: -41.6631, radiusMeters: 200 },
  { slug: 'barra-da-estiva', name: 'Barra da Estiva', latitude: -13.6244, longitude: -41.3273, radiusMeters: 200 },
  { slug: 'cacule',          name: 'Caculé',          latitude: -14.5013, longitude: -42.2233, radiusMeters: 200 },
]

async function main() {
  console.log('Seeding operations...')
  for (const op of operations) {
    await prisma.operation.upsert({
      where: { slug: op.slug },
      update: { name: op.name, latitude: op.latitude, longitude: op.longitude, radiusMeters: op.radiusMeters },
      create: op,
    })
    console.log(`  ✓ ${op.name}`)
  }
  console.log('Done.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
