import { describe, it, expect } from 'vitest';

/**
 * Contrato P11: policies RLS devem usar `(SELECT auth.uid())` ao invés de `auth.uid()` direto.
 *
 * Por quê:
 * - `auth.uid()` dentro de `USING (...)` ou `WITH CHECK (...)` é re-executado em CADA LINHA
 *   avaliada pela policy, causando lentidão proporcional ao tamanho da tabela
 *   (Supabase Advisor: lint `auth_rls_initplan`).
 * - `(SELECT auth.uid())` ativa o "initplan caching" do Postgres → é avaliado UMA VEZ por query.
 *
 * Como corrigir uma policy nova:
 *   ❌ USING (user_id = auth.uid())
 *   ✅ USING (user_id = (SELECT auth.uid()))
 *
 *   ❌ USING (has_role(auth.uid(), 'admin'::app_role))
 *   ✅ USING (has_role((SELECT auth.uid()), 'admin'::app_role))
 *
 * Estratégia: baseline incremental — falha se o número TOTAL de ocorrências aumentar.
 * Ao corrigir policies antigas, o contador desce e este arquivo deve ser atualizado pra baixo.
 * Migrations antigas NÃO devem ser editadas — corrija recriando policies em uma migration nova.
 */

// Baseline atual (01/05/2026, após Migrations P3 que normalizaram 16 policies das 8 tabelas mais quentes).
// Para descobrir o atual, rode o teste e veja "Total: X" no console.
// Atualize PARA BAIXO conforme limpa, NUNCA pra cima.
const MAX_BARE_AUTH_UID_ALLOWED = 235;

const migrationFiles = import.meta.glob('/supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Para cada cláusula USING(...) ou WITH CHECK(...), conta ocorrências de
 * `auth.uid()` que NÃO estão envolvidas por `(SELECT ... )`.
 */
function countBareAuthUid(sql: string): number {
  const headers = [...sql.matchAll(/\b(USING|WITH\s+CHECK)\s*\(/gi)];
  let total = 0;

  for (const header of headers) {
    const openIdx = header.index! + header[0].length - 1; // índice do '('
    let depth = 0;
    let endIdx = -1;
    for (let i = openIdx; i < sql.length; i++) {
      const ch = sql[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx < 0) continue;

    const body = sql.slice(openIdx, endIdx + 1);
    const calls = [...body.matchAll(/\bauth\.uid\(\)/g)];
    for (const call of calls) {
      const before = body.slice(Math.max(0, call.index! - 40), call.index!);
      // Considera "wrapped" se imediatamente antes vier "(SELECT" + espaços
      if (!/\(\s*SELECT\s+$/i.test(before)) {
        total++;
      }
    }
  }

  return total;
}

describe('RLS Contract: auth.uid() must be wrapped in (SELECT ...)', () => {
  it('número de auth.uid() bare em USING/WITH CHECK não aumenta', () => {
    const offenders: Array<{ file: string; count: number }> = [];
    let total = 0;

    for (const [filePath, sql] of Object.entries(migrationFiles)) {
      const count = countBareAuthUid(sql);
      if (count > 0) {
        offenders.push({ file: filePath.split('/').pop() ?? filePath, count });
        total += count;
      }
    }

    if (total < MAX_BARE_AUTH_UID_ALLOWED) {
      // eslint-disable-next-line no-console
      console.info(
        `[p11-rls-auth-uid-subselect] Total atual: ${total} (baseline: ${MAX_BARE_AUTH_UID_ALLOWED}). ` +
          `Considere baixar o baseline para ${total} em src/__tests__/contracts/p11-rls-auth-uid-subselect.test.ts.`
      );
    }

    const recentOffenders = offenders
      .sort((a, b) => a.file.localeCompare(b.file))
      .slice(-5)
      .map((o) => `  ${o.file} → ${o.count}`)
      .join('\n');

    expect(
      total,
      `⚠️ Uso de auth.uid() bare em USING/WITH CHECK subiu de ${MAX_BARE_AUTH_UID_ALLOWED} → ${total}.\n\n` +
        `Em policies novas, sempre use (SELECT auth.uid()):\n` +
        `  ❌ USING (user_id = auth.uid())\n` +
        `  ✅ USING (user_id = (SELECT auth.uid()))\n\n` +
        `Migrations mais recentes com ocorrências:\n${recentOffenders}`
    ).toBeLessThanOrEqual(MAX_BARE_AUTH_UID_ALLOWED);
  });

  it('detecta corretamente padrões bare vs wrapped (sanity check)', () => {
    const bare = `CREATE POLICY x ON t FOR SELECT USING (user_id = auth.uid());`;
    const wrapped = `CREATE POLICY x ON t FOR SELECT USING (user_id = (SELECT auth.uid()));`;
    const mixed = `
      CREATE POLICY a ON t USING (user_id = auth.uid());
      CREATE POLICY b ON t USING (user_id = (SELECT auth.uid()));
      CREATE POLICY c ON t USING (has_role(auth.uid(), 'admin'));
    `;
    expect(countBareAuthUid(bare)).toBe(1);
    expect(countBareAuthUid(wrapped)).toBe(0);
    expect(countBareAuthUid(mixed)).toBe(2);
  });
});