/**
 * 🔒 PROTEÇÃO P11 — Contract test do envelope { ok, data?, error?, traceId }.
 *
 * Garante que toda resposta de Edge Function que adote o envelope siga
 * exatamente o shape definido em src/lib/envelope.ts.
 */
import { describe, it, expect } from 'vitest';
import {
  EnvelopeSchema,
  EnvelopeSuccessSchema,
  EnvelopeErrorSchema,
  unwrapEnvelope,
  EnvelopeError,
} from '@/lib/envelope';

describe('Envelope schema (P11)', () => {
  it('aceita resposta de sucesso bem formada', () => {
    const ok = {
      ok: true,
      data: { total_mb: 12 },
      traceId: 'abc-123',
    };
    expect(EnvelopeSchema.safeParse(ok).success).toBe(true);
    expect(EnvelopeSuccessSchema.safeParse(ok).success).toBe(true);
  });

  it('aceita resposta de erro bem formada com código padronizado', () => {
    const err = {
      ok: false,
      error: { code: 'VALIDATION_FAILED', message: 'quiz_id ausente' },
      traceId: 'xyz-9',
    };
    expect(EnvelopeSchema.safeParse(err).success).toBe(true);
    expect(EnvelopeErrorSchema.safeParse(err).success).toBe(true);
  });

  it('rejeita resposta sem traceId', () => {
    expect(
      EnvelopeSchema.safeParse({ ok: true, data: {} }).success
    ).toBe(false);
    expect(
      EnvelopeSchema.safeParse({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'x' },
      }).success
    ).toBe(false);
  });

  it('rejeita código de erro não documentado', () => {
    const bad = {
      ok: false,
      error: { code: 'NOPE', message: 'x' },
      traceId: 't',
    };
    expect(EnvelopeSchema.safeParse(bad).success).toBe(false);
  });

  it('rejeita ok=true sem campo data', () => {
    expect(
      EnvelopeSchema.safeParse({ ok: true, traceId: 't' }).success
    ).toBe(false);
  });
});

describe('unwrapEnvelope helper', () => {
  it('retorna data quando ok=true', () => {
    const data = unwrapEnvelope<{ x: number }>({
      ok: true,
      data: { x: 42 },
      traceId: 't1',
    });
    expect(data).toEqual({ x: 42 });
  });

  it('lança EnvelopeError quando ok=false preservando código e traceId', () => {
    expect(() =>
      unwrapEnvelope({
        ok: false,
        error: { code: 'RATE_LIMITED', message: 'devagar' },
        traceId: 't2',
      })
    ).toThrowError(EnvelopeError);

    try {
      unwrapEnvelope({
        ok: false,
        error: { code: 'RATE_LIMITED', message: 'devagar' },
        traceId: 't2',
      });
    } catch (e) {
      expect(e).toBeInstanceOf(EnvelopeError);
      expect((e as EnvelopeError).code).toBe('RATE_LIMITED');
      expect((e as EnvelopeError).traceId).toBe('t2');
    }
  });

  it('lança INTERNAL_ERROR para resposta fora do envelope', () => {
    expect(() => unwrapEnvelope({ foo: 'bar' })).toThrowError(EnvelopeError);
  });
});
