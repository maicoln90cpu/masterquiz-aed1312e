import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    console.log('E-goi webhook received:', JSON.stringify(body));

    const events = Array.isArray(body) ? body : [body];
    let processed = 0;

    for (const event of events) {
      // E-goi Slingshot V2 sends nested structure: { data: { messageId, ... }, action: "SENT" }
      // Also support flat structure as fallback
      const nestedData = event.data || {};
      const messageId = nestedData.messageId || nestedData.message_id || nestedData.msgId
        || event.messageId || event.message_id || event.msgId || event.id;
      const eventType = (
        event.action || event.event || event.type || nestedData.action || ''
      ).toLowerCase();

      if (!messageId) {
        console.log('No messageId in event, skipping:', JSON.stringify(event));
        continue;
      }

      console.log(`Processing event: type=${eventType}, messageId=${messageId}`);

      // Find contact by egoi_message_id
      const { data: contact } = await supabase
        .from('email_recovery_contacts')
        .select('id, status')
        .eq('egoi_message_id', String(messageId))
        .maybeSingle();

      if (!contact) {
        console.log('No contact found for messageId:', messageId);
        continue;
      }

      if (eventType.includes('open') || eventType === 'opened') {
        await supabase
          .from('email_recovery_contacts')
          .update({
            opened_at: new Date().toISOString(),
            status: contact.status === 'clicked' ? 'clicked' : 'opened',
          })
          .eq('id', contact.id);
        processed++;

      } else if (eventType.includes('click') || eventType === 'clicked') {
        await supabase
          .from('email_recovery_contacts')
          .update({
            clicked_at: new Date().toISOString(),
            opened_at: new Date().toISOString(),
            status: 'clicked',
          })
          .eq('id', contact.id);
        processed++;

      } else if (
        eventType.includes('bounce') ||
        eventType.includes('complaint') ||
        eventType.includes('spam') ||
        eventType === 'hard_bounce' ||
        eventType === 'soft_bounce'
      ) {
        await supabase
          .from('email_recovery_contacts')
          .update({
            status: 'failed',
            error_message: `${eventType}: ${nestedData.reason || event.reason || event.description || 'Bounce/Complaint'}`,
          })
          .eq('id', contact.id);
        processed++;

      } else if (eventType === 'sent' || eventType === 'delivered') {
        // Mark as sent if still pending
        if (contact.status === 'pending' || contact.status === 'queued') {
          await supabase
            .from('email_recovery_contacts')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', contact.id);
          processed++;
        }
      } else {
        console.log('Unknown event type:', eventType, 'full event:', JSON.stringify(event));
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
