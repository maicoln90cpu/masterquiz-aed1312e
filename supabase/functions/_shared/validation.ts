/**
 * 🛡️ PROTEÇÃO P18 (Onda 7) — Helpers universais de validação para Edge Functions.
 *
 * Padroniza a leitura/validação de body, query e params com Zod e devolve
 * Response 400 já no formato de envelope (P11) quando inválido.
 *
 * Uso típico em uma edge:
 *   const traceId = getTraceId(req);
 *   const parsed = await parseBody(req, BodySchema, traceId);
 *   if (parsed instanceof Response) return parsed;
 *   const { user_id } = parsed.data;
 *
 * Importante: NUNCA inventar códigos de erro fora do envelope (P11).
 */
import { z } from 'https://esm.sh/zod@3.23.8';
import { errorResponse } from './envelope.ts';

export interface ParsedOk<T> {
  data: T;
}

function formatZodError(err: z.ZodError): string {
  const issues = err.issues.slice(0, 5).map((i) => {
    const path = i.path.join('.') || '(root)';
    return `${path}: ${i.message}`;
  });
  return issues.join(' | ');
}

/**
 * Lê e valida o JSON body. Em falha, retorna Response 400 envelopada.
 * Em sucesso, retorna { data }.
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
  traceId: string,
): Promise<ParsedOk<T> | Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse(
      'VALIDATION_FAILED',
      'Body inválido: JSON malformado',
      traceId,
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_FAILED',
      formatZodError(parsed.error),
      traceId,
    );
  }
  return { data: parsed.data };
}

/**
 * Variante: aceita body vazio. Retorna `{ data: undefined }` se body ausente.
 */
export async function parseBodyOptional<T>(
  req: Request,
  schema: z.ZodType<T>,
  traceId: string,
): Promise<ParsedOk<T | undefined> | Response> {
  const text = await req.text();
  if (!text || text.trim() === '') return { data: undefined };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return errorResponse(
      'VALIDATION_FAILED',
      'Body inválido: JSON malformado',
      traceId,
    );
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_FAILED',
      formatZodError(parsed.error),
      traceId,
    );
  }
  return { data: parsed.data };
}

/**
 * Valida URLSearchParams contra um schema Zod.
 */
export function parseQuery<T>(
  url: URL | string,
  schema: z.ZodType<T>,
  traceId: string,
): ParsedOk<T> | Response {
  const u = typeof url === 'string' ? new URL(url) : url;
  const obj: Record<string, string> = {};
  u.searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    return errorResponse(
      'VALIDATION_FAILED',
      formatZodError(parsed.error),
      traceId,
    );
  }
  return { data: parsed.data };
}

/**
 * Re-export do Zod para os edges não precisarem importar de outro CDN
 * (consistência de versão).
 */
export { z };