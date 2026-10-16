import { PrismaClient, Role, Frequency } from '@prisma/client'
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

  // Atividades de vendedor
  await prisma.taskDefinition.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'task-v1',
        functionId: funcVendedor.id,
        title: 'Atualizar CRM',
        description: 'Registrar todas as interações do dia no CRM.',
        frequency: Frequency.DAILY,
        daysOfWeek: [1, 2, 3, 4, 5],
        points: 15,
        requireEvidence: false,
        requireApproval: false,
        dailyLimit: 1,
      },
      {
        id: 'task-v2',
        functionId: funcVendedor.id,
        title: 'Prospectar novos clientes',
        description: 'Realizar ao menos 3 abordagens de prospecção.',
        frequency: Frequency.DAILY,
        daysOfWeek: [1, 2, 3, 4, 5],
        points: 25,
        requireEvidence: true,
        requireApproval: true,
        dailyLimit: 1,
      },
      {
        id: 'task-v3',
        functionId: funcVendedor.id,
        title: 'Reunião de pipeline semanal',
        description: 'Participar da revisão semanal de pipeline com gestor.',
        frequency: Frequency.WEEKLY,
        daysOfWeek: [5],
        points: 30,
        requireEvidence: false,
        requireApproval: false,
        dailyLimit: 1,
      },
      {
        id: 'task-v4',
        functionId: funcVendedor.id,
        title: 'Meta mensal de vendas',
        description: 'Atingir ou superar meta de vendas do mês.',
        frequency: Frequency.MONTHLY,
        daysOfWeek: [],
        points: 100,
        requireEvidence: true,
        requireApproval: true,
        dailyLimit: 1,
      },
    ],
  })

  // Atividades de operador
  await prisma.taskDefinition.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'task-o1',
        functionId: funcOperador.id,
        title: 'Checklist de abertura',
        description: 'Realizar checklist de abertura do ponto de operação.',
        frequency: Frequency.DAILY,
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        points: 10,
        requireEvidence: false,
        requireApproval: false,
        dailyLimit: 1,
      },
      {
        id: 'task-o2',
        functionId: funcOperador.id,
        title: 'Treinamento online',
        description: 'Completar módulo de treinamento disponível na plataforma.',
        frequency: Frequency.WEEKLY,
        daysOfWeek: [3],
        points: 40,
        requireEvidence: true,
        requireApproval: false,
        dailyLimit: 1,
      },
    ],
  })
  console.log('✅ Atividades criadas')

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

  // Produtos da loja
  await prisma.rewardProduct.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'prod-1',
        title: 'Vale-Refeição Extra',
        description: 'Vale-refeição adicional no valor de R$ 50.',
        pointsCost: 200,
        stock: 20,
        active: true,
      },
      {
        id: 'prod-2',
        title: 'Folga Remunerada',
        description: 'Um dia de folga remunerada a combinar com gestor.',
        pointsCost: 500,
        stock: 5,
        active: true,
      },
      {
        id: 'prod-3',
        title: 'Kit Home Office',
        description: 'Mousepad premium + caneca personalizada Grupo Pau Brasil.',
        pointsCost: 350,
        stock: 10,
        active: true,
      },
      {
        id: 'prod-4',
        title: 'Ingresso Cinema',
        description: 'Par de ingressos para qualquer sessão.',
        pointsCost: 150,
        stock: 30,
        active: true,
      },
      {
        id: 'prod-5',
        title: 'Curso Online Premium',
        description: 'Acesso a plataforma de cursos por 3 meses.',
        pointsCost: 600,
        stock: null,
        active: true,
      },
      {
        id: 'prod-6',
        title: 'Vale-Combustível',
        description: 'Vale-combustível no valor de R$ 100.',
        pointsCost: 400,
        stock: 15,
        active: true,
      },
    ],
  })
  console.log('✅ Produtos da loja criados')

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
