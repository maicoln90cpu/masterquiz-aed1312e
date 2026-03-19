import { describe, it, expect } from 'vitest';
import { normalizeBlock, createBlock, type QuizBlock, type BlockType } from '@/types/blocks';

// ============================================================
// FASE 6 — Testes automatizados: normalizeBlock + createBlock
// ============================================================

const ALL_BLOCK_TYPES: BlockType[] = [
  'question', 'text', 'separator', 'image', 'video', 'audio',
  'gallery', 'embed', 'button', 'price', 'metrics', 'loading',
  'progress', 'countdown', 'testimonial', 'slider', 'textInput',
  'nps', 'accordion', 'comparison', 'socialProof', 'animatedCounter',
];

describe('createBlock', () => {
  it.each(ALL_BLOCK_TYPES)('creates valid block for type "%s"', (type) => {
    const block = createBlock(type);
    expect(block).toBeDefined();
    expect(block.type).toBe(type);
    expect(block.id).toBeTruthy();
    expect(typeof block.order).toBe('number');
  });

  it('throws for unknown type', () => {
    expect(() => createBlock('unknown' as BlockType, 0)).toThrow();
  });
});

describe('normalizeBlock', () => {
  it('returns falsy input as-is', () => {
    expect(normalizeBlock(null as any)).toBeNull();
    expect(normalizeBlock(undefined as any)).toBeUndefined();
  });

  it('returns block without type as-is', () => {
    const broken = { id: 'x', order: 0 } as any;
    expect(normalizeBlock(broken)).toBe(broken);
  });

  // ── question ──
  describe('question', () => {
    it('fills missing fields', () => {
      const raw = { id: '1', type: 'question', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.questionText).toBe('');
      expect(n.answerFormat).toBe('single_choice');
      expect(Array.isArray(n.options)).toBe(true);
      expect(Array.isArray(n.scores)).toBe(true);
    });
    it('preserves existing data', () => {
      const raw = { id: '1', type: 'question', order: 0, questionText: 'Q?', options: ['A', 'B', 'C'] } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.questionText).toBe('Q?');
      expect(n.options).toEqual(['A', 'B', 'C']);
    });
  });

  // ── accordion ──
  describe('accordion', () => {
    it('fills empty items array', () => {
      const raw = { id: '1', type: 'accordion', order: 0, items: [] } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.items.length).toBeGreaterThan(0);
      expect(n.items[0]).toHaveProperty('question');
      expect(n.items[0]).toHaveProperty('answer');
    });
    it('fills missing items prop', () => {
      const raw = { id: '1', type: 'accordion', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(Array.isArray(n.items)).toBe(true);
      expect(n.items.length).toBeGreaterThan(0);
    });
    it('preserves existing items', () => {
      const items = [{ question: 'Q', answer: 'A' }];
      const raw = { id: '1', type: 'accordion', order: 0, items } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.items).toEqual(items);
    });
  });

  // ── comparison ──
  describe('comparison', () => {
    it('fills empty arrays', () => {
      const raw = { id: '1', type: 'comparison', order: 0, leftItems: [], rightItems: [] } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.leftItems.length).toBeGreaterThan(0);
      expect(n.rightItems.length).toBeGreaterThan(0);
    });
    it('fills missing props', () => {
      const raw = { id: '1', type: 'comparison', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.leftTitle).toBeTruthy();
      expect(n.rightTitle).toBeTruthy();
      expect(Array.isArray(n.leftItems)).toBe(true);
      expect(Array.isArray(n.rightItems)).toBe(true);
    });
  });

  // ── gallery ──
  describe('gallery', () => {
    it('fills missing images', () => {
      const raw = { id: '1', type: 'gallery', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(Array.isArray(n.images)).toBe(true);
      expect(n.layout).toBe('grid');
    });
  });

  // ── price ──
  describe('price', () => {
    it('fills missing features', () => {
      const raw = { id: '1', type: 'price', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(Array.isArray(n.features)).toBe(true);
      expect(n.features.length).toBeGreaterThan(0);
      expect(n.planName).toBeTruthy();
      expect(n.price).toBeTruthy();
    });
  });

  // ── socialProof ──
  describe('socialProof', () => {
    it('fills missing notifications', () => {
      const raw = { id: '1', type: 'socialProof', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(Array.isArray(n.notifications)).toBe(true);
      expect(n.notifications.length).toBeGreaterThan(0);
      expect(n.notifications[0]).toHaveProperty('name');
      expect(n.interval).toBeGreaterThan(0);
    });
  });

  // ── animatedCounter ──
  describe('animatedCounter', () => {
    it('fills missing values', () => {
      const raw = { id: '1', type: 'animatedCounter', order: 0 } as QuizBlock;
      const n = normalizeBlock(raw) as any;
      expect(n.startValue).toBe(0);
      expect(n.endValue).toBe(1000);
      expect(n.duration).toBe(2);
    });
  });

  // ── simple blocks ──
  it.each([
    ['text', { content: '' }],
    ['separator', { style: 'line' }],
    ['image', { url: '' }],
    ['video', { url: '', provider: 'youtube' }],
    ['audio', { url: '' }],
    ['embed', { url: '' }],
    ['button', { text: 'Clique aqui' }],
    ['loading', { duration: 3, spinnerType: 'spinner' }],
    ['progress', { style: 'bar' }],
    ['countdown', { mode: 'duration', duration: 300 }],
    ['testimonial', { quote: '' }],
    ['slider', { label: '', min: 0, max: 100 }],
    ['textInput', { label: '' }],
    ['nps', { question: '' }],
    ['metrics', { title: 'Métricas' }],
  ] as [BlockType, Record<string, any>][])('normalizes "%s" with correct defaults', (type, expected) => {
    const raw = { id: '1', type, order: 0 } as QuizBlock;
    const n = normalizeBlock(raw) as any;
    for (const [key, val] of Object.entries(expected)) {
      expect(n[key]).toEqual(val);
    }
  });

  // ── Idempotency ──
  it.each(ALL_BLOCK_TYPES)('normalizeBlock is idempotent for "%s"', (type) => {
    const block = createBlock(type);
    const once = normalizeBlock(block);
    const twice = normalizeBlock(once);
    expect(twice).toEqual(once);
  });
});
