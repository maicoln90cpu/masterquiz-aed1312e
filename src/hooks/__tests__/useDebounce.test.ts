import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial value', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('test', 500));
      expect(result.current).toBe('test');
    });

    it('should work with different types', () => {
      const { result: stringResult } = renderHook(() => useDebounce('string', 500));
      const { result: numberResult } = renderHook(() => useDebounce(42, 500));
      const { result: objectResult } = renderHook(() => useDebounce({ key: 'value' }, 500));
      const { result: arrayResult } = renderHook(() => useDebounce([1, 2, 3], 500));

      expect(stringResult.current).toBe('string');
      expect(numberResult.current).toBe(42);
      expect(objectResult.current).toEqual({ key: 'value' });
      expect(arrayResult.current).toEqual([1, 2, 3]);
    });
  });

  describe('Debounce behavior', () => {
    it('should not update value before delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Before delay, should still be initial
      expect(result.current).toBe('initial');
    });

    it('should update value after delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      // Make multiple rapid changes
      rerender({ value: 'change1' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: 'change2' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: 'change3' });

      // Still should be initial (no timer completed)
      expect(result.current).toBe('initial');

      // Complete the timer
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should have the last value
      expect(result.current).toBe('change3');
    });
  });

  describe('Custom delay', () => {
    it('should respect custom delay value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 1000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // At 500ms, should still be initial
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      // At 1000ms, should be updated
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });

    it('should use default delay of 500ms', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // At 499ms, should still be initial
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe('initial');

      // At 500ms, should be updated
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: null as string | null } }
      );

      expect(result.current).toBeNull();

      rerender({ value: 'not null' });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('not null');
    });

    it('should handle undefined values', () => {
      const { result } = renderHook(() => useDebounce(undefined, 500));
      expect(result.current).toBeUndefined();
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });
  });
});
