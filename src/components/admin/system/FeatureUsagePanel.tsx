import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchFeatureUsage } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { usePagination } from '@/hooks/usePagination';
import { SortableTableHeader } from './SortableTableHeader';
import { PaginationControls } from './PaginationControls';

interface FeatureRow {
  event_name: string;
  count: number;
  last_seen: string;
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const FeatureUsagePanel = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-features', days],
    queryFn: () => fetchFeatureUsage(days),
    staleTime: 10 * 60 * 1000,
  });

  const features: FeatureRow[] = useMemo(() => data ?? [], [data]);
  const { sortConfig, handleSort, sortedData } = useTableSort<FeatureRow>(features, 'count', 'desc');
  const { paginatedData, currentPage, totalPages, totalItems, startIndex, setCurrentPage } = usePagination(sortedData, 10);

  const chartData = useMemo(() => (features.slice(0, 10).map(f => ({ name: f.event_name, total: f.count }))), [features]);

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

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableTableHeader<FeatureRow> label="Evento" sortKey="event_name" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<FeatureRow> label="Total" sortKey="count" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<FeatureRow> label="Última Ocorrência" sortKey="last_seen" currentSort={sortConfig} onSort={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((f, i) => (
            <TableRow key={f.event_name}>
              <TableCell className="text-muted-foreground">{startIndex + i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{f.event_name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{f.count}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(f.last_seen).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </TableCell>
            </TableRow>
          ))}
          {paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum evento registrado no período.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        pageSize={10}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FeatureUsagePanel;
