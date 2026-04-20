// ✅ FASE 8: Hook para callbacks estáveis (evita re-renders)
import { logger } from '@/lib/logger';
import { useCallback, useRef, useEffect } from 'react';

/**
 * Returns a stable callback reference that always calls the latest version
 * of the provided callback. This is useful for event handlers in memoized
 * components where you need the callback to access current state/props
 * without causing re-renders.
 * 
 * @example
 * ```tsx
 * const handleClick = useStableCallback((id: string) => {
 *   // Always has access to latest state
 *   logger.log(items.find(i => i.id === id));
 * });
 * 
 * // handleClick reference never changes
 * <MemoizedChild onClick={handleClick} />
 * ```
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  // Update ref on every render with latest callback
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Return stable callback that delegates to ref
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Similar to useStableCallback but for multiple callbacks.
 * Returns an object with all callbacks stabilized.
 * 
 * @example
 * ```tsx
 * const handlers = useStableCallbacks({
 *   onAdd: () => setItems([...items, newItem]),
 *   onRemove: (id) => setItems(items.filter(i => i.id !== id)),
 * });
 * ```
 */
export function useStableCallbacks<T extends Record<string, (...args: any[]) => any>>(
  callbacks: T
): T {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const stableCallbacks = useRef<T | null>(null);

  if (!stableCallbacks.current) {
    stableCallbacks.current = {} as T;
    for (const key in callbacks) {
      (stableCallbacks.current as any)[key] = (...args: any[]) => 
        callbacksRef.current[key](...args);
    }
  }

  return stableCallbacks.current;
}

/**
 * Hook to track and log unnecessary re-renders in development.
 * Helps identify performance bottlenecks.
 * 
 * @example
 * ```tsx
 * useRenderTracker('MyComponent', { items, selectedId });
 * ```
 */
export function useRenderTracker(
  componentName: string,
  props: Record<string, any>
) {
  const renderCount = useRef(0);
  const prevProps = useRef<Record<string, any>>(props);

  useEffect(() => {
    if (import.meta.env.DEV) {
      renderCount.current += 1;

      const changedProps: string[] = [];
      for (const key in props) {
        if (prevProps.current[key] !== props[key]) {
          changedProps.push(key);
        }
      }

      if (changedProps.length > 0 && renderCount.current > 1) {
        console.debug(
          `[RenderTracker] ${componentName} re-rendered (${renderCount.current}x)`,
          `Changed props: ${changedProps.join(', ')}`
        );
      }

      prevProps.current = props;
    }
  });
}
