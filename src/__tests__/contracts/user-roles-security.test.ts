import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Contrato de segurança P1: roles NUNCA podem ser auto-atribuídos.
 *
 * Estes testes validam o contrato de cliente — garantem que o código frontend
 * NÃO contém shortcuts perigosos (ex: client.from('user_roles').insert({...})).
 *
 * Para validação real de RLS server-side, ver migrations e SECURITY.md.
 *
 * Regras invioláveis:
 * 1. Nenhum código de produção em src/ pode fazer INSERT direto em `user_roles`
 *    (somente trigger handle_new_user_role no banco pode inserir).
 * 2. Verificação de admin SEMPRE via has_role() ou hook useUserRole — nunca via
 *    leitura direta de localStorage / cookie / header.
 * 3. has_role() é SECURITY DEFINER (validado por integração com banco).
 */

describe('Security Contract: user_roles', () => {
  describe('Frontend não atribui roles', () => {
    it('nenhum arquivo de produção (não-teste) chama .from("user_roles").insert', async () => {
      // Lê a árvore de src/ buscando padrões perigosos.
      // Falha se algum componente tentar inserir roles diretamente.
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const SRC = path.resolve(process.cwd(), 'src');
      const violations: string[] = [];

      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // ignora pastas de teste
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            await walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            // ignora arquivos *.test.ts
            if (/\.test\.tsx?$/.test(entry.name)) continue;
            const content = await fs.readFile(full, 'utf-8');
            // Padrão perigoso: insert direto em user_roles
            const dangerous = /\.from\(\s*['"]user_roles['"]\s*\)\s*\.insert/;
            if (dangerous.test(content)) {
              violations.push(full.replace(SRC, 'src'));
            }
          }
        }
      }

      await walk(SRC);

      expect(
        violations,
        `🚨 Privilege escalation risk! Estes arquivos fazem INSERT direto em user_roles:\n${violations.join('\n')}\n\nUse trigger handle_new_user_role do banco. Veja SECURITY.md.`
      ).toEqual([]);
    });

    it('nenhum arquivo verifica admin via localStorage', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const SRC = path.resolve(process.cwd(), 'src');
      const violations: string[] = [];

      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            await walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            if (/\.test\.tsx?$/.test(entry.name)) continue;
            const content = await fs.readFile(full, 'utf-8');
            // Padrão perigoso: localStorage com palavra "admin" ou "role"
            const patterns = [
              /localStorage\.[gs]etItem\(\s*['"][^'"]*\b(is_?admin|user_?role|admin_?role)\b/i,
              /sessionStorage\.[gs]etItem\(\s*['"][^'"]*\b(is_?admin|user_?role|admin_?role)\b/i,
            ];
            if (patterns.some(p => p.test(content))) {
              violations.push(full.replace(SRC, 'src'));
            }
          }
        }
      }

      await walk(SRC);

      expect(
        violations,
        `🚨 Verificação client-side de admin é insegura. Use useUserRole() (que chama has_role no banco):\n${violations.join('\n')}`
      ).toEqual([]);
    });
  });

  describe('useUserRole faz query no banco', () => {
    it('useUserRole busca de user_roles via supabase (não de localStorage)', async () => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const file = path.resolve(process.cwd(), 'src/hooks/useUserRole.ts');
      const content = await fs.readFile(file, 'utf-8');

      // Garante que faz query real
      expect(content).toMatch(/\.from\(\s*['"]user_roles['"]\s*\)/);
      expect(content).toMatch(/\.select\(\s*['"]role['"]\s*\)/);
      // Garante que NÃO usa localStorage para roles
      expect(content).not.toMatch(/localStorage/);
    });
  });
});
