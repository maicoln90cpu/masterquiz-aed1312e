import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchPerformanceLogs } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';

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

  const aggregated = useMemo<AggregatedOp[]>(() => {
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
      };
    });
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
    { key: 'maxMs', label: 'Máx (ms)', sortable: true, align: 'right', className: 'font-mono' },
    { key: 'executions', label: 'Execuções', sortable: true, align: 'right' },
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

      <DataTable<AggregatedOp>
        data={aggregated}
        columns={columns}
        defaultSortKey="avgMs"
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
