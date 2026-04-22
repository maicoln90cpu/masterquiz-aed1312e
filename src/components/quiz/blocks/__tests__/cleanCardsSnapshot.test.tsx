import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createBlock, normalizeBlock } from '@/types/blocks';

// ============================================================
// 🛡️ Onda 5 — Snapshots dos 5 cartões "limpos" (Onda 4)
// ------------------------------------------------------------
// Garante que ButtonBlock, SliderBlock, NPSBlock, ImageBlock e
// VideoBlock NÃO voltem a duplicar campos que já moram no painel
// de propriedades. Se alguém reintroduzir uma duplicidade (ex:
// adicionar um <Input> de URL no cartão do botão), o snapshot
// quebra e o teste falha — forçando revisão consciente.
//
// Os snapshots são "estruturais" (contagem de inputs + label
// principal) e não DOM completo, para não quebrarem em pequenas
// mudanças de copy ou estilo.
// ============================================================

// jsdom mocks
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,');

// Mock useVideoStorage / useVideoProvider para evitar QueryClient
vi.mock('@/hooks/useVideoStorage', () => ({
  useVideoStorage: () => ({
    allowVideoUpload: false,
    usedMb: 0,
    videoStorageLimitMb: 0,
    usagePercentage: 0,
  }),
}));
vi.mock('@/hooks/useVideoProvider', () => ({
  useVideoProvider: () => ({ isBunny: false }),
}));

import { ButtonBlock } from '../ButtonBlock';
import { SliderBlock } from '../SliderBlock';
import { NPSBlock } from '../NPSBlock';
import { ImageBlock } from '../ImageBlock';
import { VideoBlock } from '../VideoBlock';

const noop = vi.fn();

/**
 * Conta quantos <input> + <textarea> existem no cartão.
 * Se um campo duplicado for reintroduzido, esse número aumenta.
 */
const countInputs = (container: HTMLElement) =>
  container.querySelectorAll('input, textarea').length;

/**
 * Coleta um "fingerprint" estável: lista de placeholders + ids
 * dos inputs, ordenados. Quebra se alguém adicionar um campo novo.
 */
const fingerprint = (container: HTMLElement) => {
  const inputs = Array.from(container.querySelectorAll('input, textarea, select'));
  return inputs
    .map((el) => {
      const placeholder = el.getAttribute('placeholder') || '';
      const type = el.getAttribute('type') || el.tagName.toLowerCase();
      const ariaLabel = el.getAttribute('aria-label') || '';
      return `${type}|${placeholder}|${ariaLabel}`;
    })
    .sort();
};

describe('🛡️ Onda 5 — Snapshots de cartões limpos (anti-regressão)', () => {
  describe('ButtonBlock', () => {
    it('cartão expõe apenas o campo "Texto do Botão" (ação/URL ficam no painel)', () => {
      const block = normalizeBlock(createBlock('button', 0));
      const { container } = render(<ButtonBlock block={block as any} onChange={noop} />);
      // Apenas 1 input (texto do botão). Se virar 2+, é duplicidade.
      expect(countInputs(container)).toBe(1);
      expect(fingerprint(container)).toMatchInlineSnapshot(`
        [
          "text|Clique aqui|",
        ]
      `);
    });
  });

  describe('SliderBlock', () => {
    it('cartão expõe apenas a "Pergunta" (min/max/unit ficam no painel)', () => {
      const block = normalizeBlock(createBlock('slider', 0));
      const { container } = render(<SliderBlock block={block as any} onChange={noop} />);
      // 1 Input de label + 1 input range do preview. Se aparecer mais inputs (min, max, step), é duplicidade.
      const textInputs = container.querySelectorAll('input[type="text"], input:not([type])').length;
      expect(textInputs).toBeLessThanOrEqual(1);
    });
  });

  describe('NPSBlock', () => {
    it('cartão expõe apenas a "Pergunta" (labels/obrigatoriedade ficam no painel)', () => {
      const block = normalizeBlock(createBlock('nps', 0));
      const { container } = render(<NPSBlock block={block as any} onChange={noop} />);
      const textInputs = container.querySelectorAll('input[type="text"], input:not([type])').length;
      expect(textInputs).toBeLessThanOrEqual(1);
    });
  });

  describe('ImageBlock', () => {
    it('cartão sem imagem expõe apenas o uploader (legenda/alt ficam no painel)', () => {
      const block = normalizeBlock(createBlock('image', 0));
      const { container } = render(<ImageBlock block={block as any} onChange={noop} />);
      // Sem URL: só o input file do uploader. Sem inputs de texto/legenda no cartão.
      const textInputs = container.querySelectorAll('input[type="text"], textarea').length;
      expect(textInputs).toBe(0);
    });
  });

  describe('VideoBlock', () => {
    it('cartão expõe apenas o input de URL (size/aspect/playback ficam no painel)', () => {
      const block = normalizeBlock(createBlock('video', 0));
      const { container } = render(<VideoBlock block={block as any} onChange={noop} />);
      // Apenas o input de URL no tab "URL Externa".
      const textInputs = container.querySelectorAll('input[type="text"], input:not([type])').length;
      expect(textInputs).toBeLessThanOrEqual(1);
    });
  });
});