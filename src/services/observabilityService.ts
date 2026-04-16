/**
 * Service Layer — Observabilidade
 * Queries para SLA/SLO, Custos IA, Delivery, Erros, Performance, Web Vitals, Health Check.
 */
import { supabase } from '@/integrations/supabase/client';

// ── Helpers ─────────────────────────────────────────────────────
function cutoffDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── 1. SLA / SLO ───────────────────────────────────────────────
export interface SLAMetrics {
  errorsPerDay: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalOperations: number;
  uptimeEstimate: number; // percentage
}

export async function fetchSLAMetrics(days = 7): Promise<SLAMetrics> {
  const cutoff = cutoffDate(days);

  // Errors per day
  const { count: errorCount } = await supabase
    .from('client_error_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', cutoff);

  // Performance stats
  const { data: perfData } = await supabase
    .from('performance_logs')
    .select('duration_ms')
    .gte('created_at', cutoff)
    .order('duration_ms', { ascending: true });

  const durations = (perfData ?? []).map(r => r.duration_ms);
  const totalOps = durations.length;
  const avgLatency = totalOps > 0 ? durations.reduce((a, b) => a + b, 0) / totalOps : 0;
  const p95Index = Math.floor(totalOps * 0.95);
  const p95Latency = totalOps > 0 ? durations[Math.min(p95Index, totalOps - 1)] : 0;

  const errorsPerDay = days > 0 ? (errorCount ?? 0) / days : 0;
  // Uptime estimate: if <20 errors/day → ~99.9%, scale down
  const uptimeEstimate = Math.max(95, 100 - (errorsPerDay * 0.05));

  return {
    errorsPerDay: Math.round(errorsPerDay * 10) / 10,
    avgLatencyMs: Math.round(avgLatency),
    p95LatencyMs: Math.round(p95Latency),
    totalOperations: totalOps,
    uptimeEstimate: Math.round(uptimeEstimate * 100) / 100,
  };
}

// ── 2. AI Costs ─────────────────────────────────────────────────
export interface AICostSummary {
  totalGenerations: number;
  totalTokens: number;
  estimatedCostUSD: number;
  dailyCosts: { date: string; cost: number; generations: number }[];
}

export async function fetchAICosts(days = 30): Promise<AICostSummary> {
  const cutoff = cutoffDate(days);
  const { data } = await supabase
    .from('ai_quiz_generations')
    .select('total_tokens, estimated_cost_usd, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true });

  const rows = data ?? [];
  let totalTokens = 0;
  let estimatedCostUSD = 0;
  const dailyMap = new Map<string, { cost: number; generations: number }>();

  for (const r of rows) {
    totalTokens += r.total_tokens ?? 0;
    estimatedCostUSD += r.estimated_cost_usd ?? 0;
    const day = (r.created_at ?? '').slice(0, 10);
    const existing = dailyMap.get(day) ?? { cost: 0, generations: 0 };
    existing.cost += r.estimated_cost_usd ?? 0;
    existing.generations += 1;
    dailyMap.set(day, existing);
  }

  return {
    totalGenerations: rows.length,
    totalTokens,
    estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000,
    dailyCosts: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
  };
}

// ── 3. Delivery Status ──────────────────────────────────────────
export interface DeliveryStats {
  whatsapp: { sent: number; delivered: number; failed: number; pending: number };
  email: { sent: number; delivered: number; failed: number; pending: number };
}

export async function fetchDeliveryStats(days = 7): Promise<DeliveryStats> {
  const cutoff = cutoffDate(days);

  // WhatsApp recovery_contacts
  const { data: waData } = await supabase
    .from('recovery_contacts')
    .select('status')
    .gte('created_at', cutoff);

  // Email recovery_contacts
  const { data: emData } = await supabase
    .from('email_recovery_contacts')
    .select('status')
    .gte('created_at', cutoff);

  const count = (rows: { status: string }[] | null, status: string) =>
    (rows ?? []).filter(r => r.status === status).length;

  return {
    whatsapp: {
      sent: count(waData, 'sent'),
      delivered: count(waData, 'delivered'),
      failed: count(waData, 'failed'),
      pending: count(waData, 'pending'),
    },
    email: {
      sent: count(emData, 'sent'),
      delivered: count(emData, 'delivered'),
      failed: count(emData, 'failed'),
      pending: count(emData, 'pending'),
    },
  };
}

// ── 4. Recent Errors (24h) with Spike Detection ─────────────────
export interface RecentErrorGroup {
  component: string;
  message: string;
  count: number;
  lastSeen: string;
}

export interface ErrorsOverview {
  totalLast24h: number;
  groups: RecentErrorGroup[];
  hourlyDistribution: { hour: string; count: number }[];
  hasSpikeAlert: boolean;
}

export async function fetchRecentErrors(spikeThreshold = 10): Promise<ErrorsOverview> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  const { data } = await supabase
    .from('client_error_logs')
    .select('component_name, error_message, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = data ?? [];
  // Group by component+message
  const groupMap = new Map<string, RecentErrorGroup>();
  const hourMap = new Map<string, number>();

  for (const r of rows) {
    const key = `${r.component_name ?? 'Unknown'}::${r.error_message}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.count++;
      if (r.created_at > existing.lastSeen) existing.lastSeen = r.created_at;
    } else {
      groupMap.set(key, {
        component: r.component_name ?? 'Unknown',
        message: r.error_message,
        count: 1,
        lastSeen: r.created_at,
      });
    }
    const hour = r.created_at.slice(0, 13);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }

  const hasSpikeAlert = Array.from(hourMap.values()).some(c => c > spikeThreshold);

  return {
    totalLast24h: rows.length,
    groups: Array.from(groupMap.values()).sort((a, b) => b.count - a.count).slice(0, 20),
    hourlyDistribution: Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    hasSpikeAlert,
  };
}

// ── 5. Performance P95/P99 ──────────────────────────────────────
export interface PerformanceTopOp {
  operation: string;
  type: string;
  avgMs: number;
  maxMs: number;
  count: number;
  p95Ms: number;
}

export async function fetchPerformanceTop(days = 7): Promise<PerformanceTopOp[]> {
  const cutoff = cutoffDate(days);
  const { data } = await supabase
    .from('performance_logs')
    .select('operation_name, operation_type, duration_ms')
    .gte('created_at', cutoff)
    .order('duration_ms', { ascending: false })
    .limit(1000);

  const map = new Map<string, number[]>();
  for (const r of data ?? []) {
    const key = `${r.operation_name}|${r.operation_type}`;
    const arr = map.get(key) ?? [];
    arr.push(r.duration_ms);
    map.set(key, arr);
  }

  return Array.from(map.entries())
    .map(([key, durations]) => {
      const [operation, type] = key.split('|');
      durations.sort((a, b) => a - b);
      const p95i = Math.floor(durations.length * 0.95);
      return {
        operation,
        type,
        avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        maxMs: durations[durations.length - 1],
        count: durations.length,
        p95Ms: durations[Math.min(p95i, durations.length - 1)],
      };
    })
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 15);
}

// ── 6. Web Vitals ───────────────────────────────────────────────
export interface WebVitalEntry {
  name: string;
  value: number;
  rating: string;
  timestamp: string;
}

export async function fetchWebVitals(days = 7): Promise<WebVitalEntry[]> {
  const cutoff = cutoffDate(days);
  const { data } = await supabase
    .from('gtm_event_logs')
    .select('metadata, created_at')
    .eq('event_name', 'web_vitals')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(200);

  return (data ?? []).map(r => {
    const m = r.metadata as Record<string, unknown> | null;
    return {
      name: String(m?.metric_name ?? ''),
      value: Number(m?.metric_value ?? 0),
      rating: String(m?.metric_rating ?? ''),
      timestamp: r.created_at,
    };
  }).filter(e => e.name);
}

// ── 7. Metrics Health Check ─────────────────────────────────────
export interface MetricsChannel {
  channel: string;
  label: string;
  hasRecentData: boolean;
  lastDataAt: string | null;
}

export async function fetchMetricsHealthCheck(): Promise<MetricsChannel[]> {
  const oneDayAgo = cutoffDate(1);
  const channels: MetricsChannel[] = [];

  const checks: { channel: string; label: string; table: string; col: string }[] = [
    { channel: 'errors', label: 'Erros do Frontend', table: 'client_error_logs', col: 'created_at' },
    { channel: 'performance', label: 'Performance Logs', table: 'performance_logs', col: 'created_at' },
    { channel: 'gtm_events', label: 'Eventos GTM', table: 'gtm_event_logs', col: 'created_at' },
    { channel: 'audit', label: 'Audit Logs', table: 'audit_logs', col: 'created_at' },
    { channel: 'health', label: 'Health Metrics', table: 'system_health_metrics', col: 'created_at' },
  ];

  for (const c of checks) {
    const { data } = await supabase
      .from(c.table as any)
      .select(c.col)
      .order(c.col, { ascending: false })
      .limit(1);

    const lastAt = data?.[0]?.[c.col] ?? null;
    channels.push({
      channel: c.channel,
      label: c.label,
      hasRecentData: lastAt ? lastAt >= oneDayAgo : false,
      lastDataAt: lastAt,
    });
  }

  return channels;
}
