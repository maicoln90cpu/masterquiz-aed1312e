import { useState, useCallback, useMemo } from 'react';

export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

export function useTableSort<T>(data: T[], defaultKey: keyof T, defaultDirection: 'asc' | 'desc' = 'desc') {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ key: defaultKey, direction: defaultDirection });

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc'
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });
  }, [data, sortConfig]);

  return { sortConfig, handleSort, sortedData };
}
