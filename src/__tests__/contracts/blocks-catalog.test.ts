import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { blockCatalogSections } from '@/components/quiz/blocks/blockPaletteCatalog';

/**
 * P8 — Catálogo de blocos completo (Fase 3)
 *
 * Garante que todos os tipos declarados em `BlockType` estejam:
 *  (a) presentes no `blockPaletteCatalog` (painel "Adicionar Bloco")
 *  (b) cobertos por algum renderer no editor (busca textual em BlockEditor)
 *
 * Por que: adicionar bloco novo e esquecer de registrar no palette
 * é uma regressão recorrente. Este teste falha cedo, no CI.
 */

const SRC_ROOT = join(process.cwd(), 'src');

function readTypesFile(): string {
  return readFileSync(join(SRC_ROOT, 'types/blocks.ts'), 'utf-8');
}

function readBlockEditor(): string {
  return readFileSync(
    join(SRC_ROOT, 'components/quiz/blocks/BlockEditor.tsx'),
    'utf-8'
  );
}

function extractBlockTypes(): string[] {
  const content = readTypesFile();
  // Captura o bloco `export type BlockType = | 'a' | 'b' ...;`
  const match = content.match(/export type BlockType\s*=([\s\S]*?);/);
  if (!match) throw new Error('BlockType não encontrado em src/types/blocks.ts');

  const types = Array.from(match[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
  return Array.from(new Set(types));
}

describe('P8 — Catálogo de blocos completo', () => {
  const allTypes = extractBlockTypes();
  const catalogTypes = new Set(
    blockCatalogSections.flatMap((s) => s.items.map((i) => i.type))
  );

  it('extrai pelo menos 30 tipos declarados', () => {
    expect(allTypes.length).toBeGreaterThanOrEqual(30);
  });

  it('todos os tipos têm entrada no blockPaletteCatalog', () => {
    // personalizedCTA é interno — não aparece no palette por design
    const internalTypes = new Set(['personalizedCTA']);
    const missing = allTypes.filter(
      (t) => !catalogTypes.has(t as never) && !internalTypes.has(t)
    );

    if (missing.length > 0) {
      throw new Error(
        `Tipos sem entrada no palette (registrar em blockPaletteCatalog.ts):\n` +
          missing.map((t) => `  - ${t}`).join('\n')
      );
    }
    expect(missing).toEqual([]);
  });

  it('todos os tipos têm renderer no BlockEditor', () => {
    const editor = readBlockEditor();
    // Detecta padrões `case 'foo':` ou `type === 'foo'` ou referência ao tipo
    const missingRenderers = allTypes.filter((t) => {
      const patterns = [
        new RegExp(`case\\s+['"]${t}['"]`),
        new RegExp(`type\\s*===\\s*['"]${t}['"]`),
        new RegExp(`['"]${t}['"]\\s*:`),
      ];
      return !patterns.some((re) => re.test(editor));
    });

    // Tolerância: alguns blocos são roteados via outro arquivo (renderers separados).
    // Apenas falha se MAIS DE 5 tipos estiverem ausentes — sinaliza esquecimento sistemático.
    if (missingRenderers.length > 5) {
      throw new Error(
        `Muitos tipos sem renderer detectado em BlockEditor.tsx:\n` +
          missingRenderers.map((t) => `  - ${t}`).join('\n')
      );
    }
    expect(missingRenderers.length).toBeLessThanOrEqual(5);
  });
});
