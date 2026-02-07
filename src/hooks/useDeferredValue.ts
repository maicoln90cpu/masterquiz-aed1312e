// ✅ FASE 8: Hook para valores deferidos (reduz lag em inputs)
import { useState, useEffect, useRef, useTransition, useDeferredValue as useReactDeferredValue } from 'react';

/**
 * Custom deferred value hook with configurable delay.
 * Useful for search inputs where you want to delay expensive operations.
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const deferredSearch = useDeferredSearch(search, 300);
 * 
 * // deferredSearch updates 300ms after search stops changing
 * useQuery(['items', deferredSearch], () => fetchItems(deferredSearch));
 * ```
 */
export function useDeferredSearch<T>(value: T, delay: number = 300): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return deferredValue;
}

/**
 * Hook that combines useDeferredValue with useTransition for
 * better UX during expensive updates.
 * 
 * @example
 * ```tsx
 * const [items, setItems] = useState([]);
 * const { deferredValue, isPending } = useDeferredUpdate(items);
 * 
 * // Show loading indicator during transition
 * {isPending && <Spinner />}
 * <ExpensiveList items={deferredValue} />
 * ```
 */
export function useDeferredUpdate<T>(value: T): {
  deferredValue: T;
  isPending: boolean;
} {
  const deferredValue = useReactDeferredValue(value);
  const isPending = value !== deferredValue;

  return { deferredValue, isPending };
}

/**
 * Hook for managing expensive filtering/sorting operations.
 * Defers the computation to keep UI responsive.
 * 
 * @example
 * ```tsx
 * const { result, isFiltering } = useDeferredFilter(
 *   items,
 *   (item) => item.name.includes(searchTerm),
 *   [searchTerm]
 * );
 * ```
 */
export function useDeferredFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: any[] = []
): {
  result: T[];
  isFiltering: boolean;
} {
  const [isPending, startTransition] = useTransition();
  const [filteredItems, setFilteredItems] = useState<T[]>(items);

  useEffect(() => {
    startTransition(() => {
      setFilteredItems(items.filter(filterFn));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);

  return {
    result: filteredItems,
    isFiltering: isPending,
  };
}

/**
 * Hook for virtualizing long lists - only renders visible items.
 * Use when you have 100+ items to render.
 * 
 * @example
 * ```tsx
 * const { visibleItems, containerProps, itemStyle } = useVirtualList(
 *   allItems,
 *   { itemHeight: 50, overscan: 5 }
 * );
 * 
 * <div {...containerProps}>
 *   {visibleItems.map((item, i) => (
 *     <div key={item.id} style={itemStyle(i)}>{item.name}</div>
 *   ))}
 * </div>
 * ```
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight?: number;
    overscan?: number;
  }
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
  itemStyle: (index: number) => React.CSSProperties;
} {
  const { itemHeight, containerHeight = 400, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    onScroll: handleScroll,
  };

  const itemStyle = (index: number): React.CSSProperties => ({
    position: 'absolute',
    top: (startIndex + index) * itemHeight,
    height: itemHeight,
    width: '100%',
  });

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    containerProps,
    itemStyle,
  };
}
