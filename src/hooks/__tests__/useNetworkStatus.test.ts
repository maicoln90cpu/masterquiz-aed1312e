/**
 * 🛡️ Contract test — useNetworkStatus.
 * Garante:
 *  - estado inicial reflete navigator.onLine
 *  - eventos online/offline atualizam o estado
 *  - wentOnlineAt / wentOfflineAt mudam nas transições
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('inicia online quando navigator.onLine = true', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wentOnlineAt).toBeNull();
    expect(result.current.wentOfflineAt).toBeNull();
  });

  it('atualiza para offline ao receber evento offline', () => {
    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wentOfflineAt).toBeGreaterThan(0);
  });

  it('volta para online e marca wentOnlineAt', () => {
    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wentOnlineAt).toBeGreaterThan(0);
  });
});