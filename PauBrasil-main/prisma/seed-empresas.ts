/**
 * Script de migração: popula Empresa e Operacao a partir dos dados existentes
 * Executar uma única vez: npx ts-node prisma/seed-empresas.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UNITS_BY_COMPANY: Record<string, { nome: string; nomeAbrev: string }[]> = {
  'Distribuidora Pau Brasil': [
    { nome: 'Pau Brasil Patos',      nomeAbrev: 'Patos' },
    { nome: 'Pau Brasil Sumé',       nomeAbrev: 'Sumé' },
    { nome: 'Pau Brasil Sousa',      nomeAbrev: 'Sousa' },
    { nome: 'Pau Brasil Itaporanga', nomeAbrev: 'Itaporanga' },
    { nome: 'Pau Brasil Guarabira',  nomeAbrev: 'Guarabira' },
    { nome: 'Pau Brasil Brumado',    nomeAbrev: 'Brumado' },
    { nome: 'Pau Brasil Barra',      nomeAbrev: 'Barra' },
    { nome: 'Pau Brasil Caculé',     nomeAbrev: 'Caculé' },
  ],
}

function toSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  // 1. Busca todas as empresas únicas dos usuários
  const users = await prisma.user.findMany({
    where: { company: { not: null } },
    select: { id: true, company: true, units: true },
  })

  const companyNames = Array.from(new Set(users.map(u => u.company!).filter(Boolean)))
  console.log('Empresas encontradas:', companyNames)

  // 2. Cria (ou busca) cada Empresa
  for (const nome of companyNames) {
    const slug = toSlug(nome)
    const empresa = await prisma.empresa.upsert({
      where: { slug },
      update: {},
      create: { nome, slug },
    })
    console.log(`Empresa: ${nome} → id: ${empresa.id}`)

    // 3. Cria operações pré-definidas (se existirem)
    const ops = UNITS_BY_COMPANY[nome] ?? []
    for (let i = 0; i < ops.length; i++) {
      await prisma.operacao.upsert({
        where: { nome_empresaId: { nome: ops[i].nome, empresaId: empresa.id } },
        update: {},
        create: { nome: ops[i].nome, nomeAbrev: ops[i].nomeAbrev, empresaId: empresa.id, ordem: i },
      })
    }

    // 4. Vincula usuários à Empresa
    await prisma.user.updateMany({
      where: { company: nome },
      data: { empresaId: empresa.id },
    })
    console.log(`  → ${ops.length} operações, ${users.filter(u => u.company === nome).length} usuários vinculados`)
  }

  console.log('\n✅ Migração concluída!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
