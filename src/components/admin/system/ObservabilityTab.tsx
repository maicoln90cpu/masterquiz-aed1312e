import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Globe, Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchSLAMetrics,
  fetchAICosts,
  fetchDeliveryStats,
  fetchRecentErrors,
  fetchPerformanceTop,
  fetchWebVitals,
  fetchMetricsHealthCheck,
  type SLAMetrics,
  type AICostSummary,
  type DeliveryStats,
  type ErrorsOverview,
  type PerformanceTopOp,
  type WebVitalEntry,
  type MetricsChannel,
} from '@/services/observabilityService';

// ── Helpers ─────────────────────────────────────────────────────
const ratingColor = (rating: string) => {
  if (rating === 'good') return 'text-green-500';
  if (rating === 'needs-improvement') return 'text-yellow-500';
  return 'text-red-500';
};

const latencyBadge = (ms: number) => {
  if (ms < 200) return <Badge variant="outline" className="border-green-500 text-green-600">Bom</Badge>;
  if (ms <= 1000) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Atenção</Badge>;
  return <Badge variant="outline" className="border-red-500 text-red-600">Lento</Badge>;
};

const slaProgressColor = (value: number, target: number) => {
  const ratio = value / target;
  if (ratio >= 1) return 'bg-green-500';
  if (ratio >= 0.9) return 'bg-yellow-500';
  return 'bg-red-500';
};

// ── Section Wrapper ─────────────────────────────────────────────
function ObsPanel({ id, title, emoji, defaultOpen = false, badge, children }: {
  id: string; title: string; emoji: string; defaultOpen?: boolean;
  badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span>{emoji}</span> {title} {badge}
        </h3>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── 1. SLA/SLO Panel ────────────────────────────────────────────
function SLAPanel() {
  const [days, setDays] = useState('7');
  const { data, isLoading } = useQuery<SLAMetrics>({
    queryKey: ['obs-sla', days],
    queryFn: () => fetchSLAMetrics(Number(days)),
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;

  const targets = [
    { label: 'Uptime Estimado', value: data.uptimeEstimate, target: 99.5, unit: '%', icon: <Globe className="h-4 w-4" /> },
    { label: 'Latência P95', value: Math.min(data.p95LatencyMs, 3000), target: 3000, unit: 'ms', icon: <Clock className="h-4 w-4" />, invert: true, raw: data.p95LatencyMs },
    { label: 'Erros/Dia', value: Math.min(data.errorsPerDay, 20), target: 20, unit: '', icon: <AlertTriangle className="h-4 w-4" />, invert: true, raw: data.errorsPerDay },
  ];

  return (
    <>
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targets.map(t => {
          const pct = t.invert ? ((t.target - (t.raw ?? t.value)) / t.target) * 100 : (t.value / t.target) * 100;
          const displayVal = t.raw ?? t.value;
          const isGood = t.invert ? displayVal <= t.target : displayVal >= t.target;
          return (
            <Card key={t.label}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {t.icon}
                  {t.label}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{displayVal}{t.unit}</span>
                  <span className="text-xs text-muted-foreground">Meta: {t.invert ? '≤' : '≥'} {t.target}{t.unit}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full transition-all', isGood ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Baseado em {data.totalOperations} operações nos últimos {days} dias</p>
    </>
  );
}

// ── 2. AI Costs Panel ───────────────────────────────────────────
function AICostsPanel() {
  const [days, setDays] = useState('30');
  const { data, isLoading } = useQuery<AICostSummary>({
    queryKey: ['obs-ai-costs', days],
    queryFn: () => fetchAICosts(Number(days)),
    staleTime: 120_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;

  return (
    <>
      <div className="flex justify-end">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Gerações</p>
            <p className="text-3xl font-bold">{data.totalGenerations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Tokens Totais</p>
            <p className="text-3xl font-bold">{data.totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Custo Estimado</p>
            <p className="text-3xl font-bold text-primary">${data.estimatedCostUSD.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>
      {data.dailyCosts.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Gerações</TableHead>
                <TableHead className="text-right">Custo (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.dailyCosts.slice(-10).map(d => (
                <TableRow key={d.date}>
                  <TableCell>{d.date}</TableCell>
                  <TableCell className="text-right">{d.generations}</TableCell>
                  <TableCell className="text-right">${d.cost.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

// ── 3. Delivery Status Panel ────────────────────────────────────
function DeliveryPanel() {
  const { data, isLoading } = useQuery<DeliveryStats>({
    queryKey: ['obs-delivery'],
    queryFn: () => fetchDeliveryStats(7),
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;

  const channels = [
    { label: 'WhatsApp', icon: '💬', ...data.whatsapp },
    { label: 'Email', icon: '📧', ...data.email },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {channels.map(ch => {
        const total = ch.sent + ch.delivered + ch.failed + ch.pending;
        const deliveryRate = total > 0 ? ((ch.delivered + ch.sent) / total * 100).toFixed(1) : '0';
        return (
          <Card key={ch.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">{ch.icon} {ch.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div><p className="font-bold text-lg">{ch.sent}</p><p className="text-muted-foreground">Enviadas</p></div>
                <div><p className="font-bold text-lg text-green-600">{ch.delivered}</p><p className="text-muted-foreground">Entregues</p></div>
                <div><p className="font-bold text-lg text-red-600">{ch.failed}</p><p className="text-muted-foreground">Falhas</p></div>
                <div><p className="font-bold text-lg text-yellow-600">{ch.pending}</p><p className="text-muted-foreground">Pendentes</p></div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Taxa de entrega:</span>
                <Badge variant="outline">{deliveryRate}%</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── 4. Recent Errors 24h ────────────────────────────────────────
function RecentErrorsPanel() {
  const { data, isLoading } = useQuery<ErrorsOverview>({
    queryKey: ['obs-recent-errors'],
    queryFn: () => fetchRecentErrors(10),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;

  return (
    <>
      <div className="flex items-center gap-4">
        <Badge variant={data.totalLast24h === 0 ? 'outline' : 'destructive'}>
          {data.totalLast24h} erros nas últimas 24h
        </Badge>
        {data.hasSpikeAlert && (
          <Badge variant="destructive" className="animate-pulse">
            {'⚠️ Pico detectado (>10 erros/hora)'}
          </Badge>
        )}
      </div>
      {data.groups.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Última</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.groups.slice(0, 10).map((g, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{g.component}</TableCell>
                  <TableCell className="text-xs max-w-[300px] truncate">{g.message}</TableCell>
                  <TableCell className="text-right font-bold">{g.count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(g.lastSeen).toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

// ── 5. Performance P95/P99 ──────────────────────────────────────
function PerformanceP95Panel() {
  const { data, isLoading } = useQuery<PerformanceTopOp[]>({
    queryKey: ['obs-perf-top'],
    queryFn: () => fetchPerformanceTop(7),
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data || data.length === 0) return <p className="text-muted-foreground text-sm">Sem dados de performance</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Operação</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Média (ms)</TableHead>
            <TableHead className="text-right">P95 (ms)</TableHead>
            <TableHead className="text-right">Máx (ms)</TableHead>
            <TableHead className="text-right">Execuções</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((op, i) => (
            <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{op.operation}</TableCell>
              <TableCell><Badge variant="outline">{op.type}</Badge></TableCell>
              <TableCell className="text-right">{op.avgMs}</TableCell>
              <TableCell className="text-right font-bold">{op.p95Ms}</TableCell>
              <TableCell className="text-right">{op.maxMs}</TableCell>
              <TableCell className="text-right">{op.count}</TableCell>
              <TableCell>{latencyBadge(op.p95Ms)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── 6. Web Vitals Panel ─────────────────────────────────────────
function WebVitalsPanel() {
  const { data, isLoading } = useQuery<WebVitalEntry[]>({
    queryKey: ['obs-web-vitals'],
    queryFn: () => fetchWebVitals(7),
    staleTime: 120_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">Nenhum dado de Web Vitals coletado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Os dados são coletados automaticamente quando usuários acessam o site em produção.</p>
      </div>
    );
  }

  // Aggregate latest per metric
  const latestByMetric = new Map<string, WebVitalEntry>();
  for (const e of data) {
    if (!latestByMetric.has(e.name)) latestByMetric.set(e.name, e);
  }

  const vitals = [
    { name: 'LCP', unit: 'ms', goodLabel: '< 2.5s', good: 2500 },
    { name: 'FID', unit: 'ms', goodLabel: '< 100ms', good: 100 },
    { name: 'CLS', unit: '', goodLabel: '< 0.1', good: 0.1 },
    { name: 'FCP', unit: 'ms', goodLabel: '< 1.8s', good: 1800 },
    { name: 'TTFB', unit: 'ms', goodLabel: '< 800ms', good: 800 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {vitals.map(v => {
        const entry = latestByMetric.get(v.name);
        if (!entry) return null;
        return (
          <Card key={v.name}>
            <CardContent className="pt-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{v.name}</p>
              <p className={cn('text-2xl font-bold', ratingColor(entry.rating))}>
                {v.unit === 'ms' ? Math.round(entry.value) : entry.value.toFixed(3)}
                <span className="text-xs ml-1">{v.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground">Meta: {v.goodLabel}</p>
              <Badge variant="outline" className={cn('text-xs', ratingColor(entry.rating))}>
                {entry.rating === 'good' ? '✅ Bom' : entry.rating === 'needs-improvement' ? '⚠️ Adequado' : '❌ Ruim'}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── 7. Metrics Health Check ─────────────────────────────────────
function MetricsHealthPanel() {
  const { data, isLoading } = useQuery<MetricsChannel[]>({
    queryKey: ['obs-metrics-health'],
    queryFn: fetchMetricsHealthCheck,
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!data) return <p className="text-muted-foreground text-sm">Sem dados</p>;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-3 w-3" />
          <span>
            <strong className="text-foreground">Verde</strong> = dados recentes (&lt;24h). 
            <strong className="text-foreground"> Amarelo</strong> = sem registros recentes (normal se ninguém usou). 
            <strong className="text-foreground"> Vermelho</strong> = falha real de coleta.
          </span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.map(ch => {
            const status: 'ok' | 'idle' | 'error' = ch.hasRecentData
              ? 'ok'
              : ch.lastDataAt
              ? 'idle'   // já houve dado, mas não nas últimas 24h → informativo
              : 'idle';  // nunca teve dado → também informativo (não é erro)
            const tooltipText =
              status === 'ok'
                ? 'Coleta saudável: dados recebidos nas últimas 24h.'
                : ch.lastDataAt
                ? 'Sem registros nas últimas 24h. Normal se não houve uso recente do canal.'
                : 'Nenhum registro coletado ainda. Normal se este canal nunca foi acionado.';
            return (
              <Card key={ch.channel}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="shrink-0 cursor-help">
                        {status === 'ok' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Info className="h-5 w-5 text-yellow-500" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div>
                    <p className="text-sm font-medium">{ch.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {ch.lastDataAt
                        ? `Último: ${new Date(ch.lastDataAt).toLocaleString('pt-BR')}`
                        : 'Sem registros recentes'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ── Main Component ──────────────────────────────────────────────
export const ObservabilityTab = () => {
  return (
    <div className="space-y-3">
      <ObsPanel id="sla" title="SLA / SLO" emoji="🎯" defaultOpen>
        <SLAPanel />
      </ObsPanel>
      <ObsPanel id="ai-costs" title="Custos de IA" emoji="🤖">
        <AICostsPanel />
      </ObsPanel>
      <ObsPanel id="delivery" title="Status de Entregas" emoji="📨">
        <DeliveryPanel />
      </ObsPanel>
      <ObsPanel id="errors-24h" title="Erros Recentes (24h)" emoji="🐛">
        <RecentErrorsPanel />
      </ObsPanel>
      <ObsPanel id="perf-top" title="Performance P95/P99" emoji="⚡">
        <PerformanceP95Panel />
      </ObsPanel>
      <ObsPanel id="web-vitals" title="Web Vitals" emoji="🌐">
        <WebVitalsPanel />
      </ObsPanel>
      <ObsPanel id="metrics-health" title="Verificação de Coleta" emoji="🔍">
        <MetricsHealthPanel />
      </ObsPanel>
    </div>
  );
};

export default ObservabilityTab;
