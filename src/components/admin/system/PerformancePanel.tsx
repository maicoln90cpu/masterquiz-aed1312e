import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchPerformanceLogs } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';
import { Info } from 'lucide-react';

interface AggregatedOp {
  operation: string;
  type: string;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  executions: number;
  slowExecutions: number;
  status: 'fast' | 'acceptable' | 'slow';
}

const getStatus = (p95Ms: number): AggregatedOp['status'] => {
  if (p95Ms < 200) return 'fast';
  if (p95Ms <= 1000) return 'acceptable';
  return 'slow';
};

const getPercentile = (values: number[], percentile: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
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

  const aggregated = useMemo<AggregatedOp[]>(() => {
    const map = new Map<string, { type: string; durations: number[]; slowExecutions: number }>();
    for (const row of data ?? []) {
      const existing = map.get(row.operation_name);
      if (existing) {
        existing.durations.push(row.duration_ms);
        if (row.is_slow) existing.slowExecutions++;
      } else {
        map.set(row.operation_name, { type: row.operation_type, durations: [row.duration_ms], slowExecutions: row.is_slow ? 1 : 0 });
      }
    }
    return Array.from(map.entries()).map(([operation, v]) => {
      const avgMs = Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length);
      const p95Ms = getPercentile(v.durations, 95);
      const maxMs = Math.max(...v.durations);
      return {
        operation,
        type: v.type,
        avgMs,
        p95Ms,
        maxMs,
        executions: v.durations.length,
        slowExecutions: v.slowExecutions,
        status: getStatus(p95Ms),
      };
    }).sort((a, b) => b.p95Ms - a.p95Ms);
  }, [data]);

  const columns: DataTableColumn<AggregatedOp>[] = [
    { key: 'operation', label: 'Operação', sortable: true, searchable: true, className: 'font-mono text-xs' },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      filterable: true,
      render: (op) => <Badge variant="outline" className="text-xs">{op.type}</Badge>,
    },
    { key: 'avgMs', label: 'Média (ms)', sortable: true, align: 'right', className: 'font-mono' },
    { key: 'p95Ms', label: 'P95 (ms)', sortable: true, align: 'right', className: 'font-mono' },
    { key: 'maxMs', label: 'Máx (ms)', sortable: true, align: 'right', className: 'font-mono' },
    { key: 'executions', label: 'Execuções', sortable: true, align: 'right' },
    { key: 'slowExecutions', label: 'Lentas', sortable: true, align: 'right' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (op) => {
        const badge = statusBadge[op.status];
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map(opt => (
          <Button key={opt.value} variant={days === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setDays(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          O status agora usa P95: ele mostra como foram 95% das execuções e ajuda a separar pico isolado de lentidão recorrente. “Máx” continua visível para identificar travadas pontuais.
        </p>
      </div>

      <DataTable<AggregatedOp>
        data={aggregated}
        columns={columns}
        defaultSortKey="p95Ms"
        defaultSortDirection="desc"
        pageSize={15}
        searchPlaceholder="Buscar operação…"
        exportCsv="performance"
        isLoading={isLoading}
        emptyMessage="Nenhum dado de performance registrado."
        rowKey={(r) => r.operation}
      />
    </div>
  );
};

export default PerformancePanel;
