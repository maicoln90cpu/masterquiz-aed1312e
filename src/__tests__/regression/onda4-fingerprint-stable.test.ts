import { describe, it, expect } from 'vitest';
// @ts-expect-error - Node built-in disponível no runtime de teste (Vitest/Node)
import { createHash } from 'node:crypto';

/**
 * Regression — Onda 4 / Etapa 1: fingerprint estável de erros.
 *
 * Espelho JS da SQL function `compute_error_fingerprint` (migration
 * 20260421183609). Se a SQL mudar, este teste DEVE ser atualizado em
 * conjunto — caso contrário a normalização SQL e a expectativa do
 * frontend divergem e o agrupamento de erros quebra silenciosamente.
 */
function computeFingerprint(component: string | null | undefined, message: string | null | undefined): string {
  const comp = (component ?? '').trim() || 'Unknown';
  let msg = message ?? '';

  // a) UUIDs
  msg = msg.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>');
  // b) Hashes longos hex
  msg = msg.replace(/[0-9a-f]{8,}/gi, '<HASH>');
  // c) URLs
  msg = msg.replace(/https?:\/\/[^\s"')]+/gi, '<URL>');
  // d) Paths
  msg = msg.replace(/(\/[\w\-./]+\.[a-z]{2,5})/gi, '<PATH>');
  // e) Números
  msg = msg.replace(/\d+/g, '<N>');
  // f) Aspas
  msg = msg.replace(/"[^"]{3,}"/g, '"<STR>"');
  // g) Espaços
  msg = msg.trim().replace(/\s+/g, ' ');
  // h) Lowercase
  msg = msg.toLowerCase();

  return createHash('md5').update(`${comp}::${msg}`).digest('hex');
}

describe('Regression Onda 4 — fingerprint estável (espelho SQL ⇄ JS)', () => {
  it('mensagens com UUIDs diferentes geram MESMO fingerprint', () => {
    const fp1 = computeFingerprint(
      'QuizEditor',
      'Failed to load quiz aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    );
    const fp2 = computeFingerprint(
      'QuizEditor',
      'Failed to load quiz 11111111-2222-3333-4444-555555555555'
    );
    expect(fp1).toBe(fp2);
  });

  it('hashes de chunk JS variáveis geram MESMO fingerprint', () => {
    const fp1 = computeFingerprint('App', 'Error loading chunk-abc123def456.js');
    const fp2 = computeFingerprint('App', 'Error loading chunk-fedcba987654.js');
    expect(fp1).toBe(fp2);
  });

  it('URLs diferentes mas mesma estrutura colapsam no mesmo fingerprint', () => {
    const fp1 = computeFingerprint('Fetch', 'POST https://api.foo.com/v1/quiz failed');
    const fp2 = computeFingerprint('Fetch', 'POST https://api.bar.com/v2/lead failed');
    expect(fp1).toBe(fp2);
  });

  it('mensagens semanticamente DIFERENTES geram fingerprints distintos', () => {
    const fp1 = computeFingerprint('Auth', 'Invalid credentials');
    const fp2 = computeFingerprint('Auth', 'Token expired');
    expect(fp1).not.toBe(fp2);
  });

  it('component_name vazio vira "Unknown" (idêntico à SQL)', () => {
    const fp1 = computeFingerprint('', 'erro x');
    const fp2 = computeFingerprint(null, 'erro x');
    const fp3 = computeFingerprint('   ', 'erro x');
    const fp4 = computeFingerprint('Unknown', 'erro x');
    expect(fp1).toBe(fp2);
    expect(fp2).toBe(fp3);
    expect(fp3).toBe(fp4);
  });

  it('case-insensitive (mensagens em maiúsculas/minúsculas iguais)', () => {
    const fp1 = computeFingerprint('App', 'Network Error');
    const fp2 = computeFingerprint('App', 'NETWORK ERROR');
    expect(fp1).toBe(fp2);
  });

  it('fingerprint é determinístico (md5 hex de 32 chars)', () => {
    const fp = computeFingerprint('X', 'msg');
    expect(fp).toMatch(/^[a-f0-9]{32}$/);
  });
});