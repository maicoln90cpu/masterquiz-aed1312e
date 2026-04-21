import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundAwareInterval } from '@/hooks/useBackgroundAwareInterval';

/** Helper para forçar visibilityState do document e disparar evento */
function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useBackgroundAwareInterval', () => {
  beforeEach(() => {
    setVisibility('visible');
  });

  it('retorna intervalMs quando aba está visível', () => {
    const { result } = renderHook(() => useBackgroundAwareInterval(5000));
    expect(result.current).toBe(5000);
  });

  it('retorna false quando aba está oculta', () => {
    setVisibility('hidden');
    const { result } = renderHook(() => useBackgroundAwareInterval(5000));
    expect(result.current).toBe(false);
  });

  it('reage a mudanças de visibilidade em runtime', () => {
    const { result } = renderHook(() => useBackgroundAwareInterval(1000));
    expect(result.current).toBe(1000);

    act(() => setVisibility('hidden'));
    expect(result.current).toBe(false);

    act(() => setVisibility('visible'));
    expect(result.current).toBe(1000);
  });

  it('limpa listener ao desmontar', () => {
    const { unmount } = renderHook(() => useBackgroundAwareInterval(1000));
    unmount();
    // Após unmount, mudar visibilidade não deve quebrar
    expect(() => setVisibility('hidden')).not.toThrow();
  });
});