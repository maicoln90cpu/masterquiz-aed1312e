// ============================================================
// 🧠 Onda 6 — Hash estável (deterministic deep compare)
// ------------------------------------------------------------
// `JSON.stringify` não garante ordem das chaves entre engines/
// versões e inclui qualquer prop "lixo" que aparecer no objeto
// (callbacks via funcs, timestamps internos, etc.).
//
// `stableStringify` ordena chaves recursivamente e ignora:
//   - undefined
//   - functions
//   - Symbols
//
// Resultado: dois payloads logicamente iguais geram a MESMA string
// independentemente da ordem em que foram construídos. Isso
// permite ao AutoSave pular saves desnecessários com segurança.
// ============================================================

/**
 * Serializa um valor de forma determinística (chaves ordenadas).
 * Lida com ciclos via WeakSet (substitui por '[Circular]').
 */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  const walk = (v: unknown): unknown => {
    if (v === null) return null;
    if (v === undefined) return undefined;

    const t = typeof v;
    if (t === 'function' || t === 'symbol') return undefined;
    if (t !== 'object') return v;

    // Date → ISO string (estável)
    if (v instanceof Date) return v.toISOString();

    if (seen.has(v as object)) return '[Circular]';
    seen.add(v as object);

    if (Array.isArray(v)) {
      return v.map(walk);
    }

    // Ordena chaves do objeto
    const obj = v as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const val = walk(obj[key]);
      if (val !== undefined) sorted[key] = val;
    }
    return sorted;
  };

  return JSON.stringify(walk(value));
}

/**
 * Compara dois valores de forma estrutural e determinística.
 * `true` quando logicamente equivalentes.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return stableStringify(a) === stableStringify(b);
}