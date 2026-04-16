/**
 * ICP Tracking Helper — Etapas 1 + 2
 *
 * Wrappers seguros para incrementar contadores e gravar primeiros valores
 * em profiles, usando RPCs SECURITY DEFINER (atomic + idempotentes).
 *
 * Sempre fire-and-forget: nunca bloqueia UX por telemetria.
 */
import { supabase } from "@/integrations/supabase/client";

type CounterColumn =
  | 'quiz_shared_count'
  | 'paywall_hit_count'
  | 'upgrade_clicked_count'
  | 'editor_sessions_count'
  | 'crm_interactions_count';

type FirstTextColumn = 'plan_limit_hit_type' | 'landing_variant_seen';
type FirstBoolColumn = 'ai_used_on_real_quiz';
type FirstTimestampColumn = 'first_lead_received_at' | 'form_collection_configured_at';

/** Incrementa contador atomicamente. Silent fail. */
export const incrementProfileCounter = (column: CounterColumn): void => {
  supabase
    .rpc('increment_profile_counter', { _column: column })
    .then(({ error }) => {
      if (error) console.warn(`[ICP] increment ${column} failed:`, error.message);
    });
};

/** Grava texto apenas na primeira vez (idempotente). */
export const setProfileFirstText = (column: FirstTextColumn, value: string): void => {
  supabase
    .rpc('set_profile_first_value', { _column: column, _value: value })
    .then(({ error }) => {
      if (error) console.warn(`[ICP] set first ${column} failed:`, error.message);
    });
};

/** Marca boolean como true permanentemente (uma vez true, fica true). */
export const setProfileFlagTrue = (column: FirstBoolColumn): void => {
  supabase
    .rpc('set_profile_first_value', { _column: column, _value: 'true' })
    .then(({ error }) => {
      if (error) console.warn(`[ICP] set flag ${column} failed:`, error.message);
    });
};

/** Marca timestamp NOW() apenas na primeira vez (idempotente). */
export const setProfileFirstTimestamp = (column: FirstTimestampColumn): void => {
  supabase
    .rpc('set_profile_first_value', { _column: column, _value: 'now' })
    .then(({ error }) => {
      if (error) console.warn(`[ICP] set first ts ${column} failed:`, error.message);
    });
};
