import { test, expect } from '@playwright/test'

test('hub: empresas, história e orientação de talentos', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Raízes fortes.Novos caminhos.',
  )
  const companies = page.locator('#empresas')
  await expect(companies.getByRole('link')).toHaveCount(8)
  await page.getByRole('button', { name: 'Mobilidade', exact: true }).click()
  await expect(companies.getByRole('link')).toHaveCount(3)
  await expect(
    companies.getByRole('heading', { name: 'Pau Brasil Motos' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Todos', exact: true }).click()
  await expect(companies.getByRole('link')).toHaveCount(8)
  await page.getByRole('button', { name: /Novas fronteiras/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Além da Paraíba, sem perder a raiz.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ano anterior' }).click()
  // No primeiro ano de uma era, "Ano anterior" volta para o último ano da era anterior.
  await expect(page.locator('#story-content')).toContainText('nasce a Pau Brasil Motos')
  await page.getByLabel('Sua área de interesse').selectOption('mecanica')
  await page.getByRole('button', { name: 'Explorar possibilidades' }).click()
  const result = page.locator('#talentos [role="status"]')
  await expect(result.getByRole('link')).toHaveCount(3)
  await expect(
    result.getByRole('link', { name: 'Pau Brasil Motos' }),
  ).toBeVisible()
  await expect(result).toContainText(
    'Não é uma oferta de vaga nem envia uma candidatura',
  )
  await page.getByLabel('Sua área de interesse').selectOption('agro')
  await expect(result.getByRole('link')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explorar possibilidades' }).click()
  await expect(
    result.getByRole('link', { name: 'Fazenda Divina' }),
  ).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: '/tmp/paubrasil-brand/hub-hero.png' })
  await page.screenshot({
    path: '/tmp/paubrasil-brand/hub-desktop.png',
    fullPage: true,
  })
  expect(errors).toEqual([])
})

test('empresas: unidades filtráveis e catálogo incompleto explícito', async ({
  page,
}) => {
  await page.goto('/empresas/bebidas')
  await expect(
    page.getByRole('heading', { name: 'Pau Brasil Bebidas', exact: true }),
  ).toBeVisible()
  await expect(page.locator('#unidades article')).toHaveCount(8)
  await page.getByRole('button', { name: 'BA', exact: true }).click()
  await expect(page.locator('#unidades article')).toHaveCount(3)
  await page.getByLabel('Buscar unidade por cidade').fill('cacule')
  await expect(page.locator('#unidades article')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Caculé' })).toBeVisible()
  await page.getByLabel('Buscar unidade por cidade').fill('inexistente')
  await expect(
    page.getByText('Nenhuma unidade encontrada para essa busca.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await expect(page.locator('#unidades article')).toHaveCount(8)
  await page.screenshot({ path: '/tmp/paubrasil-brand/empresa-bebidas.png', fullPage: true })
  await page.goto('/empresas/hora-10')
  await expect(page.getByText('Novos endereços em breve.')).toBeVisible()
  // A Motos tem site próprio: a página interna redireciona sem abrir o site externo no teste.
  const motos = await page.request.get('/empresas/motos', { maxRedirects: 0 })
  expect(motos.status()).toBe(307)
  expect(motos.headers()['location']).toBe(
    'https://www.paubrasilmotos.com.br/valedosaofrancisco/',
  )
  const response = await page.goto('/empresas/nao-existe')
  expect(response?.status()).toBe(404)
})

test('mobile: navegação, imagens e ausência de conteúdo cortado', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  const mobileNav = page.getByRole('navigation', { name: 'Navegação móvel' })
  await expect(mobileNav).toBeVisible()
  await mobileNav.getByRole('link', { name: 'Nossas empresas' }).click()
  await expect(mobileNav).toHaveCount(0)
  await expect(page).toHaveURL(/#empresas$/)
  await expect(
    page.getByRole('button', { name: 'Abrir menu' }),
  ).toHaveAttribute('aria-expanded', 'false')
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    const overflow = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main *'))
        .filter((element) => {
          const box = element.getBoundingClientRect()
          if (!(box.width > 0 && (box.right > innerWidth + 1 || box.left < -1))) return false
          // Dentro de faixa com rolagem lateral (ex.: abas da newsletter) não é conteúdo cortado.
          for (let el = element.parentElement; el; el = el.parentElement) {
            if (/auto|scroll/.test(getComputedStyle(el).overflowX)) return false
          }
          return true
        })
        .map((element) => element.tagName),
    )
    expect(overflow).toEqual([])
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  // Force lazy images to load before the full-page capture.
  for (const img of await page.locator('img').all()) {
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
  const images = await page
    .locator('img')
    .evaluateAll((imgs) =>
      imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0),
    )
  expect(images).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: '/tmp/paubrasil-brand/hub-mobile.png',
    fullPage: true,
  })
})
