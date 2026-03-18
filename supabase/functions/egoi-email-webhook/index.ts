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

    // E-goi sends different event types
    // Normalize: could be single object or array
    const events = Array.isArray(body) ? body : [body];
    let processed = 0;

    for (const event of events) {
      const messageId = event.messageId || event.message_id || event.msgId || event.id;
      const eventType = (event.event || event.type || event.action || '').toLowerCase();

      if (!messageId) {
        console.log('No messageId in event, skipping:', JSON.stringify(event));
        continue;
      }

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
            opened_at: new Date().toISOString(), // click implies open
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
            error_message: `${eventType}: ${event.reason || event.description || 'Bounce/Complaint'}`,
          })
          .eq('id', contact.id);
        processed++;

      } else {
        console.log('Unknown event type:', eventType);
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
