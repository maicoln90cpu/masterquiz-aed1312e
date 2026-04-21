import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchHealthHistory } from '@/services/systemMonitorService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QueryFallback } from './QueryFallback';

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

const MODULE_COLORS: Record<string, string> = {
  ui: '#3b82f6',
  security: '#ef4444',
  performance: '#f59e0b',
  database: '#10b981',
  integrations: '#8b5cf6',
  overall: '#6366f1',
};

const TrendsPanel = () => {
  const [days, setDays] = useState(7);

  const { data: raw, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['system-monitor-trends', days],
    queryFn: () => fetchHealthHistory(days),
    staleTime: 15 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!raw || raw.length === 0) return [];

    const daily = new Map<string, Record<string, number[]>>();
    for (const m of raw) {
      const date = (m.created_at ?? '').split('T')[0];
      if (!date) continue;
      if (!daily.has(date)) daily.set(date, {});
      const day = daily.get(date)!;
      if (!day[m.module]) day[m.module] = [];
      day[m.module].push(m.score);
    }

    const weights: Record<string, number> = { ui: 0.15, security: 0.30, performance: 0.20, database: 0.25, integrations: 0.10 };

    return Array.from(daily.entries()).map(([date, scores]) => {
      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const modules = Object.keys(scores);
      const entry: Record<string, string | number> = { date };
      let overall = 0;
      for (const mod of modules) {
        const val = avg(scores[mod]);
        entry[mod] = val;
        overall += val * (weights[mod] || 0.1);
      }
      entry.overall = Math.round(overall);
      return entry;
    }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [raw]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={days === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <QueryFallback
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
        loadingFallback={<Skeleton className="h-64 w-full" />}
        isEmpty={chartData.length === 0}
        emptyMessage="Nenhum dado histórico para o período selecionado."
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {Object.entries(MODULE_COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={key === 'overall' ? 2.5 : 1.5}
                dot={false}
                name={key === 'overall' ? 'Geral' : key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </QueryFallback>
    </div>
  );
};

export default TrendsPanel;
