import { describe, it, expect } from 'vitest';

/**
 * Contrato P7: cores hardcoded quebram dark mode + design system.
 *
 * Use sempre tokens HSL semânticos definidos em src/index.css e tailwind.config.ts:
 *   bg-background, bg-primary, text-foreground, text-muted-foreground,
 *   border-border, ring-ring, etc.
 *
 * Detectamos:
 * 1. Classes Tailwind absolutas: bg-white, text-black, bg-red-500, border-blue-300…
 * 2. Cores arbitrárias inline: bg-[#ff0000], text-[rgb(...)], border-[hsl(...)]
 *
 * Allowlist: arquivos com motivo legítimo (heatmaps, charts com cores fixas).
 *
 * Estratégia: contagem com baseline. Falha se o número de violações AUMENTAR
 * em relação ao baseline atual (limpeza incremental, sem bloquear PRs legados).
 */

const allSourceFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Allowlist: arquivos onde cores absolutas são intencionais
const ALLOWLIST = new Set<string>([
  '/src/components/analytics/ResponseHeatmap.tsx',
  // Adicione novos arquivos aqui APENAS com justificativa em comentário
]);

// Baseline: número MÁXIMO atual de arquivos com cores hardcoded.
// Atualize PARA BAIXO conforme limpa, NUNCA pra cima.
// Para descobrir o atual, rode o teste e veja "Total: X" na saída.
const MAX_VIOLATIONS_ALLOWED = 98;

const ABSOLUTE_COLOR_REGEX =
  /\b(bg|text|border|ring|fill|stroke|from|to|via)-(white|black|(?:red|blue|green|yellow|purple|pink|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))\b/;

const ARBITRARY_COLOR_REGEX = /\b(bg|text|border|ring|fill|stroke)-\[(#|rgb|hsl)/;

function isProductionFile(path: string): boolean {
  return (
    !/\.test\.tsx?$/.test(path) &&
    !path.includes('/__tests__/') &&
    !ALLOWLIST.has(path)
  );
}

describe('Design System Contract: no hardcoded colors', () => {
  it('número de arquivos com cores absolutas não aumenta', () => {
    const violatingFiles = Object.entries(allSourceFiles)
      .filter(([path]) => isProductionFile(path))
      .filter(([, content]) => ABSOLUTE_COLOR_REGEX.test(content) || ARBITRARY_COLOR_REGEX.test(content))
      .map(([path]) => path);

    const total = violatingFiles.length;

    // Mensagem informativa para ajudar a baixar o baseline com o tempo
    if (total < MAX_VIOLATIONS_ALLOWED) {
      // eslint-disable-next-line no-console
      console.info(
        `[no-hardcoded-colors] Total atual: ${total} (baseline: ${MAX_VIOLATIONS_ALLOWED}). Considere baixar o baseline para ${total} em src/__tests__/contracts/no-hardcoded-colors.test.ts.`
      );
    }

    expect(
      total,
      `🎨 Cores hardcoded subiram de ${MAX_VIOLATIONS_ALLOWED} → ${total}.\n` +
        `Use tokens semânticos (bg-background, bg-primary, text-foreground) em vez de bg-white/text-black/bg-red-500.\n` +
        `Veja src/index.css e tailwind.config.ts.\n\n` +
        `Arquivos suspeitos (primeiros 10):\n${violatingFiles.slice(0, 10).join('\n')}`
    ).toBeLessThanOrEqual(MAX_VIOLATIONS_ALLOWED);
  });

  it('exemplo de detecção: rejeita string com bg-red-500', () => {
    expect(ABSOLUTE_COLOR_REGEX.test('className="bg-red-500"')).toBe(true);
    expect(ABSOLUTE_COLOR_REGEX.test('className="bg-primary"')).toBe(false);
    expect(ARBITRARY_COLOR_REGEX.test('className="bg-[#ff0000]"')).toBe(true);
    expect(ARBITRARY_COLOR_REGEX.test('className="bg-[hsl(var(--primary))]"')).toBe(true);
  });
});
