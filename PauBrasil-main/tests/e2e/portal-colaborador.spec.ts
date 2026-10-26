import { test, expect, type Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

// Opt-in: creates and cleans only its own fixtures in the local development DB.
const enabled = process.env.PORTAL_E2E_DB === '1'
test.skip(
  !enabled,
  'Use PORTAL_E2E_DB=1 com o PostgreSQL local de desenvolvimento.',
)
let db: PrismaClient
const ids: string[] = []
const password = `Portal-${randomUUID()}!`
const suffix = randomUUID().slice(0, 8)
const email = `portal-e2e-${suffix}@grupopaubrasil.com.br`
const changeEmail = `senha-e2e-${suffix}@grupopaubrasil.com.br`

test.beforeAll(async () => {
  if (!enabled) return
  loadEnvConfig(process.cwd(), true)
  const url = new URL(process.env.DATABASE_URL!)
  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '55432' ||
    url.pathname !== '/paub_portal_dev'
  ) {
    throw new Error(
      'Fixtures permitidas somente no banco local paub_portal_dev:55432.',
    )
  }
  db = new PrismaClient()
  const passwordHash = await bcrypt.hash(password, 10)
  for (const [address, company, mustChangePassword] of [
    [email, 'Distribuidora Pau Brasil', false],
    [changeEmail, 'Pau Brasil Motos', true],
  ] as const) {
    const user = await db.user.create({
      data: {
        name: 'Colaborador de teste',
        email: address,
        company,
        passwordHash,
        mustChangePassword,
      },
    })
    ids.push(user.id)
  }
})

test.afterAll(async () => {
  if (!db) return
  const where = { userId: { in: ids } }
  await db.notification.deleteMany({ where })
  await db.auditLog.deleteMany({ where: { actorId: { in: ids } } })
  await db.user.deleteMany({ where: { id: { in: ids } } })
  await db.$disconnect()
})

async function login(page: Page, address = email) {
  await page.goto('/login')
  await page.getByLabel('E-mail corporativo').fill(address)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar no Portal' }).click()
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}

test('login, navegação, busca, temas e telas do colaborador', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/app/inicio')
  await expect(page).toHaveURL(/login/)
  await page.getByLabel('E-mail corporativo').fill('pessoa@example.com')
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await page.getByRole('button', { name: 'Entrar no Portal' }).click()
  await expect(page.locator('#email-error')).toContainText('Use seu e-mail')
  await login(page)
  await expect(page).toHaveURL(/\/app\/inicio$/, { timeout: 20000 })
  await expect(page.locator('.portal-brand')).toBeVisible()
  // Módulos retirados (loja, pontos, atividades, visitas) não aparecem nem abrem
  await expect(
    page.locator('a[href="/app/loja"], a[href="/app/pontos"], a[href="/app/hoje"]'),
  ).toHaveCount(0)
  for (const path of ['/app/loja', '/app/pontos', '/app/hoje', '/app/visitas']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/app\/inicio$/, { timeout: 20000 })
  }
  await page
    .getByRole('button', { name: 'Buscar no portal', exact: true })
    .click()
  const search = page.getByRole('dialog', { name: 'Buscar no portal' })
  await expect(search).toBeVisible()
  await page.getByLabel('Buscar funções do portal').fill('Loja')
  await expect(search).toContainText('Nenhum resultado encontrado')
  await page.keyboard.press('Escape')
  await expect(search).not.toBeVisible()
  await page.getByTitle('Tema', { exact: true }).click()
  await page.getByRole('button', { name: 'Claro', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  expect(
    await page
      .locator('.portal-brand')
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--brand-500').trim(),
      ),
  ).toBe('122 21 32')
  await page.getByTitle('Tema', { exact: true }).click()
  await page.getByRole('button', { name: 'Escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  for (const path of ['/app/inicio', '/app/perfil', '/app/ajuda', '/universidade']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.locator('main h1').first()).toBeVisible()
    await noOverflow(page)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/inicio')
  await page.getByRole('button', { name: 'Abrir menu do portal' }).click()
  const menu = page.getByRole('dialog', { name: 'Menu do portal', exact: true })
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: 'Meu Perfil', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/perfil/)
  await expect(menu).not.toBeVisible()
  await page.getByRole('button', { name: 'Abrir menu do portal' }).click()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Abrir menu do portal' }),
  ).toBeFocused()
  await noOverflow(page)
  expect(errors).toEqual([])
})

test('troca obrigatória de senha é acessível', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, changeEmail)
  await expect(page).toHaveURL(/\/app\/alterar-senha$/, { timeout: 20000 })
  await expect(page.locator('main h1').first()).toBeVisible()
  await noOverflow(page)
})
