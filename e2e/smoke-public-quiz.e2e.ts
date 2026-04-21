/**
 * E2E Smoke — Public Quiz Visitor Flow
 *
 * Etapa 4 da Onda 5 — Testes Automatizados.
 * Valida o fluxo crítico mais simples: a landing page carrega sem erros
 * e expõe os elementos públicos esperados (sem auth, sem dependência de DB real).
 *
 * Para expandir: adicione fluxos autenticados usando `authenticatedTest`
 * de ./fixtures/test-fixtures.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke: Landing pública', () => {
  test('carrega sem erros de console críticos', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignora ruído conhecido (HMR, extensões, third-party)
        if (
          !text.includes('extension') &&
          !text.includes('ResizeObserver') &&
          !text.includes('[vite]')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    // Body deve renderizar
    await expect(page.locator('body')).toBeVisible();

    // Não deve ter erros JS críticos
    expect(consoleErrors).toEqual([]);
  });

  test('rota /auth renderiza tela de login', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('body')).toBeVisible();
    // Espera por algum input de email/senha (campos de auth padrão)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
  });
});
