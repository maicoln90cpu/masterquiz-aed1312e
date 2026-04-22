/**
 * 🛡️ P30 — Contract test: banners coloridos hardcoded não devem aumentar
 *
 * Garante que ninguém volte a criar banners com classes Tailwind hardcoded como
 * `bg-amber-50 dark:bg-amber-950/20 border border-amber-200`. Esses banners devem
 * usar o componente <Callout> de @/components/ui/callout (Onda 8.6).
 *
 * Estratégia: baseline numérica via import.meta.glob (Vite) — falha se subir.
 * Quando migrar um arquivo para <Callout>, REDUZA o BASELINE_MAX.
 */
import { describe, it, expect } from "vitest";

// Carrega TODOS os .tsx/.jsx do projeto como string (eager raw load via Vite).
const allSourceFiles = import.meta.glob("/src/**/*.{tsx,jsx}", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

// Padrão de banner: bg-{cor}-{nivel} + border-{cor}-{nivel} próximos.
const BANNER_PATTERN =
  /\bbg-(amber|yellow|orange|red|green|emerald|blue|sky|indigo|purple|pink|rose)-(50|100|950)\b[^"`']*\bborder-(amber|yellow|orange|red|green|emerald|blue|sky|indigo|purple|pink|rose)-/g;

// Arquivos que SÃO o próprio Callout — ignorar.
const IGNORE = new Set<string>([
  "/src/components/ui/callout.tsx",
]);

function countViolations(): { total: number; files: string[] } {
  let total = 0;
  const files: string[] = [];
  for (const [path, content] of Object.entries(allSourceFiles)) {
    if (IGNORE.has(path)) continue;
    if (path.includes("__tests__")) continue;
    const matches = content.match(BANNER_PATTERN) || [];
    if (matches.length) {
      total += matches.length;
      files.push(`${path} (${matches.length})`);
    }
  }
  return { total, files };
}

/**
 * Baseline conservador. REDUZA quando migrar banners para <Callout>.
 * NUNCA aumente — se subir, o teste falha e força code review consciente.
 */
const BASELINE_MAX = 200;

describe("P30 — Contract: banners coloridos hardcoded não devem crescer", () => {
  it(`mantém ≤ ${BASELINE_MAX} ocorrências de banner sem <Callout>`, () => {
    const { total, files } = countViolations();
    if (total > BASELINE_MAX) {
      console.error(
        `\n❌ P30 violations subiu para ${total} (max ${BASELINE_MAX}).\nArquivos (top 20):\n  ${files.slice(0, 20).join("\n  ")}\n\n→ Use <Callout> de @/components/ui/callout em vez de banner hardcoded, ou reduza BASELINE_MAX se você JÁ migrou um banner antigo.`,
      );
    }
    expect(total).toBeLessThanOrEqual(BASELINE_MAX);
  });
});