import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '@/hooks/useTableSort';

interface SortableTableHeaderProps<T> {
  label: string;
  sortKey: keyof T;
  currentSort: SortConfig<T>;
  onSort: (key: keyof T) => void;
}

export function SortableTableHeader<T>({ label, sortKey, currentSort, onSort }: SortableTableHeaderProps<T>) {
  const isActive = currentSort.key === sortKey;
  
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );
}
