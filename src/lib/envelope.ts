/**
 * 🔒 PROTEÇÃO P11 — Envelope cliente.
 *
 * Use `unwrapEnvelope()` para chamar Edge Functions que adotam o envelope:
 *   try {
 *     const data = await unwrapEnvelope(supabase.functions.invoke('xxx', { body }));
 *   } catch (e) {
 *     if (e instanceof EnvelopeError) {
 *       if (e.code === 'RATE_LIMITED') ...
 *     }
 *   }
 *
 * Para funções que ainda NÃO adotaram o envelope (a maioria), continue
 * usando o padrão antigo. Migração gradual.
 */
import { z } from 'zod';

export const EnvelopeErrorCodeSchema = z.enum([
  'VALIDATION_FAILED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

export const EnvelopeSuccessSchema = z.object({
  ok: z.literal(true),
  // `data` é obrigatório; aceitamos qualquer valor, mas a chave precisa estar presente.
  data: z.unknown().refine((_v, ctx) => {
    // Zod só chama refine se a chave existe no objeto pai → presença garantida.
    return true;
  }),
  traceId: z.string().min(1),
}).refine((obj) => 'data' in obj, {
  message: 'data é obrigatório no envelope de sucesso',
  path: ['data'],
});

export const EnvelopeErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: EnvelopeErrorCodeSchema,
    message: z.string().min(1),
  }),
  traceId: z.string().min(1),
});

export const EnvelopeSchema = z.discriminatedUnion('ok', [
  EnvelopeSuccessSchema,
  EnvelopeErrorSchema,
]);

export type EnvelopeErrorCode = z.infer<typeof EnvelopeErrorCodeSchema>;
export type EnvelopeSuccess<T = unknown> = { ok: true; data: T; traceId: string };
export type EnvelopeErrorPayload = { ok: false; error: { code: EnvelopeErrorCode; message: string }; traceId: string };

export class EnvelopeError extends Error {
  code: EnvelopeErrorCode;
  traceId: string;
  constructor(code: EnvelopeErrorCode, message: string, traceId: string) {
    super(message);
    this.name = 'EnvelopeError';
    this.code = code;
    this.traceId = traceId;
  }
}

/**
 * Recebe o resultado bruto de `supabase.functions.invoke()` (ou de um fetch
 * que devolveu JSON) e retorna `data` se ok, ou lança `EnvelopeError`.
 */
export function unwrapEnvelope<T = unknown>(raw: unknown): T {
  const parsed = EnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EnvelopeError(
      'INTERNAL_ERROR',
      'Resposta fora do envelope esperado',
      'unknown'
    );
  }
  if (parsed.data.ok) {
    return parsed.data.data as T;
  }
  const errPayload = parsed.data as EnvelopeErrorPayload;
  throw new EnvelopeError(
    errPayload.error.code,
    errPayload.error.message,
    errPayload.traceId
  );
}
