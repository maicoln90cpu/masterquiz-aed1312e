/**
 * 🛡️ P30 — Contract test: banners coloridos hardcoded não devem aumentar
 *
 * Garante que ninguém volte a criar banners com classes Tailwind hardcoded como
 * `bg-amber-50 dark:bg-amber-950/20 border border-amber-200`. Esses banners devem
 * usar o componente <Callout> de @/components/ui/callout (Onda 8.6).
 *
 * Estratégia: baseline numérica — falha se o número de ocorrências subir.
 * Quando migrar um arquivo da allowlist para Callout, REDUZA o BASELINE_MAX.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Padrões que indicam banner hardcoded em vez de <Callout>:
// - bg-{amber|yellow|orange|red|green|blue|emerald|sky|indigo|purple|pink|rose}-50/100/950/...
//   COMBINADO com "border border-{cor}-{nivel}" na mesma linha (=> banner típico).
const BANNER_PATTERN =
  /\bbg-(amber|yellow|orange|red|green|emerald|blue|sky|indigo|purple|pink|rose)-(50|100|950)\b[^"`']*\bborder-(amber|yellow|orange|red|green|emerald|blue|sky|indigo|purple|pink|rose)-/;

// Arquivos que SÃO o componente Callout ou implementações low-level — ignorar.
const IGNORE = new Set<string>([
  "src/components/ui/callout.tsx",
]);

const ROOT = join(process.cwd(), "src");

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__" || entry === "test") continue;
      yield* walk(full);
    } else if (/\.(tsx|jsx)$/.test(entry)) {
      yield full;
    }
  }
}

function countViolations(): { total: number; files: string[] } {
  let total = 0;
  const files: string[] = [];
  for (const file of walk(ROOT)) {
    const rel = relative(process.cwd(), file).replace(/\\/g, "/");
    if (IGNORE.has(rel)) continue;
    const content = readFileSync(file, "utf8");
    const matches = content.match(new RegExp(BANNER_PATTERN, "g")) || [];
    if (matches.length) {
      total += matches.length;
      files.push(`${rel} (${matches.length})`);
    }
  }
  return { total, files };
}

/**
 * Baseline conservador. Atualizar este número PARA BAIXO toda vez que migrar
 * um banner para <Callout>. NUNCA aumentar — se subir, o teste falha e força
 * code review consciente.
 */
const BASELINE_MAX = 200;

describe("P30 — Contract: banners coloridos hardcoded não devem crescer", () => {
  it(`mantém ≤ ${BASELINE_MAX} ocorrências de banner sem <Callout>`, () => {
    const { total, files } = countViolations();
    if (total > BASELINE_MAX) {
      // Mostra arquivos quando falha — facilita PR review.
      console.error(
        `\n❌ P30 violations cresceu para ${total} (max ${BASELINE_MAX}).\nArquivos:\n  ${files.slice(0, 20).join("\n  ")}\n\n→ Migre o novo banner para <Callout> de @/components/ui/callout, ou reduza o BASELINE_MAX se você JÁ migrou um banner antigo.`,
      );
    }
    expect(total).toBeLessThanOrEqual(BASELINE_MAX);
  });
});