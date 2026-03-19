import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('useHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useHistory({ count: 0 }));
      expect(result.current.state).toEqual({ count: 0 });
    });

    it('should start with canUndo=false and canRedo=false', () => {
      const { result } = renderHook(() => useHistory('initial'));
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should start with zero undo/redo counts', () => {
      const { result } = renderHook(() => useHistory([]));
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });
  });

  describe('setState', () => {
    it('should update state immediately', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        result.current.setState(1);
      });

      expect(result.current.state).toBe(1);
    });

    it('should accept function updater', () => {
      const { result } = renderHook(() => useHistory(5));

      act(() => {
        result.current.setState(prev => prev + 10);
      });

      expect(result.current.state).toBe(15);
    });

    it('should save to history after debounce', () => {
      const { result } = renderHook(() => useHistory(0, { debounceMs: 300 }));

      act(() => {
        result.current.setState(1);
      });

      // Before debounce, should not have history yet
      expect(result.current.canUndo).toBe(false);

      // After debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoCount).toBe(1);
    });
  });

  describe('Undo functionality', () => {
    it('should undo to previous state', () => {
      const { result } = renderHook(() => useHistory('a', { debounceMs: 0 }));

      act(() => {
        result.current.setState('b');
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe('a');
    });

    it('should do nothing when canUndo is false', () => {
      const { result } = renderHook(() => useHistory('initial'));

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe('initial');
    });

    it('should enable redo after undo', () => {
      const { result } = renderHook(() => useHistory(1, { debounceMs: 0 }));

      act(() => {
        result.current.setState(2);
        vi.advanceTimersByTime(10);
      });

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('should decrease undoCount after undo', () => {
      const { result } = renderHook(() => useHistory(0, { debounceMs: 0 }));

      act(() => { result.current.setState(1); });
      act(() => { vi.advanceTimersByTime(10); });
      act(() => { result.current.setState(2); });
      act(() => { vi.advanceTimersByTime(10); });

      expect(result.current.undoCount).toBe(2);

      act(() => {
        result.current.undo();
      });

      expect(result.current.undoCount).toBe(1);
    });
  });

  describe('Redo functionality', () => {
    it('should redo to next state', () => {
      const { result } = renderHook(() => useHistory('a', { debounceMs: 0 }));

      act(() => {
        result.current.setState('b');
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe('a');

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe('b');
    });

    it('should do nothing when canRedo is false', () => {
      const { result } = renderHook(() => useHistory('initial'));

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe('initial');
    });

    it('should clear future when new state is set', () => {
      const { result } = renderHook(() => useHistory(1, { debounceMs: 0 }));

      act(() => {
        result.current.setState(2);
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Set new state
      act(() => {
        result.current.setState(3);
        vi.advanceTimersByTime(10);
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear past and future', () => {
      const { result } = renderHook(() => useHistory(0, { debounceMs: 0 }));

      act(() => {
        result.current.setState(1);
        vi.advanceTimersByTime(10);
      });
      act(() => {
        result.current.setState(2);
        vi.advanceTimersByTime(10);
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });

    it('should keep current state', () => {
      const { result } = renderHook(() => useHistory('current', { debounceMs: 0 }));

      act(() => {
        result.current.setState('new');
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.state).toBe('new');
    });
  });

  describe('forceSave', () => {
    it('should save pending state immediately', () => {
      const { result } = renderHook(() => useHistory(0, { debounceMs: 1000 }));

      act(() => {
        result.current.setState(1);
      });

      // Without forceSave, should not have history yet
      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.forceSave();
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('maxHistory option', () => {
    it('should limit history size', () => {
      const { result } = renderHook(() => useHistory(0, { maxHistory: 3, debounceMs: 0 }));

      // Add 5 states
      for (let i = 1; i <= 5; i++) {
        act(() => {
          result.current.setState(i);
          vi.advanceTimersByTime(10);
        });
      }

      // Should only have 3 items in history
      expect(result.current.undoCount).toBe(3);
    });
  });

  describe('Complex types', () => {
    it('should work with arrays', () => {
      const { result } = renderHook(() => useHistory<number[]>([], { debounceMs: 0 }));

      act(() => {
        result.current.setState([1]);
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.setState(prev => [...prev, 2]);
        vi.advanceTimersByTime(10);
      });

      expect(result.current.state).toEqual([1, 2]);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual([1]);
    });

    it('should work with objects', () => {
      const { result } = renderHook(() => 
        useHistory({ name: '', age: 0 }, { debounceMs: 0 })
      );

      act(() => {
        result.current.setState({ name: 'John', age: 30 });
        vi.advanceTimersByTime(10);
      });

      act(() => {
        result.current.setState(prev => ({ ...prev, age: 31 }));
        vi.advanceTimersByTime(10);
      });

      expect(result.current.state).toEqual({ name: 'John', age: 31 });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('Debounce behavior', () => {
    it('should group rapid changes', () => {
      const { result } = renderHook(() => useHistory(0, { debounceMs: 300 }));

      // Rapid changes
      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only have 1 history entry
      expect(result.current.undoCount).toBe(1);
      expect(result.current.state).toBe(3);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(0);
    });
  });

  describe('Duplicate state handling', () => {
    it('should not save duplicate states', () => {
      const { result } = renderHook(() => useHistory('same', { debounceMs: 0 }));

      act(() => {
        result.current.setState('same');
        vi.advanceTimersByTime(10);
      });

      expect(result.current.canUndo).toBe(false);
    });
  });
});
