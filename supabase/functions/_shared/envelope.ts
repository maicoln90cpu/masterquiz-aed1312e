/**
 * 🔒 PROTEÇÃO P11 — Envelope padronizado de respostas das Edge Functions.
 *
 * Toda resposta DEVE seguir o shape:
 *   Sucesso: { ok: true,  data: <T>,                  traceId: string }
 *   Erro:    { ok: false, error: { code, message },   traceId: string }
 *
 * Códigos de erro padronizados (não inventar novos sem documentar):
 *   - VALIDATION_FAILED  → 400  (payload inválido / Zod)
 *   - UNAUTHORIZED       → 401  (sem JWT, sem permissão)
 *   - FORBIDDEN          → 403  (autenticado mas sem direito)
 *   - NOT_FOUND          → 404  (recurso inexistente)
 *   - RATE_LIMITED       → 429  (limite de requisições)
 *   - INTERNAL_ERROR     → 500  (qualquer falha não prevista)
 *
 * NUNCA retorne Response sem traceId — o contract test (P11) quebra o build.
 */

export type EnvelopeErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface EnvelopeSuccess<T = unknown> {
  ok: true;
  data: T;
  traceId: string;
}

export interface EnvelopeError {
  ok: false;
  error: { code: EnvelopeErrorCode; message: string };
  traceId: string;
}

export type Envelope<T = unknown> = EnvelopeSuccess<T> | EnvelopeError;

const STATUS_BY_CODE: Record<EnvelopeErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/** Pega traceId de um header ou gera um novo. */
export function getTraceId(req: Request): string {
  return req.headers.get('x-trace-id') || crypto.randomUUID();
}

/** Resposta de sucesso padronizada. */
export function okResponse<T>(
  data: T,
  traceId: string,
  extraHeaders: Record<string, string> = {}
): Response {
  const body: EnvelopeSuccess<T> = { ok: true, data, traceId };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id': traceId,
      ...extraHeaders,
    },
  });
}

/** Resposta de erro padronizada. */
export function errorResponse(
  code: EnvelopeErrorCode,
  message: string,
  traceId: string,
  extraHeaders: Record<string, string> = {},
  statusOverride?: number
): Response {
  const body: EnvelopeError = { ok: false, error: { code, message }, traceId };
  return new Response(JSON.stringify(body), {
    status: statusOverride ?? STATUS_BY_CODE[code],
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id': traceId,
      ...extraHeaders,
    },
  });
}
