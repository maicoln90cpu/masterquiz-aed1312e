/**
 * E2E Test Fixtures — MasterQuiz
 * Custom test fixture com autenticação por role.
 *
 * Uso:
 * ```ts
 * import { authenticatedTest as test, expect } from './fixtures/test-fixtures';
 *
 * test.describe('Admin Flow', () => {
 *   test.use({ role: 'admin' });
 *   test('loads dashboard', async ({ authenticatedPage: page }) => {
 *     await page.goto('/admin');
 *     await expect(page.locator('h1')).toContainText('Admin');
 *   });
 * });
 * ```
 */

import { test as base, type Page } from '@playwright/test';
import { type MockRole } from './auth';
import { setupAuthenticatedPage } from './api-mocks';

type AuthFixtures = {
  role: MockRole;
  authenticatedPage: Page;
};

export const authenticatedTest = base.extend<AuthFixtures>({
  role: ['user', { option: true }],
  authenticatedPage: async ({ page, role }, use) => {
    await setupAuthenticatedPage(page, role);
    await use(page);
  },
});

export { expect } from '@playwright/test';
