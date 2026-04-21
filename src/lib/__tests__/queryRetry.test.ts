import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shouldRetryQuery, queryRetryDelay } from '../queryRetry';

describe('shouldRetryQuery', () => {
  it('retorna true para erros transitórios (network) até maxAttempts', () => {
    const err = new Error('Network error');
    expect(shouldRetryQuery(0, err, 3)).toBe(true);
    expect(shouldRetryQuery(2, err, 3)).toBe(true);
    expect(shouldRetryQuery(3, err, 3)).toBe(false);
  });

  it('retorna true para erros 5xx', () => {
    expect(shouldRetryQuery(0, { status: 500, message: 'Internal' }, 3)).toBe(true);
    expect(shouldRetryQuery(0, { status: 503, message: 'Unavailable' }, 3)).toBe(true);
  });

  it('NÃO retenta erros 4xx (cliente)', () => {
    expect(shouldRetryQuery(0, { status: 404, message: 'Not found' }, 3)).toBe(false);
    expect(shouldRetryQuery(0, { status: 401, message: 'Unauthorized' }, 3)).toBe(false);
    expect(shouldRetryQuery(0, { status: 403, message: 'Forbidden' }, 3)).toBe(false);
    expect(shouldRetryQuery(0, { status: 422, message: 'Unprocessable' }, 3)).toBe(false);
  });

  it('NÃO retenta erros conhecidos do PostgREST/Postgres', () => {
    expect(shouldRetryQuery(0, { code: 'PGRST116' }, 3)).toBe(false);
    expect(shouldRetryQuery(0, { code: '42501' }, 3)).toBe(false);
    expect(shouldRetryQuery(0, { code: '23505' }, 3)).toBe(false);
  });

  it('aceita maxAttempts customizado (mutations = 1)', () => {
    expect(shouldRetryQuery(0, new Error('x'), 1)).toBe(true);
    expect(shouldRetryQuery(1, new Error('x'), 1)).toBe(false);
  });

  it('null/undefined são tratados como retryable', () => {
    expect(shouldRetryQuery(0, null, 3)).toBe(true);
    expect(shouldRetryQuery(0, undefined, 3)).toBe(true);
  });
});

describe('queryRetryDelay', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // jitter = 0 para previsibilidade
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aplica backoff exponencial: 1s, 2s, 4s, 8s', () => {
    expect(queryRetryDelay(0)).toBe(1000);
    expect(queryRetryDelay(1)).toBe(2000);
    expect(queryRetryDelay(2)).toBe(4000);
    expect(queryRetryDelay(3)).toBe(8000);
  });

  it('cap em 30s para tentativas tardias', () => {
    expect(queryRetryDelay(10)).toBe(30_000);
    expect(queryRetryDelay(20)).toBe(30_000);
  });

  it('adiciona jitter aleatório (até 250ms)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = queryRetryDelay(0);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1250);
  });
});
