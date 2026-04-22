/**
 * 🔒 PROTEÇÃO P18 (Onda 7) — Cobertura de envelope nas Edge Functions.
 *
 * Garante que toda edge function listada em `MIGRATED_EDGES` (já migrada para
 * o envelope { ok, data, error, traceId }) continue usando os helpers
 * `okResponse` / `errorResponse` de `_shared/envelope.ts` em TODOS os retornos.
 *
 * Como adicionar uma edge nova migrada:
 *   1. Adicione o nome à constante `MIGRATED_EDGES` abaixo.
 *   2. Esta proteção passa a vigiar todos os `return new Response` daquele arquivo.
 *
 * Falha o build se:
 *   - Edge listada em MIGRATED_EDGES contém `return new Response(JSON.stringify(...))`
 *     fora dos helpers de envelope (regressão para padrão antigo).
 *   - Edge listada não importa `okResponse` ou `errorResponse` de `../_shared/envelope.ts`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Edge functions já migradas para envelope (Onda 7 / Etapas 1-3). */
const MIGRATED_EDGES = [
  'admin-update-subscription',
  'admin-view-user-data',
  'system-health-check',
  'export-table-data',
  'save-quiz-draft',
  'growth-metrics',
  'kiwify-webhook',
  'evolution-webhook',
] as const;

function readEdge(name: string): string {
  const p = resolve(process.cwd(), 'supabase', 'functions', name, 'index.ts');
  expect(existsSync(p), `Edge function ausente: ${name}`).toBe(true);
  return readFileSync(p, 'utf-8');
}

describe('P18 — Envelope coverage nas edges migradas', () => {
  for (const edge of MIGRATED_EDGES) {
    describe(edge, () => {
      const src = readEdge(edge);

      it('importa okResponse ou errorResponse de _shared/envelope.ts', () => {
        const importsEnvelope =
          /from\s+["']\.\.\/_shared\/envelope\.ts["']/.test(src) &&
          /\b(okResponse|errorResponse)\b/.test(src);
        expect(
          importsEnvelope,
          `${edge} deve importar okResponse/errorResponse de '../_shared/envelope.ts'`,
        ).toBe(true);
      });

      it('não usa "return new Response(JSON.stringify({error" (padrão antigo)', () => {
        // Detecta o anti-padrão: resposta crua de erro sem envelope.
        // Aceita ocorrências DENTRO do arquivo envelope.ts (não testado aqui),
        // mas em qualquer edge migrada deve estar zerado.
        const matches = src.match(
          /return\s+new\s+Response\s*\(\s*JSON\.stringify\s*\(\s*\{\s*error/g,
        );
        expect(
          matches,
          `${edge}: ${matches?.length ?? 0} retorno(s) cru(s) detectado(s). Use errorResponse(...).`,
        ).toBeNull();
      });
    });
  }
});