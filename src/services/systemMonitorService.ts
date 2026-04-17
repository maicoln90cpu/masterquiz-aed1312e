/**
 * Service Layer — System Monitor
 * Centraliza todas as queries de monitoramento do sistema.
 */
import { supabase } from '@/integrations/supabase/client';

// ── Health Metrics ──────────────────────────────────────────────
export interface HealthMetricRow {
  id: string;
  module: string;
  status: string;
  score: number;
  details: Record<string, unknown>;
  created_at: string;
}

export async function fetchLatestHealthMetrics(): Promise<HealthMetricRow[]> {
  const { data, error } = await supabase
    .from('system_health_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as HealthMetricRow[];
}

export async function fetchHealthHistory(days: number): Promise<HealthMetricRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('system_health_metrics')
    .select('module, score, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HealthMetricRow[];
}

// ── GTM Event Logs (Feature Usage) ─────────────────────────────
export interface GTMEventRow {
  event_name: string;
  count: number;
  last_seen: string;
}

export async function fetchFeatureUsage(days: number): Promise<GTMEventRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('gtm_event_logs')
    .select('event_name, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  // Agrupa por event_name
  const map = new Map<string, { count: number; last_seen: string }>();
  for (const row of data ?? []) {
    const existing = map.get(row.event_name);
    if (existing) {
      existing.count++;
      if (row.created_at > existing.last_seen) existing.last_seen = row.created_at;
    } else {
      map.set(row.event_name, { count: 1, last_seen: row.created_at });
    }
  }
  return Array.from(map.entries())
    .map(([event_name, v]) => ({ event_name, ...v }))
    .sort((a, b) => b.count - a.count);
}

// ── Audit Logs ──────────────────────────────────────────────────
export interface AuditRow {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchAuditLogs(limit = 200): Promise<AuditRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

// ── Client Error Logs ───────────────────────────────────────────
export interface ClientErrorRow {
  id: string;
  component_name: string | null;
  error_message: string;
  stack_trace: string | null;
  url: string | null;
  user_id: string | null;
  created_at: string;
}

export async function fetchClientErrors(days: number): Promise<ClientErrorRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('client_error_logs')
    .select('*')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ClientErrorRow[];
}

// ── Performance Logs ────────────────────────────────────────────
export interface PerformanceRow {
  id: string;
  operation_name: string;
  operation_type: string;
  duration_ms: number;
  is_slow: boolean;
  created_at: string;
}

export async function fetchPerformanceLogs(days: number): Promise<PerformanceRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('performance_logs')
    .select('*')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as PerformanceRow[];
}

// ── Cron Monitor (unified: cron.job + email_automation_config) ──
export interface CronJobRow {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  display_name: string;
  description: string | null;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_duration_ms: number | null;
  total_runs_24h: number;
  total_failures_24h: number;
}

export async function fetchCronJobs(): Promise<CronJobRow[]> {
  const { data, error } = await supabase.rpc('get_all_cron_jobs');
  if (error) throw error;
  return (data ?? []) as CronJobRow[];
}

export interface CronLogRow {
  id: string;
  automation_key: string;
  status: string;
  emails_sent: number | null;
  error_message: string | null;
  executed_at: string | null;
}

export async function fetchCronLogs(days: number): Promise<CronLogRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await supabase
    .from('email_automation_logs')
    .select('*')
    .gte('executed_at', cutoff.toISOString())
    .order('executed_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as CronLogRow[];
}
