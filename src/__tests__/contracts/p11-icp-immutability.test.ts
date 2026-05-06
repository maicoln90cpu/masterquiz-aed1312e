import { describe, it, expect } from 'vitest';

/**
 * P11 — ICP Immutability Guard (ADR-014)
 *
 * Toda chamada `.update({ ... is_icp_profile ... })` deve, no mesmo bloco
 * encadeado, conter `.is('is_icp_profile', null)` para garantir que o campo
 * só seja escrito quando ainda for NULL (regra de imutabilidade).
 *
 * Whitelist por linha: `// @icp-immutable-allowed: <motivo>` no encadeamento.
 *
 * Defesa em profundidade no banco: trigger `enforce_icp_immutable`.
 */

const allSourceFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function isProductionFile(path: string): boolean {
  return !/\.test\.tsx?$/.test(path) && !path.includes('/__tests__/');
}

// Captura do ".update(" até o próximo ";" (fim do encadeamento).
const UPDATE_CHAIN = /\.update\s*\(([\s\S]*?)\)([\s\S]*?);/g;

describe('P11 — is_icp_profile immutability guard', () => {
  it('todo .update() que toca is_icp_profile usa .is("is_icp_profile", null)', () => {
    const violations: string[] = [];

    for (const [path, content] of Object.entries(allSourceFiles)) {
      if (!isProductionFile(path)) continue;
      if (!content.includes('is_icp_profile')) continue;

      let match: RegExpExecArray | null;
      const re = new RegExp(UPDATE_CHAIN.source, 'g');
      while ((match = re.exec(content)) !== null) {
        const updateArg = match[1];
        const tail = match[2];
        const fullChain = match[0];

        if (!updateArg.includes('is_icp_profile')) continue;
        if (fullChain.includes('@icp-immutable-allowed')) continue;

        const hasGuard = /\.is\s*\(\s*['"]is_icp_profile['"]\s*,\s*null\s*\)/.test(tail);
        if (!hasGuard) {
          violations.push(`${path}\n${fullChain.trim().slice(0, 200)}`);
        }
      }
    }

    expect(
      violations,
      `❌ UPDATE em is_icp_profile sem guard .is('is_icp_profile', null) (ADR-014):\n\n${violations.join('\n\n')}`
    ).toEqual([]);
  });
});
