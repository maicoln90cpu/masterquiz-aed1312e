import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import cronParser from 'cron-parser';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, AlertCircle } from 'lucide-react';
import { fetchCronJobs, fetchCronLogs, type CronJobRow } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';

interface CronDisplayRow {
  jobname: string;
  display_name: string;
  description: string | null;
  schedule: string;
  nextRunAt: number;
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

  if (jobsError) {
    return (
      <div className="p-4 text-sm text-destructive flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> Falha ao carregar jobs: {(jobsError as Error).message}
      </div>
    );
  }

  const columns: DataTableColumn<CronDisplayRow>[] = [
    {
      key: 'display_name',
      label: 'Job',
      sortable: true,
      searchable: true,
      render: (row) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <div className="text-sm font-medium">{row.display_name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{row.jobname}</div>
            </div>
          </TooltipTrigger>
          {row.description && <TooltipContent className="max-w-xs">{row.description}</TooltipContent>}
        </Tooltip>
      ),
    },
    { key: 'schedule', label: 'Cron', searchable: true, className: 'text-xs font-mono text-muted-foreground' },
    {
      key: 'nextRunAt',
      label: 'Próxima Execução',
      sortable: true,
      render: (row) => (
        <span className={row.active ? 'text-foreground text-xs' : 'text-muted-foreground italic text-xs'}>{row.nextRunLabel}</span>
      ),
    },
    {
      key: 'lastRunAt',
      label: 'Última Execução',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.lastRunAt
            ? new Date(row.lastRunAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : '—'}
          {row.lastDurationMs !== null && <span className="ml-1 text-[10px]">({row.lastDurationMs}ms)</span>}
        </span>
      ),
    },
    {
      key: 'lastStatus',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (row) => (
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
      ),
    },
    {
      key: 'total24h',
      label: '24h',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-xs">
          <span className="font-mono">{row.total24h}</span>
          {row.failures24h > 0 && <span className="ml-1 text-destructive font-mono">({row.failures24h} ✗)</span>}
        </span>
      ),
    },
    {
      key: 'active',
      label: 'Ativo',
      sortable: true,
      filterable: true,
      render: (row) => <Badge variant={row.active ? 'default' : 'secondary'}>{row.active ? 'Sim' : 'Não'}</Badge>,
    },
  ];

  return (
    <TooltipProvider>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {rows.length} jobs cadastrados • Próxima execução calculada em UTC • Atualiza a cada 60s
        </div>
        <DataTable<CronDisplayRow>
          data={rows}
          columns={columns}
          defaultSortKey="nextRunAt"
          defaultSortDirection="asc"
          pageSize={25}
          searchPlaceholder="Buscar job ou schedule…"
          exportCsv="cron-jobs"
          isLoading={loadingJobs}
          emptyMessage="Nenhum cron job cadastrado."
          rowKey={(r) => r.jobname}
        />
      </div>
    </TooltipProvider>
  );
};

export default CronMonitorPanel;
