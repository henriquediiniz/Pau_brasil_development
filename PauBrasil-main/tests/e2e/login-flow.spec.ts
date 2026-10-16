import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação e Navegação Inicial', () => {
  test('Deve realizar login com sucesso e carregar o dashboard', async ({ page }) => {
    // 1. Ir para a página de login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Grupo Pau Brasil/);

    // 2. Preencher credenciais
    await page.fill('#email', 'gestor@grupopaubrasil.com.br');
    await page.fill('#password', 'Gestor@2026!');

    // 3. Clicar em entrar e esperar navegação
    await Promise.all([
      page.waitForURL(/\/app|\/universidade/, { timeout: 45000 }),
      page.click('button[type="submit"]')
    ]);

    // 4. Verificar se algum elemento do dashboard está visível
    await page.waitForLoadState('networkidle');
    const welcome = page.locator('h1, h2, .text-white').filter({ hasText: /Bem-vindo|Início|Atividades|Pau Brasil/i });
    await expect(welcome.first()).toBeVisible();
  });

  test('Deve exibir erro ao usar credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'joao@grupopaubrasil.com.br');
    await page.fill('#password', 'SenhaErrada123!');
    await page.click('button[type="submit"]');

    // Verificar mensagem de erro
    const errorBanner = page.locator('text=Credenciais inválidas');
    await expect(errorBanner).toBeVisible();
  });
});
