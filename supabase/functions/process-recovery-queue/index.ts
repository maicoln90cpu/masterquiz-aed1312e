import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const { data: settings } = await supabase.from('recovery_settings').select('*').single();
    if (!settings || !settings.is_active || !settings.is_connected) {
      return new Response(JSON.stringify({ message: 'Sistema inativo', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ message: 'Fora do horário', processed: 0, debug: { brasilTime: brasilTime.toISOString(), currentTimeMinutes, start: startH * 60 + startM, end: endH * 60 + endM } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const todayBrasil = new Date(brasilTime); todayBrasil.setHours(0, 0, 0, 0);
    const { count: sentToday } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', todayBrasil.toISOString());
    const dailyLimit = settings.daily_message_limit || 50;
    if ((sentToday || 0) >= dailyLimit) return new Response(JSON.stringify({ message: 'Limite diário', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const hourAgo = new Date(now.getTime() - 3600000);
    const { count: sentLastHour } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', hourAgo.toISOString());
    const hourlyLimit = settings.hourly_message_limit || 15;
    if ((sentLastHour || 0) >= hourlyLimit) return new Response(JSON.stringify({ message: 'Limite hora', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { count: pendingCount } = await supabase.from('recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (!pendingCount) return new Response(JSON.stringify({ message: 'Nenhuma pendente', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const batchSize = Math.min(settings.batch_size || 10, pendingCount, dailyLimit - (sentToday || 0), hourlyLimit - (sentLastHour || 0));
    const results = [];
    const delayMin = settings.message_delay_seconds || 30;
    const delayMax = settings.delay_max_seconds || 120;
    const randomizeDelay = settings.randomize_delay ?? true;

    for (let i = 0; i < batchSize; i++) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-recovery`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        });
        results.push(await response.json());
        if (i < batchSize - 1) {
          const d = randomizeDelay ? getRandomDelay(delayMin, delayMax) : delayMin;
          await new Promise(r => setTimeout(r, d * 1000));
        }
      } catch (error) { results.push({ error: error instanceof Error ? error.message : 'Erro' }); }
    }

    const successCount = results.filter((r: any) => r.sent === 1).length;

    // Auto-regenerate targets for running non-direct campaigns with no pending contacts
    try {
      const { data: runningCampaigns } = await supabase
        .from('recovery_campaigns')
        .select('id, target_criteria, template_id')
        .eq('status', 'running');

      if (runningCampaigns && runningCampaigns.length > 0) {
        for (const camp of runningCampaigns) {
          const tc = (camp.target_criteria || {}) as Record<string, unknown>;
          if (tc.direct_campaign) continue; // Skip direct campaigns

          const { count: pendingForCampaign } = await supabase
            .from('recovery_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', camp.id)
            .eq('status', 'pending');

          if (!pendingForCampaign || pendingForCampaign === 0) {
            // Auto-regenerate: call check-inactive-users for this campaign
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
              console.log(`Auto-regenerated targets for campaign ${camp.id}`);
            } catch (e) {
              console.error(`Failed to auto-regenerate for campaign ${camp.id}:`, e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error in auto-regeneration:', e);
    }

    return new Response(JSON.stringify({ processed: successCount, batchSize, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
