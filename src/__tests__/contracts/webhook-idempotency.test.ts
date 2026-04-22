/**
 * 🔒 PROTEÇÃO P19 (Onda 7) — Idempotência obrigatória em webhooks externos.
 *
 * Toda Edge Function listada em `WEBHOOK_EDGES` DEVE chamar `claimEvent`
 * de `../_shared/idempotency.ts` antes de processar o payload, evitando
 * cobranças/mensagens/notificações duplicadas em reentregas do provider.
 *
 * Falha o build se:
 *   - Webhook listado não importa `claimEvent`.
 *   - Webhook listado não chama `claimEvent(` no corpo.
 *
 * Para adicionar um novo webhook externo, inclua-o em WEBHOOK_EDGES.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const WEBHOOK_EDGES = ['kiwify-webhook', 'evolution-webhook'] as const;

function readEdge(name: string): string {
  const p = resolve(process.cwd(), 'supabase', 'functions', name, 'index.ts');
  expect(existsSync(p), `Edge function ausente: ${name}`).toBe(true);
  return readFileSync(p, 'utf-8');
}

describe('P19 — Idempotência obrigatória em webhooks', () => {
  for (const edge of WEBHOOK_EDGES) {
    describe(edge, () => {
      const src = readEdge(edge);

      it('importa claimEvent de _shared/idempotency.ts', () => {
        const ok =
          /from\s+["']\.\.\/_shared\/idempotency\.ts["']/.test(src) &&
          /\bclaimEvent\b/.test(src);
        expect(
          ok,
          `${edge}: deve importar claimEvent de '../_shared/idempotency.ts'.`,
        ).toBe(true);
      });

      it('chama claimEvent( ao menos uma vez no corpo', () => {
        const calls = src.match(/\bclaimEvent\s*\(/g);
        expect(
          (calls?.length ?? 0) >= 1,
          `${edge}: nenhuma chamada a claimEvent() encontrada — risco de processamento duplicado.`,
        ).toBe(true);
      });

      it('chama markEventProcessed ou markEventFailed para fechar o ciclo', () => {
        const closes =
          /\bmarkEventProcessed\s*\(/.test(src) ||
          /\bmarkEventFailed\s*\(/.test(src);
        expect(
          closes,
          `${edge}: deve chamar markEventProcessed ou markEventFailed após processar.`,
        ).toBe(true);
      });
    });
  }
});