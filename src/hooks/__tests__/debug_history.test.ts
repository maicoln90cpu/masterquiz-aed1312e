import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '@/hooks/useHistory';

describe('debug', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('trace sequential saves', () => {
    const { result } = renderHook(() => useHistory(0, { debounceMs: 0 }));

    act(() => {
      result.current.setState(1);
      vi.advanceTimersByTime(10);
    });
    
    console.log('After first:', JSON.stringify({
      state: result.current.state,
      undoCount: result.current.undoCount,
    }));

    act(() => {
      result.current.setState(2);
      vi.advanceTimersByTime(10);
    });
    
    console.log('After second:', JSON.stringify({
      state: result.current.state,
      undoCount: result.current.undoCount,
    }));
  });
});
