import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config — MasterQuiz E2E
 *
 * Etapa 4 da Onda 5 — Testes Automatizados.
 * Roda contra preview Vite local (porta 8080) ou URL configurada via PLAYWRIGHT_BASE_URL.
 *
 * Smoke E2E mínimo: 1 fluxo (visitor responde quiz público).
 * Para CI completo, expanda a matriz e habilite o job em .github/workflows/test.yml.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
