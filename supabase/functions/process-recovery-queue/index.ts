import { createClient } from 'npm:@supabase/supabase-js@2.45.0';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
}

// Background worker — não bloqueia a resposta HTTP
async function processBatch(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  anonKey: string,
  batchSize: number,
  delayMin: number,
  delayMax: number,
  randomizeDelay: boolean,
) {
  for (let i = 0; i < batchSize; i++) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      });
      if (i < batchSize - 1) {
        const d = randomizeDelay ? getRandomDelay(delayMin, delayMax) : delayMin;
        await new Promise(r => setTimeout(r, d * 1000));
      }
    } catch (error) {
      console.error('[process-recovery-queue] send error:', error);
    }
  }

  // Auto-regenerate targets para campanhas em execução
  try {
    const { data: runningCampaigns } = await supabase
      .from('recovery_campaigns')
      .select('id, target_criteria, template_id')
      .eq('status', 'running');

    if (runningCampaigns && runningCampaigns.length > 0) {
      for (const camp of runningCampaigns) {
        const tc = (camp.target_criteria || {}) as Record<string, unknown>;
        if (tc.direct_campaign) continue;

        const { count: pendingForCampaign } = await supabase
          .from('recovery_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', camp.id)
          .eq('status', 'pending');

        if (!pendingForCampaign || pendingForCampaign === 0) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/check-inactive-users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
              body: JSON.stringify({
                campaignId: camp.id,
                templateId: camp.template_id,
                ignoreCooldown: true,
                directCampaign: false,
                targetCriteria: tc,
                isAutoRegeneration: true,
              }),
            });
          } catch (e) {
            console.error(`Failed to auto-regenerate for campaign ${camp.id}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error in auto-regeneration:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const { data: settings } = await supabase.from('recovery_settings').select('*').maybeSingle();
    if (!settings || !settings.is_active || !settings.is_connected) {
      return okResponse({ message: 'Sistema inativo', processed: 0 }, traceId, corsHeaders);
    }

    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentHour = brasilTime.getHours();
    const currentMinute = brasilTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const startRaw = settings.allowed_hours_start?.slice(0, 5) || '09:00';
    const endRaw = settings.allowed_hours_end?.slice(0, 5) || '18:00';
    const [startH, startM] = startRaw.split(':').map(Number);
    const [endH, endM] = endRaw.split(':').map(Number);

    if (currentTimeMinutes < startH * 60 + startM || currentTimeMinutes > endH * 60 + endM) {
      return okResponse({ message: 'Fora do horário', processed: 0 }, traceId, corsHeaders);
    }

    const todayBrasil = new Date(brasilTime); todayBrasil.setHours(0, 0, 0, 0);
    const { count: sentToday } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', todayBrasil.toISOString());
    const dailyLimit = settings.daily_message_limit || 50;
    if ((sentToday || 0) >= dailyLimit) return okResponse({ message: 'Limite diário', processed: 0 }, traceId, corsHeaders);

    const hourAgo = new Date(now.getTime() - 3600000);
    const { count: sentLastHour } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', hourAgo.toISOString());
    const hourlyLimit = settings.hourly_message_limit || 15;
    if ((sentLastHour || 0) >= hourlyLimit) return okResponse({ message: 'Limite hora', processed: 0 }, traceId, corsHeaders);

    const { count: pendingCount } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (!pendingCount) return okResponse({ message: 'Nenhuma pendente', processed: 0 }, traceId, corsHeaders);

    const batchSize = Math.min(settings.batch_size || 10, pendingCount, dailyLimit - (sentToday || 0), hourlyLimit - (sentLastHour || 0));
    const delayMin = settings.message_delay_seconds || 30;
    const delayMax = settings.delay_max_seconds || 120;
    const randomizeDelay = settings.randomize_delay ?? true;

    // @ts-ignore EdgeRuntime exists in Deno Deploy edge runtime
    EdgeRuntime.waitUntil(
      processBatch(supabase, supabaseUrl, anonKey, batchSize, delayMin, delayMax, randomizeDelay)
        .catch(e => console.error('[process-recovery-queue] background error:', e))
    );

    return okResponse({ message: 'Processamento iniciado em background', batchSize, queued: pendingCount }, traceId, corsHeaders);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro', traceId, corsHeaders);
  }
});
