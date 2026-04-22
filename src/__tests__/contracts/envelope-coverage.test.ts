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

/**
 * Edge functions já migradas para envelope completo (Onda 7 — Etapas 1-2-bis + Sub-onda 7-B).
 *
 * NOTA: kiwify-webhook e evolution-webhook adotaram apenas idempotência (P19);
 * track-cta-redirect tem ramo GET 302 que não é envelopado (gateway de redirect)
 * mas o ramo POST usa envelope.
 */
const MIGRATED_EDGES = [
  // Etapa 1-2-bis (6)
  'admin-update-subscription',
  'admin-view-user-data',
  'system-health-check',
  'export-table-data',
  'save-quiz-draft',
  'growth-metrics',
  // Sub-onda 7-B — tracking & utilitários (8)
  'save-quiz-response',
  'track-quiz-analytics',
  'track-quiz-step',
  'track-blog-view',
  'track-video-analytics',
  'track-cta-redirect',
  'rate-limiter',
  'anonymize-ips',
  // Sub-onda 7-C — Admin/User (10)
  'list-all-users',
  'list-all-respondents',
  'delete-user',
  'delete-user-complete',
  'export-user-data',
  'update-user-profile',
  'merge-user-data',
  'migrate-imported-user',
  'check-imported-user',
  'check-expired-trials',
  'sync-plan-limits',
  // Sub-onda 7-D — Mensageria (17)
  'send-welcome-message',
  'send-test-message',
  'send-test-email',
  'send-weekly-tip',
  'send-blog-digest',
  'send-monthly-summary',
  'send-success-story',
  'send-platform-news',
  'process-recovery-queue',
  'process-email-recovery-queue',
  'send-whatsapp-recovery',
  'check-inactive-users',
  'check-inactive-users-email',
  'check-activation-24h',
  'egoi-email-webhook',
  'handle-email-unsubscribe',
  'generate-email-content',
  // Sub-onda 7-D (final) — WhatsApp/Pagamento (4)
  'evolution-connect',
  'evolution-webhook',
  'whatsapp-ai-reply',
  'kiwify-webhook',
] as const;

/**
 * Exceções documentadas: edges com retornos crus EXCLUSIVAMENTE no
 * ramo GET (gateway HTTP que retorna 302/4xx fora de envelope).
 * O ramo POST DEVE continuar usando envelope.
 */
const ALLOW_RAW_RESPONSE = new Set<string>([
  'track-cta-redirect', // GET → 302 redirect; POST → envelope
  // Webhooks de provedores externos exigem shape específico de handshake
  // ({ success: true } / { received: true }). Apenas ramos de erro usam envelope.
  'evolution-webhook',
  'kiwify-webhook',
  'egoi-email-webhook',
  // Gateway HTML de unsubscribe (link no e-mail) — devolve HTML; ramos de erro envelope.
  'handle-email-unsubscribe',
]);

/** Carrega TODAS as edges de uma vez via Vite glob (sem depender de Node fs). */
const edgeSources = import.meta.glob(
  '/supabase/functions/*/index.ts',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

function readEdge(name: string): string {
  const key = `/supabase/functions/${name}/index.ts`;
  const src = edgeSources[key];
  expect(src, `Edge function ausente em glob: ${name}`).toBeTruthy();
  return src;
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
        if (ALLOW_RAW_RESPONSE.has(edge)) {
          // Edges com gateway HTTP têm exceção documentada; valida apenas
          // que ainda há pelo menos uma chamada a errorResponse no arquivo.
          expect(
            /\berrorResponse\s*\(/.test(src),
            `${edge}: exceção autorizada de raw response, mas precisa usar errorResponse no ramo POST`,
          ).toBe(true);
          return;
        }
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