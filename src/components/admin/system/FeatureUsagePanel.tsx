import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchFeatureUsage } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';

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
  const chartData = useMemo(
    () => [...features].sort((a, b) => b.count - a.count).slice(0, 10).map(f => ({ name: f.event_name, total: f.count })),
    [features]
  );

  const columns: DataTableColumn<FeatureRow>[] = [
    { key: 'event_name', label: 'Evento', sortable: true, searchable: true, filterable: true, className: 'font-mono text-xs' },
    {
      key: 'count',
      label: 'Total',
      sortable: true,
      align: 'right',
      render: (r) => <Badge variant="secondary">{r.count}</Badge>,
    },
    { key: 'last_seen', label: 'Última Ocorrência', sortable: true, format: 'datetime', className: 'text-sm text-muted-foreground' },
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

      <DataTable<FeatureRow>
        data={features}
        columns={columns}
        defaultSortKey="count"
        defaultSortDirection="desc"
        pageSize={15}
        searchPlaceholder="Buscar evento…"
        exportCsv="feature-usage"
        isLoading={isLoading}
        emptyMessage="Nenhum evento registrado no período."
        rowKey={(r) => r.event_name}
      />
    </div>
  );
};

export default FeatureUsagePanel;
