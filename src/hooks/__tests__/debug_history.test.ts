import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('debug3', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('combined act pattern', () => {
    const { result } = renderHook(() => useHistory(0, { debounceMs: 0 }));

    act(() => {
      result.current.setState(1);
      vi.advanceTimersByTime(10);
    });
    console.log('A:', result.current.undoCount, result.current.state);

    act(() => {
      result.current.setState(2);
      vi.advanceTimersByTime(10);
    });
    console.log('B:', result.current.undoCount, result.current.state);
    
    // Try with forceSave
    act(() => {
      result.current.setState(3);
    });
    act(() => {
      result.current.forceSave();
    });
    console.log('C:', result.current.undoCount, result.current.state);
  });
});
