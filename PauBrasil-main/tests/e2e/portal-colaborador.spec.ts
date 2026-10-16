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
const universityEmail = `upb-e2e-${suffix}@grupopaubrasil.com.br`
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
    [universityEmail, 'Pau Brasil Motos', false],
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
  await db.feedEvent.deleteMany({ where })
  await db.pointsLedger.deleteMany({ where })
  await db.taskInstance.deleteMany({ where })
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

test('login, navegação, loja suspensa, temas e telas do colaborador', async ({
  page,
}) => {
  test.setTimeout(180000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/app/hoje')
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
  await page.screenshot({ path: '/tmp/paubrasil-brand/login-desktop.png' })
  await login(page)
  await expect(page).toHaveURL(/\/app\/inicio$/, { timeout: 20000 })
  await expect(page.locator('.portal-brand')).toBeVisible()
  await expect(
    page.locator(
      'a[href="/app/loja"], a[href="/app/resgates"], a[href="/app/agenda"]',
    ),
  ).toHaveCount(0)
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
  await page.screenshot({
    path: '/tmp/paubrasil-brand/portal-light.png',
    fullPage: true,
  })
  await page.getByTitle('Tema', { exact: true }).click()
  await page.getByRole('button', { name: 'Escuro', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({
    path: '/tmp/paubrasil-brand/portal-dark.png',
    fullPage: true,
  })
  const balanceBefore = await db.pointsLedger.count({
    where: { userId: ids[0] },
  })
  expect((await page.request.get('/api/loja')).status()).toBe(403)
  expect(
    (
      await page.request.post('/api/loja', { data: { productId: 'disabled' } })
    ).status(),
  ).toBe(403)
  expect(
    (
      await page.request.post('/api/me/target', {
        data: { rewardId: 'disabled' },
      })
    ).status(),
  ).toBe(403)
  expect(await (await page.request.get('/api/me/target')).json()).toEqual({
    targetReward: null,
  })
  expect(await db.pointsLedger.count({ where: { userId: ids[0] } })).toBe(
    balanceBefore,
  )
  for (const path of ['/app/loja', '/app/resgates']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/app\/pontos$/, { timeout: 20000 })
  }
  for (const path of [
    '/app/hoje',
    '/app/pontos',
    '/app/ranking',
    '/app/conquistas',
    '/app/perfil?tab=evolucao',
    '/app/ajuda',
    '/universidade',
  ]) {
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
  await menu.getByRole('link', { name: 'Hoje', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/hoje$/)
  await expect(menu).not.toBeVisible()
  await page.getByRole('button', { name: 'Abrir menu do portal' }).click()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('button', { name: 'Abrir menu do portal' }),
  ).toBeFocused()
  await noOverflow(page)
  await page.screenshot({
    path: '/tmp/paubrasil-brand/portal-mobile.png',
    fullPage: true,
  })
  expect(errors).toEqual([])
})

test('atividades: cadastro, falha recuperável e conclusão persistida', async ({
  page,
}) => {
  test.setTimeout(120000)
  await login(page)
  await expect(page).toHaveURL(/\/app\/inicio$/, { timeout: 20000 })
  await page.goto('/app/hoje')
  await page.getByRole('button', { name: 'Atividade avulsa' }).click()
  const modal = page.getByRole('dialog', { name: 'Nova Atividade' })
  await modal.getByLabel('O que você fez?').fill(`Atividade E2E ${suffix}`)
  await modal
    .getByLabel('Detalhes')
    .fill('Registro temporário de teste funcional.')
  await modal.getByRole('button', { name: 'Adicionar atividade' }).click()
  await expect(modal).not.toBeVisible()
  const complete = page.getByRole('button', {
    name: `Concluir Atividade E2E ${suffix}`,
    exact: true,
  })
  await expect(complete).toBeVisible()
  const task = await db.taskInstance.findFirstOrThrow({
    where: { userId: ids[0], adHocTitle: `Atividade E2E ${suffix}` },
  })
  await page.route(
    `**/api/tasks/${task.id}/complete`,
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Falha simulada. Tente novamente.' }),
      }),
    { times: 1 },
  )
  await complete.click()
  await expect(
    page.getByText('Falha simulada. Tente novamente.').first(),
  ).toBeVisible()
  await expect(complete).toBeEnabled()
  expect(
    (await db.taskInstance.findUniqueOrThrow({ where: { id: task.id } }))
      .status,
  ).toBe('PENDING')
  await complete.click()
  await expect
    .poll(
      async () =>
        (await db.taskInstance.findUniqueOrThrow({ where: { id: task.id } }))
          .status,
      { timeout: 20000 },
    )
    .toBe('DONE')
  await page.reload()
  await expect(
    page.getByText(`Atividade E2E ${suffix}`, { exact: true }),
  ).toBeVisible()
  await expect(complete).toBeDisabled()
})

test('perfil universidade tem navegação restrita e troca obrigatória de senha é acessível', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, universityEmail)
  await expect(page).toHaveURL(/\/universidade$/, { timeout: 20000 })
  const nav = page.getByRole('navigation', { name: 'Atalhos do portal' })
  await expect(nav.getByRole('link')).toHaveCount(2)
  await expect(nav.getByRole('link', { name: 'Perfil' })).toBeVisible()
  await page
    .getByRole('button', { name: 'Buscar no portal', exact: true })
    .click()
  await page.getByLabel('Buscar funções do portal').fill('Hoje')
  await expect(page.getByRole('dialog')).toContainText(
    'Nenhum resultado encontrado',
  )
  await page.keyboard.press('Escape')
  await page.context().clearCookies()
  await login(page, changeEmail)
  await expect(page).toHaveURL(/\/app\/alterar-senha$/)
  await expect(page.locator('main h1').first()).toBeVisible()
})
