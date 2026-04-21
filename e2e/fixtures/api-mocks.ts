/**
 * E2E API Mocks — MasterQuiz
 * Route interceptors para Supabase no Playwright.
 */

import type { Page } from '@playwright/test';
import { type MockRole, getMockSession } from './auth';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';

export async function injectAuthSession(page: Page, role: MockRole) {
  const session = getMockSession(role);
  const storageKey = `sb-${SUPABASE_URL.split('//')[1]?.split('.')[0]}-auth-token`;
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => localStorage.setItem(key, value),
    { key: storageKey, value: JSON.stringify({ currentSession: session, expiresAt: session.expires_at }) },
  );
}

export async function mockSupabaseAuth(page: Page, role: MockRole) {
  const session = getMockSession(role);

  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) }),
  );
  await page.route(`${SUPABASE_URL}/auth/v1/user**`, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session.user) }),
  );
  await page.route(`${SUPABASE_URL}/auth/v1/logout**`, (route: any) =>
    route.fulfill({ status: 204, body: '' }),
  );

  // REST catch-all
  await page.route(`${SUPABASE_URL}/rest/v1/**`, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );

  // RPC catch-all
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, (route: any) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );

  // Storage
  await page.route(`${SUPABASE_URL}/storage/v1/**`, (route: any) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'test.png' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

export async function setupAuthenticatedPage(page: Page, role: MockRole) {
  await injectAuthSession(page, role);
  await mockSupabaseAuth(page, role);
}
