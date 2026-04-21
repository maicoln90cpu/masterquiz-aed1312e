import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Database } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useBackgroundAwareInterval } from '@/hooks/useBackgroundAwareInterval';

interface SnapshotRow {
  id: string;
  captured_at: string;
  total_bytes: number;
  total_rows: number;
  top_tables: Array<{ name: string; bytes: number; size: string; rows: number }>;
}

const DEFAULT_THRESHOLD_MB = 8000;

function bytesToMb(b: number): number {
  return Math.round(b / 1024 / 1024);
}

async function fetchSnapshots(): Promise<SnapshotRow[]> {
  const { data, error } = await supabase
    .from('db_size_snapshots')
    .select('*')
    .order('captured_at', { ascending: true })
    .limit(90);
  if (error) throw error;
  return (data ?? []) as SnapshotRow[];
}

async function fetchThreshold(): Promise<number> {
  const { data } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'db_size_alert_threshold_mb')
    .maybeSingle();
  return Number(data?.setting_value ?? DEFAULT_THRESHOLD_MB);
}

export function DBGrowthPanel() {
  const refetchInterval = useBackgroundAwareInterval(120_000);

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['db-snapshots'],
    queryFn: fetchSnapshots,
    refetchInterval,
    staleTime: 60_000,
  });

  const { data: thresholdMb } = useQuery({
    queryKey: ['db-threshold'],
    queryFn: fetchThreshold,
    staleTime: 5 * 60_000,
  });

  const chartData = useMemo(
    () =>
      (snapshots ?? []).map((s) => ({
        date: new Date(s.captured_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        mb: bytesToMb(s.total_bytes),
        rows: s.total_rows,
      })),
    [snapshots]
  );

  const latest = snapshots?.[snapshots.length - 1];
  const oldest = snapshots?.[0];

  const stats = useMemo(() => {
    if (!latest) return null;
    const totalMb = bytesToMb(latest.total_bytes);
    const limit = thresholdMb ?? DEFAULT_THRESHOLD_MB;
    const pctLimit = (totalMb / limit) * 100;

    let growthPct: number | null = null;
    if (oldest && oldest !== latest && Number(oldest.total_bytes) > 0) {
      growthPct = ((latest.total_bytes - oldest.total_bytes) / oldest.total_bytes) * 100;
    }

    return { totalMb, limit, pctLimit, growthPct };
  }, [latest, oldest, thresholdMb]);

  const topGrowing = useMemo(() => {
    if (!latest) return [];
    // Calcular crescimento por tabela usando snapshot mais antigo dos últimos 30 dias
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const baseline = (snapshots ?? []).find((s) => new Date(s.captured_at).getTime() >= cutoff) ?? oldest;
    if (!baseline || baseline === latest) {
      return latest.top_tables.slice(0, 5).map((t) => ({ name: t.name, current: t.bytes, growth: 0, size: t.size }));
    }
    const baseMap = new Map(baseline.top_tables.map((t) => [t.name, Number(t.bytes)]));
    return latest.top_tables
      .map((t) => {
        const before = baseMap.get(t.name) ?? Number(t.bytes);
        const growth = before > 0 ? ((Number(t.bytes) - before) / before) * 100 : 0;
        return { name: t.name, current: Number(t.bytes), growth, size: t.size };
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);
  }, [snapshots, latest, oldest]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Ainda não há snapshots. O primeiro será criado às 03h UTC.
        </CardContent>
      </Card>
    );
  }

  const showLimitAlert = stats && stats.pctLimit >= 80;
  const showGrowthAlert = stats && stats.growthPct !== null && stats.growthPct >= 20;

  return (
    <div className="space-y-4">
      {(showLimitAlert || showGrowthAlert) && (
        <Alert variant={stats!.pctLimit >= 95 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção ao crescimento do banco</AlertTitle>
          <AlertDescription className="space-y-1 text-xs">
            {showLimitAlert && (
              <p>
                Banco em <strong>{stats!.pctLimit.toFixed(1)}%</strong> do limite ({stats!.totalMb} MB de {stats!.limit} MB).
              </p>
            )}
            {showGrowthAlert && (
              <p>
                Crescimento de <strong>{stats!.growthPct!.toFixed(1)}%</strong> no período observado.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Tamanho atual</p>
              <p className="text-2xl font-bold">{stats?.totalMb.toLocaleString('pt-BR')} MB</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Crescimento (período)</p>
              <p className="text-2xl font-bold">
                {stats?.growthPct === null ? '—' : `${stats?.growthPct?.toFixed(1)}%`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Limite configurado</p>
              <p className="text-2xl font-bold">{stats?.limit.toLocaleString('pt-BR')} MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Evolução do tamanho (MB)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mb"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Tamanho (MB)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top 5 tabelas com maior crescimento</CardTitle>
        </CardHeader>
        <CardContent>
          {topGrowing.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados de comparação ainda.</p>
          ) : (
            <div className="divide-y">
              {topGrowing.map((t) => (
                <div key={t.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{t.size}</span>
                    <Badge
                      variant="outline"
                      className={
                        t.growth >= 20
                          ? 'border-destructive text-destructive'
                          : t.growth >= 5
                          ? 'border-yellow-500/60 text-yellow-700 dark:text-yellow-500'
                          : 'border-muted-foreground/40 text-muted-foreground'
                      }
                    >
                      {t.growth >= 0 ? '+' : ''}
                      {t.growth.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}