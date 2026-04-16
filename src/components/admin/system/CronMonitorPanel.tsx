import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchCronJobs, fetchCronLogs } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableTableHeader } from './SortableTableHeader';

interface CronDisplayRow {
  name: string;
  frequency: string;
  enabled: boolean;
  lastExecution: string;
  lastStatus: string;
  successRate: number;
  executions: number;
}

const CronMonitorPanel = () => {
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['system-monitor-cron-jobs'],
    queryFn: fetchCronJobs,
    staleTime: 5 * 60 * 1000,
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['system-monitor-cron-logs'],
    queryFn: () => fetchCronLogs(30),
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    if (!jobs) return [];
    const logsByKey = new Map<string, { total: number; success: number; lastStatus: string; lastExec: string }>();
    for (const log of logs ?? []) {
      const existing = logsByKey.get(log.automation_key);
      if (existing) {
        existing.total++;
        if (log.status === 'success') existing.success++;
      } else {
        logsByKey.set(log.automation_key, {
          total: 1,
          success: log.status === 'success' ? 1 : 0,
          lastStatus: log.status,
          lastExec: log.executed_at ?? '',
        });
      }
    }

    return jobs.map((j): CronDisplayRow => {
      const stats = logsByKey.get(j.automation_key);
      return {
        name: j.display_name,
        frequency: j.frequency ?? '-',
        enabled: j.is_enabled ?? false,
        lastExecution: stats?.lastExec || j.last_executed_at || '-',
        lastStatus: stats?.lastStatus || 'unknown',
        successRate: stats ? Math.round((stats.success / stats.total) * 100) : 0,
        executions: stats?.total ?? 0,
      };
    });
  }, [jobs, logs]);

  const { sortConfig, handleSort, sortedData } = useTableSort<CronDisplayRow>(rows, 'name', 'asc');

  if (loadingJobs || loadingLogs) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableTableHeader<CronDisplayRow> label="Job" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Frequência</TableHead>
            <TableHead>Ativo</TableHead>
            <SortableTableHeader<CronDisplayRow> label="Última Execução" sortKey="lastExecution" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Status</TableHead>
            <SortableTableHeader<CronDisplayRow> label="Taxa de Sucesso" sortKey="successRate" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<CronDisplayRow> label="Execuções" sortKey="executions" currentSort={sortConfig} onSort={handleSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, i) => (
            <TableRow key={row.name}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="text-sm font-medium">{row.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{row.frequency}</TableCell>
              <TableCell>
                <Badge variant={row.enabled ? 'default' : 'secondary'}>{row.enabled ? 'Sim' : 'Não'}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {row.lastExecution !== '-' ? new Date(row.lastExecution).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={row.lastStatus === 'success' ? 'default' : row.lastStatus === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                  {row.lastStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`font-mono text-sm ${row.successRate >= 95 ? 'text-green-600' : row.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {row.executions > 0 ? `${row.successRate}%` : '-'}
                </span>
              </TableCell>
              <TableCell className="text-sm">{row.executions}</TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma automação configurada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CronMonitorPanel;
