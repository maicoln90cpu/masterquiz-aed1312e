import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const url = new URL(req.url);
    const email = url.searchParams.get('email') || '';
    const userId = url.searchParams.get('uid') || '';
    const reason = url.searchParams.get('reason') || 'user_request';

    if (!email) {
      return new Response('<html><body><h2>Email não informado.</h2></body></html>', {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Insert unsubscribe record
    await supabase.from('email_unsubscribes').upsert({
      email: email.toLowerCase(),
      user_id: userId || null,
      reason,
    }, { onConflict: 'email' });

    // Cancel any pending emails for this user
    if (userId) {
      await supabase.from('email_recovery_contacts')
        .update({ status: 'cancelled', error_message: 'Usuário cancelou inscrição' })
        .eq('user_id', userId)
        .eq('status', 'pending');
    } else {
      await supabase.from('email_recovery_contacts')
        .update({ status: 'cancelled', error_message: 'Usuário cancelou inscrição' })
        .eq('email', email.toLowerCase())
        .eq('status', 'pending');
    }

    // Show confirmation page
    return new Response(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelamento confirmado</title>
<style>body{font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f4f4f4}
.card{background:#fff;padding:40px;border-radius:12px;text-align:center;max-width:400px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
h1{color:#0f9b6e;font-size:24px}p{color:#555;line-height:1.6}</style></head>
<body><div class="card">
<h1>✅ Cancelamento confirmado</h1>
<p>Você não receberá mais emails da MasterQuiz.</p>
<p style="font-size:13px;color:#999;margin-top:20px;">Se mudou de ideia, entre em contato pelo nosso suporte.</p>
</div></body></html>`, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('<html><body><h2>Erro ao processar cancelamento.</h2></body></html>', {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
});
