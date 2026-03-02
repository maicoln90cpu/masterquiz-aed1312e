import { supabase } from "@/integrations/supabase/client";

type GTMEventMetadata = Record<string, unknown>;

/**
 * Central GTM event dispatcher.
 * 1. Pushes to window.dataLayer (for GTM/GA4)
 * 2. Persists to gtm_event_logs table (fire-and-forget for admin dashboard)
 */
export const pushGTMEvent = (
  event: string,
  metadata: GTMEventMetadata = {},
  { persist = true }: { persist?: boolean } = {}
) => {
  // 1. Push to dataLayer
  const w = window as Window & { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...metadata });
  console.log(`🎯 [GTM] Event pushed: ${event}`, metadata);

  // 2. Persist to DB (fire-and-forget)
  if (persist) {
    persistEvent(event, metadata).catch(() => {
      // Silent fail — não bloquear UX por telemetria
    });
  }
};

async function persistEvent(event: string, metadata: GTMEventMetadata) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("gtm_event_logs" as any).insert({
    event_name: event,
    user_id: user?.id || null,
    metadata,
  });
}
