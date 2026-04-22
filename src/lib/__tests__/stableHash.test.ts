import { describe, it, expect } from 'vitest';
import { stableStringify, deepEqual } from '../stableHash';

// ============================================================
// 🧠 Onda 6 — Testes do hash estável usado pelo AutoSave
// ============================================================

describe('stableStringify', () => {
  it('produz a MESMA string para chaves em ordens diferentes', () => {
    const a = { title: 'X', desc: 'Y', count: 1 };
    const b = { count: 1, desc: 'Y', title: 'X' };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('ignora `undefined` (campos opcionais não causam falsos diffs)', () => {
    const a = { title: 'X', desc: undefined };
    const b = { title: 'X' };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('ignora funções e símbolos', () => {
    const a = { title: 'X', cb: () => 1, sym: Symbol('s') } as any;
    const b = { title: 'X' };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('serializa Date como ISO string (estável)', () => {
    const d = new Date('2026-01-01T00:00:00.000Z');
    expect(stableStringify({ at: d })).toBe('{"at":"2026-01-01T00:00:00.000Z"}');
  });

  it('lida com ciclos sem estourar', () => {
    const a: any = { name: 'x' };
    a.self = a;
    expect(() => stableStringify(a)).not.toThrow();
    expect(stableStringify(a)).toContain('[Circular]');
  });

  it('arrays mantêm ordem original (semântica importa)', () => {
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it('detecta diferenças reais em objetos aninhados', () => {
    const a = { quiz: { blocks: [{ id: 1, text: 'a' }] } };
    const b = { quiz: { blocks: [{ id: 1, text: 'b' }] } };
    expect(stableStringify(a)).not.toBe(stableStringify(b));
  });
});

describe('deepEqual', () => {
  it('true para objetos logicamente iguais com chaves desordenadas', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it('false quando valores diferem', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('true para arrays iguais', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('false para arrays em ordens diferentes', () => {
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  it('curto-circuito quando referência é a mesma', () => {
    const obj = { x: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });
});