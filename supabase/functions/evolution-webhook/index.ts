import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { claimEvent, markEventProcessed } from '../_shared/idempotency.ts';
import { errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
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
      return errorResponse('VALIDATION_FAILED', 'No event provided', traceId, corsHeaders);
    }

    // 🛡️ P19 — Idempotência: identifica evento único do Evolution
    const messageKeyId =
      data?.key?.id ||
      data?.message?.key?.id ||
      (Array.isArray(data) ? data[0]?.key?.id : undefined);
    const eventId = messageKeyId
      ? `${event}:${messageKeyId}`
      : event === 'connection.update'
        ? `${event}:${instance}:${data?.state || data?.status || 'unknown'}:${Date.now() - (Date.now() % 60000)}`
        : null;

    let claim: { id: string; alreadyProcessed: boolean; previousResult: unknown } | null = null;
    if (eventId) {
      try {
        claim = await claimEvent(supabase, {
          provider: 'evolution',
          eventId,
          traceId,
        });
        if (claim.alreadyProcessed) {
          console.log(`[EVOLUTION-WEBHOOK] Duplicate event ${eventId} ignored`);
          return new Response(
            JSON.stringify({ success: true, duplicate: true, event }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-trace-id': traceId } }
          );
        }
      } catch (idempErr) {
        console.warn('[EVOLUTION-WEBHOOK] Idempotency check failed (non-fatal):', idempErr);
      }
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

      // Mensagens enviadas por nós (fromMe) — salvar como 'human' para detecção de intervenção
      if (fromMe) {
        if (messageText && messageText.trim().length > 0) {
          // Extrair número do destinatário
          const recipientPhone = remoteJid ? remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '') : '';
          
          // Verificar se NÃO foi enviada pelo bot (comparar com últimas msgs de assistant)
          const { data: lastAssistant } = await supabase
            .from('whatsapp_conversations')
            .select('content')
            .eq('phone_number', recipientPhone)
            .eq('role', 'assistant')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Se a mensagem NÃO é igual à última resposta do bot, é intervenção humana
          const isHumanIntervention = !lastAssistant || lastAssistant.content !== messageText;

          if (isHumanIntervention && recipientPhone) {
            await supabase.from('whatsapp_conversations').insert({
              phone_number: recipientPhone,
              role: 'human',
              content: messageText,
            });
            console.log(`[EVOLUTION-WEBHOOK] Human intervention recorded for ${recipientPhone}`);
          }
        }

        return new Response(
          JSON.stringify({ success: true, event: 'messages.upsert', handled: 'from_me_recorded' }),
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

      // ========== FORWARD MESSAGE TO ADMIN (fire-and-forget) ==========
      try {
        const { data: fwdSettings } = await supabase
          .from('recovery_settings')
          .select('forward_to_phone, instance_name')
          .limit(1)
          .maybeSingle();

        if (fwdSettings?.forward_to_phone) {
          const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
          const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
          const instanceName = fwdSettings.instance_name || 'masterquizz';
          const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

          const forwardText = `📩 *Nova msg no MasterQuiz*\nDe: ${phoneNumber}\nHora: ${now}\n\n${messageText.substring(0, 500)}`;

          if (evolutionApiUrl && evolutionApiKey) {
            await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
              body: JSON.stringify({ number: fwdSettings.forward_to_phone, text: forwardText }),
            });
            console.log(`[EVOLUTION-WEBHOOK] Message forwarded to ${fwdSettings.forward_to_phone}`);
          }
        }
      } catch (fwdErr) {
        console.warn('[EVOLUTION-WEBHOOK] Forward failed (non-blocking):', fwdErr);
      }
      // ========== CHECK "SAIR" OPT-OUT ==========
      if (messageText.trim().toUpperCase().includes('SAIR')) {
        console.log(`[EVOLUTION-WEBHOOK] SAIR opt-out from ${phoneNumber}`);

        const { data: contactData } = await supabase
          .from('recovery_contacts')
          .select('user_id')
          .eq('phone_number', phoneNumber)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        await supabase
          .from('recovery_blacklist')
          .upsert({
            phone_number: phoneNumber,
            user_id: contactData?.user_id || null,
            reason: 'opt_out',
            notes: 'Auto opt-out via SAIR',
          }, { onConflict: 'phone_number', ignoreDuplicates: true });

        await supabase
          .from('recovery_contacts')
          .update({
            status: 'failed' as any,
            error_message: 'Usuário optou por sair (SAIR)',
            updated_at: new Date().toISOString(),
          })
          .eq('phone_number', phoneNumber)
          .in('status', ['sent', 'delivered', 'read', 'queued', 'pending'] as any[]);

        try {
          const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
          const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
          const { data: recoverySettings } = await supabase
            .from('recovery_settings')
            .select('instance_name')
            .limit(1)
            .maybeSingle();
          const instanceName = recoverySettings?.instance_name || 'masterquizz';

          if (evolutionUrl && evolutionKey) {
            await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
              },
              body: JSON.stringify({
                number: phoneNumber,
                text: '✅ Você foi removido da nossa lista de mensagens. Não enviaremos mais mensagens automáticas para este número.',
              }),
            });
            console.log(`[EVOLUTION-WEBHOOK] Opt-out confirmation sent to ${phoneNumber}`);
          }
        } catch (confirmError) {
          console.error('[EVOLUTION-WEBHOOK] Failed to send opt-out confirmation:', confirmError);
        }

        return new Response(
          JSON.stringify({ success: true, event: 'messages.upsert', action: 'opt_out', phone: phoneNumber }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ========== CHECK BLACKLIST ==========
      const { data: blacklisted } = await supabase
        .from('recovery_blacklist')
        .select('id')
        .eq('phone_number', phoneNumber)
        .limit(1);

      if (blacklisted && blacklisted.length > 0) {
        console.log(`[EVOLUTION-WEBHOOK] Phone ${phoneNumber} is blacklisted, ignoring`);
        return new Response(
          JSON.stringify({ success: true, event: 'messages.upsert', ignored: 'blacklisted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ========== FIND ANY valid contact for this phone (not just the latest) ==========
      const { data: contacts } = await supabase
        .from('recovery_contacts')
        .select('id, status, user_id, campaign_id')
        .eq('phone_number', phoneNumber)
        .in('status', ['sent', 'delivered', 'read', 'responded'])
        .order('created_at', { ascending: false })
        .limit(1);

      let userId: string | null = null;
      let contactId: string | null = null;

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        contactId = contact.id;
        userId = contact.user_id;

        // Update to 'responded'
        const updateData: Record<string, any> = {
          response_text: messageText.substring(0, 1000),
          response_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (contact.status !== 'responded') {
          updateData.status = 'responded';
        }

        await supabase
          .from('recovery_contacts')
          .update(updateData)
          .eq('id', contact.id);

        console.log(`[EVOLUTION-WEBHOOK] Contact ${contact.id} marked as responded`);

        // Update campaign responded_count
        if (contact.campaign_id) {
          const { data: camp } = await supabase
            .from('recovery_campaigns')
            .select('responded_count')
            .eq('id', contact.campaign_id)
            .single();
          if (camp) {
            await supabase.from('recovery_campaigns').update({
              responded_count: (camp.responded_count || 0) + 1,
              updated_at: new Date().toISOString()
            }).eq('id', contact.campaign_id);
          }
        }
      } else {
        // No recovery contact found — try to find user_id from profiles by phone
        const { data: profileByPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('whatsapp', phoneNumber)
          .limit(1)
          .maybeSingle();
        userId = profileByPhone?.id || null;
      }

      // ========== ALWAYS trigger AI reply for incoming messages ==========
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        console.log(`[EVOLUTION-WEBHOOK] Triggering AI reply for ${phoneNumber}, userId: ${userId}`);

        await fetch(`${supabaseUrl}/functions/v1/whatsapp-ai-reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            phone_number: phoneNumber,
            message_text: messageText,
            user_id: userId,
            contact_id: contactId,
          }),
        });

        console.log(`[EVOLUTION-WEBHOOK] AI reply triggered for ${phoneNumber}`);
      } catch (aiError) {
        console.error('[EVOLUTION-WEBHOOK] Failed to trigger AI reply:', aiError);
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

        let newStatus: string | null = null;
        if (status === 3 || status === 'DELIVERY_ACK') {
          newStatus = 'delivered';
        } else if (status === 4 || status === 'READ') {
          newStatus = 'read';
        }

        if (newStatus) {
          // Find the specific contact to update
          const { data: contactsToUpdate } = await supabase
            .from('recovery_contacts')
            .select('id, campaign_id')
            .eq('phone_number', phoneNumber)
            .in('status', ['sent', 'delivered'])
            .order('created_at', { ascending: false })
            .limit(1);

          if (contactsToUpdate && contactsToUpdate.length > 0) {
            const c = contactsToUpdate[0];
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
              .eq('id', c.id);

            // Update campaign counters
            if (c.campaign_id && newStatus === 'delivered') {
              const { data: camp } = await supabase
                .from('recovery_campaigns')
                .select('delivered_count')
                .eq('id', c.campaign_id)
                .single();
              if (camp) {
                await supabase.from('recovery_campaigns').update({
                  delivered_count: (camp.delivered_count || 0) + 1,
                  updated_at: new Date().toISOString()
                }).eq('id', c.campaign_id);
              }
            }
            if (c.campaign_id && newStatus === 'read') {
              const { data: camp } = await supabase
                .from('recovery_campaigns')
                .select('read_count')
                .eq('id', c.campaign_id)
                .single();
              if (camp) {
                await supabase.from('recovery_campaigns').update({
                  read_count: (camp.read_count || 0) + 1,
                  updated_at: new Date().toISOString()
                }).eq('id', c.campaign_id);
              }
            }
          }

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

    if (claim?.id) await markEventProcessed(supabase, claim.id, { event, handled: false }).catch(() => {});
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
