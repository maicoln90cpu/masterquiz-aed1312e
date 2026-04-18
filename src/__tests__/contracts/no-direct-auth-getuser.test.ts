import { describe, it, expect } from 'vitest';

/**
 * Contrato P4: `supabase.auth.getUser()` direto deve ser evitado em componentes.
 *
 * Por quê:
 * - Cada chamada é um round-trip ao Supabase (latência + custo)
 * - Causa race conditions com o ciclo de auth (telas piscam "deslogado")
 * - Quebra impersonação em modo Suporte (admin vê dados próprios em vez do usuário-alvo)
 *
 * Solução:
 * - Componentes: use `useCurrentUser()` (cache compartilhado via AuthContext)
 * - Telas com modo Suporte: use `useEffectiveUser()` (resolve impersonação automaticamente)
 * - Libs/Edge Functions: receba `user` por parâmetro
 *
 * Estratégia: baseline incremental — falha se o número AUMENTAR.
 * Allowlist: AuthContext (a fonte real), libs de baixo nível, edge functions wrappers.
 */

const allSourceFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Allowlist: arquivos onde auth.getUser() direto é a fonte legítima
const ALLOWLIST = new Set<string>([
  '/src/contexts/AuthContext.tsx', // a própria fonte do user
  '/src/hooks/useCurrentUser.ts',  // hook que envelopa o context
  '/src/lib/gtmLogger.ts',         // helper baixo nível, fora de React
]);

// Baseline atual — atualize PARA BAIXO conforme limpa, NUNCA pra cima.
// Para descobrir o atual, rode o teste e veja "Total: X" no console.
const MAX_VIOLATIONS_ALLOWED = 30;

const DIRECT_GETUSER = /supabase\.auth\.getUser\(\s*\)|\bauth\.getUser\(\s*\)/;

function isProductionFile(path: string): boolean {
  return (
    !/\.test\.tsx?$/.test(path) &&
    !path.includes('/__tests__/') &&
    !ALLOWLIST.has(path)
  );
}

describe('Auth Contract: no direct supabase.auth.getUser()', () => {
  it('número de arquivos com auth.getUser direto não aumenta', () => {
    const violatingFiles = Object.entries(allSourceFiles)
      .filter(([path]) => isProductionFile(path))
      .filter(([, content]) => DIRECT_GETUSER.test(content))
      .map(([path]) => path);

    const total = violatingFiles.length;

    if (total < MAX_VIOLATIONS_ALLOWED) {
      // eslint-disable-next-line no-console
      console.info(
        `[no-direct-auth-getuser] Total atual: ${total} (baseline: ${MAX_VIOLATIONS_ALLOWED}). ` +
          `Considere baixar o baseline para ${total} em src/__tests__/contracts/no-direct-auth-getuser.test.ts.`
      );
    }

    expect(
      total,
      `⚠️ Uso direto de supabase.auth.getUser() subiu de ${MAX_VIOLATIONS_ALLOWED} → ${total}.\n\n` +
        `Use useCurrentUser() (componentes), useEffectiveUser() (telas com Suporte),\n` +
        `ou receba user por parâmetro (libs/edge functions).\n\n` +
        `Novos arquivos suspeitos:\n${violatingFiles.slice(0, 10).join('\n')}`
    ).toBeLessThanOrEqual(MAX_VIOLATIONS_ALLOWED);
  });
});
