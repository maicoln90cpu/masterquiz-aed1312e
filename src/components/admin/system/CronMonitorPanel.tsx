import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import cronParser from 'cron-parser';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertCircle } from 'lucide-react';
import { fetchCronJobs, fetchCronLogs, type CronJobRow } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableTableHeader } from './SortableTableHeader';

interface CronDisplayRow {
  jobname: string;
  display_name: string;
  description: string | null;
  schedule: string;
  nextRunAt: number; // epoch ms (Infinity if invalid)
  nextRunLabel: string;
  active: boolean;
  lastRunAt: string;
  lastStatus: string;
  lastDurationMs: number | null;
  total24h: number;
  failures24h: number;
}

const formatDistance = (target: Date): string => {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'agora';
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `em ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `em ${hr}h`;
  const d = Math.round(hr / 24);
  return `em ${d}d`;
};

const computeNextRun = (job: CronJobRow): { at: number; label: string } => {
  if (!job.active) return { at: Infinity, label: 'Inativo' };
  try {
    const it = cronParser.parseExpression(job.schedule, { utc: true });
    const next = it.next().toDate();
    return {
      at: next.getTime(),
      label: `${next.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} (${formatDistance(next)})`,
    };
  } catch {
    return { at: Infinity, label: 'Expressão inválida' };
  }
};

const CronMonitorPanel = () => {
  const { data: jobs, isLoading: loadingJobs, error: jobsError } = useQuery({
    queryKey: ['system-monitor-cron-jobs'],
    queryFn: fetchCronJobs,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: logs } = useQuery({
    queryKey: ['system-monitor-cron-logs'],
    queryFn: () => fetchCronLogs(7),
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo<CronDisplayRow[]>(() => {
    if (!jobs) return [];
    return jobs.map((j) => {
      const next = computeNextRun(j);
      return {
        jobname: j.jobname,
        display_name: j.display_name,
        description: j.description,
        schedule: j.schedule,
        nextRunAt: next.at,
        nextRunLabel: next.label,
        active: j.active,
        lastRunAt: j.last_run_at ?? '',
        lastStatus: j.last_run_status ?? 'unknown',
        lastDurationMs: j.last_run_duration_ms,
        total24h: j.total_runs_24h,
        failures24h: j.total_failures_24h,
      };
    });
  }, [jobs, logs]);

  const { sortConfig, handleSort, sortedData } = useTableSort<CronDisplayRow>(rows, 'nextRunAt', 'asc');

  if (loadingJobs) return <Skeleton className="h-48 w-full" />;
  if (jobsError) {
    return (
      <div className="p-4 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> Falha ao carregar jobs: {(jobsError as Error).message}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {sortedData.length} jobs cadastrados • Próxima execução calculada em UTC • Atualiza a cada 60s
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <SortableTableHeader<CronDisplayRow> label="Job" sortKey="display_name" currentSort={sortConfig} onSort={handleSort} />
              <TableHead>Cron</TableHead>
              <SortableTableHeader<CronDisplayRow> label="Próxima Execução" sortKey="nextRunAt" currentSort={sortConfig} onSort={handleSort} />
              <SortableTableHeader<CronDisplayRow> label="Última Execução" sortKey="lastRunAt" currentSort={sortConfig} onSort={handleSort} />
              <TableHead>Status</TableHead>
              <TableHead className="text-right">24h</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, i) => (
              <TableRow key={row.jobname}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <div className="text-sm font-medium">{row.display_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{row.jobname}</div>
                      </div>
                    </TooltipTrigger>
                    {row.description && <TooltipContent className="max-w-xs">{row.description}</TooltipContent>}
                  </Tooltip>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{row.schedule}</TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  <span className={row.active ? 'text-foreground' : 'text-muted-foreground italic'}>{row.nextRunLabel}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {row.lastRunAt
                    ? new Date(row.lastRunAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                  {row.lastDurationMs !== null && (
                    <span className="ml-1 text-[10px]">({row.lastDurationMs}ms)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.lastStatus === 'succeeded' || row.lastStatus === 'success'
                        ? 'default'
                        : row.lastStatus === 'failed' || row.lastStatus === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {row.lastStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs">
                  <span className="font-mono">{row.total24h}</span>
                  {row.failures24h > 0 && (
                    <span className="ml-1 text-destructive font-mono">({row.failures24h} ✗)</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={row.active ? 'default' : 'secondary'}>{row.active ? 'Sim' : 'Não'}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum cron job cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default CronMonitorPanel;
