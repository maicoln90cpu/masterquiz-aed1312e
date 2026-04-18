import { describe, it, expect } from 'vitest';

/**
 * Contrato de segurança P1: roles NUNCA podem ser auto-atribuídos.
 *
 * Estes testes validam o contrato de cliente — garantem que o código frontend
 * NÃO contém shortcuts perigosos (ex: insert direto em user_roles ou check
 * de admin via localStorage).
 *
 * Para validação real de RLS server-side, ver migrations e SECURITY.md.
 *
 * Regras invioláveis:
 * 1. Nenhum código de produção em src/ pode fazer INSERT direto em `user_roles`
 *    (somente trigger handle_new_user_role no banco pode inserir).
 * 2. Verificação de admin SEMPRE via has_role() ou hook useUserRole — nunca via
 *    leitura direta de localStorage / cookie / header.
 * 3. useUserRole faz query real em user_roles via supabase.
 */

// Carrega TODOS os arquivos .ts/.tsx de src/ EXCETO os de teste.
// Vite resolve isso em build time — não precisa de Node fs.
const allSourceFiles = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function isProductionFile(path: string): boolean {
  // ignora arquivos de teste e mocks
  return !/\.test\.tsx?$/.test(path) && !path.includes('/__tests__/');
}

describe('Security Contract: user_roles', () => {
  it('nenhum arquivo de produção faz INSERT direto em user_roles', () => {
    const dangerous = /\.from\(\s*['"]user_roles['"]\s*\)\s*\.insert/;
    const violations = Object.entries(allSourceFiles)
      .filter(([path]) => isProductionFile(path))
      .filter(([, content]) => dangerous.test(content))
      .map(([path]) => path);

    expect(
      violations,
      `🚨 Privilege escalation risk! Estes arquivos fazem INSERT direto em user_roles:\n${violations.join('\n')}\n\nUse o trigger handle_new_user_role do banco. Veja SECURITY.md.`
    ).toEqual([]);
  });

  it('nenhum arquivo verifica admin via localStorage/sessionStorage', () => {
    const patterns = [
      /localStorage\.[gs]etItem\(\s*['"][^'"]*\b(is_?admin|user_?role|admin_?role)\b/i,
      /sessionStorage\.[gs]etItem\(\s*['"][^'"]*\b(is_?admin|user_?role|admin_?role)\b/i,
    ];
    const violations = Object.entries(allSourceFiles)
      .filter(([path]) => isProductionFile(path))
      .filter(([, content]) => patterns.some((p) => p.test(content)))
      .map(([path]) => path);

    expect(
      violations,
      `🚨 Verificação client-side de admin é insegura. Use useUserRole() (que chama has_role no banco):\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('useUserRole faz query real em user_roles (não usa localStorage)', () => {
    const file = allSourceFiles['/src/hooks/useUserRole.ts'];
    expect(file, 'src/hooks/useUserRole.ts não encontrado').toBeTruthy();
    expect(file).toMatch(/\.from\(\s*['"]user_roles['"]\s*\)/);
    expect(file).toMatch(/\.select\(\s*['"]role['"]\s*\)/);
    expect(file).not.toMatch(/localStorage/);
  });
});
