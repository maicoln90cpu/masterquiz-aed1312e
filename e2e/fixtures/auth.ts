/**
 * E2E Auth Fixtures — MasterQuiz
 * Mock roles e sessões para testes Playwright.
 * Playwright NÃO está instalado — estes fixtures ficam prontos para CI futuro.
 */

export type MockRole = 'user' | 'admin' | 'master_admin';

const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDcwMDAwMDAwfQ.mock';

const users: Record<MockRole, { id: string; email: string; name: string }> = {
  user: { id: '11111111-1111-1111-1111-111111111111', email: 'user@test.com', name: 'Test User' },
  admin: { id: '22222222-2222-2222-2222-222222222222', email: 'admin@test.com', name: 'Test Admin' },
  master_admin: { id: '33333333-3333-3333-3333-333333333333', email: 'master@test.com', name: 'Test Master' },
};

export function getMockSession(role: MockRole) {
  const u = users[role];
  return {
    access_token: FAKE_JWT,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: u.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: u.email,
      email_confirmed_at: '2024-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: u.name },
      identities: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  };
}
