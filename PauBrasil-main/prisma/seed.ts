import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // SYS_ADMIN
  const adminHash = await bcrypt.hash('Admin@2026!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grupopaubrasil.com.br' },
    update: {},
    create: {
      name: 'Administrador Sistema',
      email: 'admin@grupopaubrasil.com.br',
      passwordHash: adminHash,
      role: Role.SYS_ADMIN,
      company: 'Grupo Pau Brasil',
      units: ['Matriz'],
    },
  })
  console.log('✅ SYS_ADMIN criado:', admin.email)

  // Funções
  const funcVendedor = await prisma.function.upsert({
    where: { id: 'func-vendedor' },
    update: {},
    create: { id: 'func-vendedor', name: 'Vendedor', description: 'Equipe de vendas e atendimento.' },
  })
  const funcOperador = await prisma.function.upsert({
    where: { id: 'func-operador' },
    update: {},
    create: { id: 'func-operador', name: 'Operador', description: 'Equipe operacional.' },
  })
  const funcGestor = await prisma.function.upsert({
    where: { id: 'func-gestor' },
    update: {},
    create: { id: 'func-gestor', name: 'Gestor', description: 'Líderes e gestores de equipe.' },
  })
  console.log('✅ Funções criadas')

  // --- Empresa A (Pau Brasil Bebidas) ---
  const gestorHash = await bcrypt.hash('Gestor@2026!', 12)
  const gestorA = await prisma.user.upsert({
    where: { email: 'gestor@grupopaubrasil.com.br' },
    update: { passwordHash: gestorHash, isActive: true },
    create: {
      name: 'Carlos Gestor (A)',
      email: 'gestor@grupopaubrasil.com.br',
      passwordHash: gestorHash,
      role: Role.GESTOR,
      functionId: funcGestor.id,
      company: 'Pau Brasil Bebidas',
      units: ['Unidade BH'],
    },
  })

  const userHash = await bcrypt.hash('User@2026!', 12)
  await prisma.user.upsert({
    where: { email: 'joao@grupopaubrasil.com.br' },
    update: { passwordHash: userHash, isActive: true },
    create: {
      name: 'João Silva (A)',
      email: 'joao@grupopaubrasil.com.br',
      passwordHash: userHash,
      role: Role.USER,
      functionId: funcVendedor.id,
      company: 'Pau Brasil Bebidas',
      units: ['Unidade BH'],
      managerId: gestorA.id,
    },
  })

  // --- Empresa B (Empresa Secundaria) ---
  const gestorB = await prisma.user.upsert({
    where: { email: 'gestorb@grupopaubrasil.com.br' },
    update: { passwordHash: gestorHash, isActive: true },
    create: {
      name: 'Pedro Gestor (B)',
      email: 'gestorb@grupopaubrasil.com.br',
      passwordHash: gestorHash,
      role: Role.GESTOR,
      functionId: funcGestor.id,
      company: 'Empresa Secundaria',
      units: ['Unidade SP'],
    },
  })

  await prisma.user.upsert({
    where: { email: 'maria@grupopaubrasil.com.br' },
    update: {},
    create: {
      name: 'Maria Santos (B)',
      email: 'maria@grupopaubrasil.com.br',
      passwordHash: userHash,
      role: Role.USER,
      functionId: funcVendedor.id,
      company: 'Empresa Secundaria',
      units: ['Unidade SP'],
      managerId: gestorB.id,
    },
  })
  console.log('✅ Usuários de múltiplas empresas criados')

  console.log('\n🎉 Seed concluído!')
  console.log('─────────────────────────────────────')
  console.log('Credenciais de acesso:')
  console.log('  SYS_ADMIN : admin@grupopaubrasil.com.br / Admin@2026!')
  console.log('  GESTOR    : gestor@grupopaubrasil.com.br / Gestor@2026!')
  console.log('  USER      : joao@grupopaubrasil.com.br / User@2026!')
  console.log('─────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
