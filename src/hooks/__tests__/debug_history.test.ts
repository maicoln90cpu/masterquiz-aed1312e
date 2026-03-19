import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('debug2', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('separate acts with explicit timer flush', () => {
    const { result } = renderHook(() => useHistory(0, { debounceMs: 0 }));

    act(() => { result.current.setState(1); });
    act(() => { vi.advanceTimersByTime(10); });
    console.log('Step 1:', result.current.undoCount, 'state:', result.current.state);

    act(() => { result.current.setState(2); });
    act(() => { vi.advanceTimersByTime(10); });
    console.log('Step 2:', result.current.undoCount, 'state:', result.current.state);
  });
});
