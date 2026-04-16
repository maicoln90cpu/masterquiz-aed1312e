import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchPerformanceLogs, type PerformanceRow } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { usePagination } from '@/hooks/usePagination';
import { SortableTableHeader } from './SortableTableHeader';
import { PaginationControls } from './PaginationControls';

interface AggregatedOp {
  operation: string;
  type: string;
  avgMs: number;
  maxMs: number;
  executions: number;
  status: 'fast' | 'acceptable' | 'slow';
}

const getStatus = (avgMs: number): AggregatedOp['status'] => {
  if (avgMs < 200) return 'fast';
  if (avgMs <= 1000) return 'acceptable';
  return 'slow';
};

const statusBadge: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
  fast: { variant: 'default', label: 'Rápido' },
  acceptable: { variant: 'secondary', label: 'Aceitável' },
  slow: { variant: 'destructive', label: 'Lento' },
};

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
];

const PerformancePanel = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-performance', days],
    queryFn: () => fetchPerformanceLogs(days),
    staleTime: 5 * 60 * 1000,
  });

  const aggregated = useMemo(() => {
    const map = new Map<string, { type: string; durations: number[] }>();
    for (const row of data ?? []) {
      const existing = map.get(row.operation_name);
      if (existing) {
        existing.durations.push(row.duration_ms);
      } else {
        map.set(row.operation_name, { type: row.operation_type, durations: [row.duration_ms] });
      }
    }
    return Array.from(map.entries()).map(([operation, v]) => {
      const avgMs = Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length);
      const maxMs = Math.max(...v.durations);
      return {
        operation,
        type: v.type,
        avgMs,
        maxMs,
        executions: v.durations.length,
        status: getStatus(avgMs),
      } as AggregatedOp;
    });
  }, [data]);

  const { sortConfig, handleSort, sortedData } = useTableSort<AggregatedOp>(aggregated, 'avgMs', 'desc');
  const { paginatedData, currentPage, totalPages, totalItems, startIndex, setCurrentPage } = usePagination(sortedData, 10);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map(opt => (
          <Button key={opt.value} variant={days === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setDays(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableTableHeader<AggregatedOp> label="Operação" sortKey="operation" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<AggregatedOp> label="Tipo" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<AggregatedOp> label="Média (ms)" sortKey="avgMs" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<AggregatedOp> label="Máx (ms)" sortKey="maxMs" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<AggregatedOp> label="Execuções" sortKey="executions" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((op, i) => {
            const badge = statusBadge[op.status];
            return (
              <TableRow key={op.operation}>
                <TableCell className="text-muted-foreground">{startIndex + i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{op.operation}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{op.type}</Badge></TableCell>
                <TableCell className="font-mono">{op.avgMs}</TableCell>
                <TableCell className="font-mono">{op.maxMs}</TableCell>
                <TableCell>{op.executions}</TableCell>
                <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
              </TableRow>
            );
          })}
          {paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum dado de performance registrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} pageSize={10} onPageChange={setCurrentPage} />
    </div>
  );
};

export default PerformancePanel;
