import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableSize {
  table_name: string;
  total_bytes: number;
  total_size: string;
  row_estimate: number;
}

const DEFAULT_THRESHOLD_MB = 8000;
const GROWTH_ALERT_PCT = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const traceId = getTraceId(req);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) Buscar tamanhos atuais
    const { data: sizes, error: sizesErr } = await supabase.rpc('get_table_sizes');
    if (sizesErr) throw sizesErr;

    const rows = (sizes ?? []) as TableSize[];
    const totalBytes = rows.reduce((acc, r) => acc + Number(r.total_bytes ?? 0), 0);
    const totalRows = rows.reduce((acc, r) => acc + Number(r.row_estimate ?? 0), 0);
    const topTables = rows
      .sort((a, b) => Number(b.total_bytes) - Number(a.total_bytes))
      .slice(0, 10)
      .map((r) => ({
        name: r.table_name,
        bytes: Number(r.total_bytes),
        size: r.total_size,
        rows: Number(r.row_estimate),
      }));

    // 2) Inserir snapshot
    const { data: snap, error: snapErr } = await supabase
      .from('db_size_snapshots')
      .insert({
        total_bytes: totalBytes,
        total_rows: totalRows,
        top_tables: topTables,
      })
      .select()
      .single();

    if (snapErr) throw snapErr;

    // 3) Buscar threshold configurável
    const { data: setting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'db_size_alert_threshold_mb')
      .maybeSingle();

    const thresholdMb = Number(setting?.setting_value ?? DEFAULT_THRESHOLD_MB);
    const thresholdBytes = thresholdMb * 1024 * 1024;
    const totalMb = Math.round(totalBytes / 1024 / 1024);

    // 4) Verificar alertas
    const alerts: string[] = [];

    if (totalBytes > thresholdBytes * 0.8) {
      const pct = Math.round((totalBytes / thresholdBytes) * 100);
      alerts.push(`Banco em ${pct}% do limite (${totalMb} MB de ${thresholdMb} MB)`);
    }

    // Snapshot de 7 dias atrás para calcular crescimento
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: oldSnap } = await supabase
      .from('db_size_snapshots')
      .select('total_bytes, captured_at')
      .lte('captured_at', sevenDaysAgo.toISOString())
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oldSnap && Number(oldSnap.total_bytes) > 0) {
      const growthPct = ((totalBytes - Number(oldSnap.total_bytes)) / Number(oldSnap.total_bytes)) * 100;
      if (growthPct >= GROWTH_ALERT_PCT) {
        alerts.push(`Crescimento de ${growthPct.toFixed(1)}% nos últimos 7 dias`);
      }
    }

    // 5) Notificar admins se houver alertas
    if (alerts.length > 0) {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'master_admin']);

      const message = alerts.join(' · ');

      const notifications = (admins ?? []).map((a) => ({
        user_id: a.user_id,
        type: 'db_growth_alert',
        title: 'Alerta: tamanho do banco',
        message,
        metadata: {
          total_mb: totalMb,
          threshold_mb: thresholdMb,
          alerts,
          snapshot_id: snap.id,
        },
      }));

      if (notifications.length > 0) {
        await supabase.from('admin_notifications').insert(notifications);
      }
    }

    return okResponse(
      {
        snapshot_id: snap.id,
        total_mb: totalMb,
        threshold_mb: thresholdMb,
        alerts,
      },
      traceId,
      corsHeaders
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[capture-db-size-snapshot] error', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});