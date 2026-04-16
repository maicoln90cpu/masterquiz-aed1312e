import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchClientErrors, type ClientErrorRow } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { usePagination } from '@/hooks/usePagination';
import { SortableTableHeader } from './SortableTableHeader';
import { PaginationControls } from './PaginationControls';

interface GroupedError {
  component: string;
  count: number;
  lastError: string;
  lastSeen: string;
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
];

const ClientErrorsPanel = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-errors', days],
    queryFn: () => fetchClientErrors(days),
    staleTime: 5 * 60 * 1000,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedError>();
    for (const err of data ?? []) {
      const key = err.component_name || 'Desconhecido';
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (err.created_at > existing.lastSeen) {
          existing.lastSeen = err.created_at;
          existing.lastError = err.error_message;
        }
      } else {
        map.set(key, { component: key, count: 1, lastError: err.error_message, lastSeen: err.created_at });
      }
    }
    return Array.from(map.values());
  }, [data]);

  const { sortConfig, handleSort, sortedData } = useTableSort<GroupedError>(grouped, 'count', 'desc');
  const { paginatedData, currentPage, totalPages, totalItems, startIndex, setCurrentPage } = usePagination(sortedData, 10);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const totalErrors = (data ?? []).length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <Button key={opt.value} variant={days === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setDays(opt.value)}>
              {opt.label}
            </Button>
          ))}
        </div>
        <Badge variant={totalErrors > 50 ? 'destructive' : totalErrors > 10 ? 'secondary' : 'default'}>
          {totalErrors} erros totais
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableTableHeader<GroupedError> label="Componente" sortKey="component" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Última Mensagem</TableHead>
            <SortableTableHeader<GroupedError> label="Contagem" sortKey="count" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<GroupedError> label="Última Ocorrência" sortKey="lastSeen" currentSort={sortConfig} onSort={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((g, i) => (
            <TableRow key={g.component}>
              <TableCell className="text-muted-foreground">{startIndex + i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{g.component}</TableCell>
              <TableCell className="text-xs max-w-[300px] truncate text-muted-foreground">{g.lastError}</TableCell>
              <TableCell>
                <Badge variant={g.count > 20 ? 'destructive' : g.count > 5 ? 'secondary' : 'outline'}>{g.count}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(g.lastSeen).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </TableCell>
            </TableRow>
          ))}
          {paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum erro registrado no período. 🎉</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} startIndex={startIndex} pageSize={10} onPageChange={setCurrentPage} />
    </div>
  );
};

export default ClientErrorsPanel;
