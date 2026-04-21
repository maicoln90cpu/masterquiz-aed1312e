/**
 * Service Layer — Top Errors (Onda 4 / Etapa 3)
 * Consome RPC get_top_errors + CRUD em known_errors.
 */
import { supabase } from '@/integrations/supabase/client';

export interface TopErrorRow {
  fingerprint: string;
  component_name: string;
  sample_message: string;
  count_period: number;
  total_count: number;
  first_seen_at: string;
  last_seen_at: string;
  last_url: string | null;
  known_title: string | null;
  known_severity: string | null;
  known_resolution: string | null;
  is_ignored: boolean;
  is_documented: boolean;
}

export interface ErrorOccurrence {
  id: string;
  created_at: string;
  error_message: string;
  url: string | null;
  user_id: string | null;
  stack_trace: string | null;
}

export type KnownErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface KnownErrorInput {
  fingerprint: string;
  title: string;
  description?: string | null;
  resolution?: string | null;
  severity: KnownErrorSeverity;
  is_ignored: boolean;
}

export async function fetchTopErrors(days = 7, limit = 50): Promise<TopErrorRow[]> {
  const { data, error } = await supabase.rpc('get_top_errors', {
    p_days: days,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as TopErrorRow[];
}

export async function fetchErrorOccurrences(fingerprint: string, limit = 10): Promise<ErrorOccurrence[]> {
  const { data, error } = await supabase.rpc('get_error_occurrences', {
    p_fingerprint: fingerprint,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as ErrorOccurrence[];
}

export async function upsertKnownError(input: KnownErrorInput): Promise<void> {
  const { error } = await supabase
    .from('known_errors')
    .upsert(
      {
        fingerprint: input.fingerprint,
        title: input.title,
        description: input.description ?? null,
        resolution: input.resolution ?? null,
        severity: input.severity,
        is_ignored: input.is_ignored,
      },
      { onConflict: 'fingerprint' }
    );
  if (error) throw error;
}

export async function deleteKnownError(fingerprint: string): Promise<void> {
  const { error } = await supabase
    .from('known_errors')
    .delete()
    .eq('fingerprint', fingerprint);
  if (error) throw error;
}