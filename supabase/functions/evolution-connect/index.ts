import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeApiUrl(url: string): string {
  let normalized = url.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  return normalized;
}

async function checkInstanceExists(evolutionApiUrl: string, evolutionApiKey: string, instanceName: string): Promise<{ exists: boolean; connected: boolean }> {
  try {
    const fetchRes = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': evolutionApiKey },
    });

    if (!fetchRes.ok) {
      console.log('fetchInstances failed:', fetchRes.status);
      return { exists: false, connected: false };
    }

    const instances = await fetchRes.json();
    console.log('fetchInstances response:', JSON.stringify(instances).substring(0, 500));

    if (!Array.isArray(instances) || instances.length === 0) {
      console.log('No instances returned from API');
      return { exists: false, connected: false };
    }

    const instance = instances.find((i: any) => {
      const name = i.name || i.instanceName || i.instance?.instanceName || i.instance?.name;
      return name === instanceName;
    });

    if (!instance) {
      console.log(`Instance ${instanceName} not found in list of ${instances.length} instances`);
      return { exists: false, connected: false };
    }

    const state = instance.connectionStatus || instance.state || instance.instance?.state || 'disconnected';
    const connected = state === 'open' || state === 'connected';

    console.log(`Instance ${instanceName} exists: true, connected: ${connected}, state: ${state}`);
    return { exists: true, connected };
  } catch (error) {
    console.error('Error checking instance:', error);
    return { exists: false, connected: false };
  }
}

async function createInstance(evolutionApiUrl: string, evolutionApiKey: string, instanceName: string): Promise<boolean> {
  try {
    console.log('Creating new instance:', instanceName);
    const createRes = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!createRes.ok && createRes.status !== 409) {
      const errorText = await createRes.text();
      console.error('Error creating instance:', createRes.status, errorText);
      return false;
    }

    console.log('Instance created successfully');
    return true;
  } catch (error) {
    console.error('Error creating instance:', error);
    return false;
  }
}

function extractQrCode(connectData: any): string | null {
  let qrCode = null;

  if (connectData?.base64) {
    qrCode = connectData.base64;
  } else if (connectData?.qrcode?.base64) {
    qrCode = connectData.qrcode.base64;
  } else if (connectData?.qr?.base64) {
    qrCode = connectData.qr.base64;
  } else if (typeof connectData?.qrcode === 'string') {
    qrCode = connectData.qrcode;
  } else if (typeof connectData?.code === 'string' && connectData.code.length > 100) {
    qrCode = connectData.code;
  }

  if (qrCode && qrCode.startsWith('data:image')) {
    qrCode = qrCode.replace(/^data:image\/[a-z]+;base64,/, '');
  }

  return qrCode;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, apiUrl } = await req.json();

    const rawApiUrl = apiUrl || Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiUrl = rawApiUrl ? normalizeApiUrl(rawApiUrl) : null;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    console.log('Evolution Connect - Action:', action);
    console.log('Evolution Connect - API URL (normalized):', evolutionApiUrl);

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Missing config - URL:', !!evolutionApiUrl, 'Key:', !!evolutionApiKey);
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nos secrets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instanceName = 'masterquizz';

    // ========== ACTION: CONNECT ==========
    if (action === 'connect') {
      console.log('=== CONNECT FLOW ===');

      const { exists, connected } = await checkInstanceExists(evolutionApiUrl, evolutionApiKey, instanceName);

      if (connected) {
        console.log('Instance already connected, returning success');

        // Atualizar status no banco
        await supabase
          .from('recovery_settings')
          .update({
            is_connected: true,
            connection_status: 'connected',
            last_connection_check: new Date().toISOString(),
            instance_name: instanceName,
            evolution_api_url: evolutionApiUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', (await supabase.from('recovery_settings').select('id').single()).data?.id);

        return new Response(
          JSON.stringify({
            qrCode: null,
            state: 'connected',
            instance: instanceName,
            exists: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Se não existe, criar instância
      if (!exists) {
        const created = await createInstance(evolutionApiUrl, evolutionApiKey, instanceName);
        if (!created) {
          return new Response(
            JSON.stringify({ error: 'Falha ao criar instância na Evolution API' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Conectar e obter QR Code
      console.log('Connecting instance...');
      const connectRes = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey },
      });

      if (!connectRes.ok) {
        const errorText = await connectRes.text();
        console.error('Connect failed:', connectRes.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Falha ao conectar instância', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connectData = await connectRes.json();
      console.log('Connect response keys:', Object.keys(connectData));

      const qrCode = extractQrCode(connectData);

      // Salvar QR code no banco
      await supabase
        .from('recovery_settings')
        .update({
          qr_code_base64: qrCode,
          connection_status: 'awaiting_scan',
          instance_name: instanceName,
          evolution_api_url: evolutionApiUrl,
          last_connection_check: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('recovery_settings').select('id').single()).data?.id);

      return new Response(
        JSON.stringify({
          qrCode,
          state: 'awaiting_scan',
          instance: instanceName,
          exists: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: STATUS ==========
    if (action === 'status') {
      const { exists, connected } = await checkInstanceExists(evolutionApiUrl, evolutionApiKey, instanceName);

      // Atualizar status no banco
      await supabase
        .from('recovery_settings')
        .update({
          is_connected: connected,
          connection_status: connected ? 'connected' : (exists ? 'disconnected' : 'not_found'),
          last_connection_check: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('recovery_settings').select('id').single()).data?.id);

      return new Response(
        JSON.stringify({
          state: connected ? 'connected' : (exists ? 'disconnected' : 'not_found'),
          instance: instanceName,
          exists,
          connected
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: DISCONNECT ==========
    if (action === 'disconnect') {
      try {
        await fetch(`${evolutionApiUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionApiKey },
        });
      } catch (error) {
        console.log('Logout error (non-critical):', error);
      }

      await supabase
        .from('recovery_settings')
        .update({
          is_connected: false,
          connection_status: 'disconnected',
          qr_code_base64: null,
          last_connection_check: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('recovery_settings').select('id').single()).data?.id);

      return new Response(
        JSON.stringify({ success: true, state: 'disconnected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ACTION: WEBHOOK DIAGNOSTICS ==========
    if (action === 'webhook_diagnostics') {
      console.log('=== WEBHOOK DIAGNOSTICS ===');
      const expectedWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
      const requiredEvents = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'];

      try {
        const webhookRes = await fetch(`${evolutionApiUrl}/webhook/find/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': evolutionApiKey },
        });

        let webhookConfig: any = null;
        let configuredUrl: string | null = null;
        let configuredEvents: string[] = [];
        let webhookEnabled = false;

        if (webhookRes.ok) {
          webhookConfig = await webhookRes.json();
          configuredUrl = webhookConfig?.url || webhookConfig?.webhook?.url || null;
          configuredEvents = webhookConfig?.events || webhookConfig?.webhook?.events || [];
          webhookEnabled = webhookConfig?.enabled ?? webhookConfig?.webhook?.enabled ?? false;
        }

        const urlMatches = configuredUrl === expectedWebhookUrl;
        const missingEvents = requiredEvents.filter((e) => !configuredEvents.includes(e));
        const allEventsPresent = missingEvents.length === 0;

        // Buscar saúde do webhook do banco
        const { data: health } = await supabase
          .from('v_evolution_webhook_health')
          .select('*')
          .single();

        return new Response(
          JSON.stringify({
            expected_url: expectedWebhookUrl,
            configured_url: configuredUrl,
            url_matches: urlMatches,
            webhook_enabled: webhookEnabled,
            required_events: requiredEvents,
            configured_events: configuredEvents,
            missing_events: missingEvents,
            all_events_present: allEventsPresent,
            health: health || null,
            recommendation: !configuredUrl
              ? 'Webhook não configurado na Evolution API. Use action=fix_webhook para configurar.'
              : !urlMatches
              ? 'URL do webhook está apontando para outro lugar. Use action=fix_webhook para corrigir.'
              : !allEventsPresent
              ? `Faltam eventos: ${missingEvents.join(', ')}. Use action=fix_webhook para adicionar.`
              : 'Webhook está corretamente configurado. Se ainda não chegam confirmações, verifique a instância na Evolution API.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Webhook diagnostics error:', error);
        return new Response(
          JSON.stringify({
            error: 'Falha ao consultar webhook',
            details: error instanceof Error ? error.message : 'Unknown',
            expected_url: expectedWebhookUrl,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ========== ACTION: FIX WEBHOOK ==========
    if (action === 'fix_webhook') {
      console.log('=== FIX WEBHOOK ===');
      const expectedWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
      const requiredEvents = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'];

      try {
        const setRes = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            url: expectedWebhookUrl,
            enabled: true,
            webhookByEvents: false,
            events: requiredEvents,
          }),
        });

        const result = await setRes.text();
        if (!setRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Falha ao configurar webhook', status: setRes.status, details: result }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            url: expectedWebhookUrl,
            events: requiredEvents,
            message: 'Webhook configurado. Próximas mensagens devem receber confirmações de entrega.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Erro ao corrigir webhook', details: error instanceof Error ? error.message : 'Unknown' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use: connect, status, disconnect, webhook_diagnostics, fix_webhook' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evolution connect error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
