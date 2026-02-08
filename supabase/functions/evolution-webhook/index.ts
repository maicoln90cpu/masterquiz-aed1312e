import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();

    console.log('[EVOLUTION-WEBHOOK] Received event:', body.event);
    console.log('[EVOLUTION-WEBHOOK] Instance:', body.instance);

    const event = body.event;
    const instance = body.instance;
    const data = body.data;

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'No event provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CONNECTION UPDATE
    if (event === 'connection.update') {
      const state = data?.state || data?.status;
      const connected = state === 'open' || state === 'connected';

      console.log(`[EVOLUTION-WEBHOOK] Connection update: ${state}, connected: ${connected}`);

      await supabase
        .from('recovery_settings')
        .update({
          is_connected: connected,
          connection_status: connected ? 'connected' : 'disconnected',
          qr_code_base64: connected ? null : undefined,
          last_connection_check: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instance || 'masterquizz');

      return new Response(
        JSON.stringify({ success: true, event: 'connection.update', state }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MESSAGES UPDATE (incoming message)
    if (event === 'messages.upsert') {
      const message = data?.message || data;
      const remoteJid = message?.key?.remoteJid || data?.key?.remoteJid;
      const fromMe = message?.key?.fromMe || data?.key?.fromMe;
      const messageText = message?.message?.conversation ||
                         message?.message?.extendedTextMessage?.text ||
                         data?.message?.conversation ||
                         '';

      // Ignorar mensagens enviadas por nós
      if (fromMe) {
        return new Response(
          JSON.stringify({ success: true, event: 'messages.upsert', ignored: 'from_me' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!remoteJid) {
        return new Response(
          JSON.stringify({ success: true, event: 'messages.upsert', ignored: 'no_jid' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extrair número de telefone do JID
      const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

      console.log(`[EVOLUTION-WEBHOOK] Message from: ${phoneNumber}, text: ${messageText.substring(0, 50)}`);

      // Atualizar recovery_contacts se existir contato pendente
      const { data: contacts } = await supabase
        .from('recovery_contacts')
        .select('id, status')
        .eq('phone_number', phoneNumber)
        .in('status', ['sent', 'delivered', 'read'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];

        await supabase
          .from('recovery_contacts')
          .update({
            status: 'responded',
            response_text: messageText.substring(0, 1000),
            response_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);

        console.log(`[EVOLUTION-WEBHOOK] Contact ${contact.id} marked as responded`);
      }

      return new Response(
        JSON.stringify({ success: true, event: 'messages.upsert', phone: phoneNumber }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MESSAGES UPDATE (delivery status)
    if (event === 'messages.update') {
      const updates = Array.isArray(data) ? data : [data];

      for (const update of updates) {
        const remoteJid = update?.key?.remoteJid;
        const status = update?.update?.status;

        if (!remoteJid || !status) continue;

        const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

        // Map WhatsApp status to our status
        let newStatus: string | null = null;
        if (status === 3 || status === 'DELIVERY_ACK') {
          newStatus = 'delivered';
        } else if (status === 4 || status === 'READ') {
          newStatus = 'read';
        }

        if (newStatus) {
          const updateData: Record<string, any> = {
            status: newStatus,
            updated_at: new Date().toISOString()
          };

          if (newStatus === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
          } else if (newStatus === 'read') {
            updateData.read_at = new Date().toISOString();
          }

          await supabase
            .from('recovery_contacts')
            .update(updateData)
            .eq('phone_number', phoneNumber)
            .in('status', ['sent', 'delivered'])
            .order('created_at', { ascending: false })
            .limit(1);

          console.log(`[EVOLUTION-WEBHOOK] Contact ${phoneNumber} status -> ${newStatus}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, event: 'messages.update' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Evento não tratado
    console.log(`[EVOLUTION-WEBHOOK] Unhandled event: ${event}`);

    return new Response(
      JSON.stringify({ success: true, event, handled: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EVOLUTION-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
