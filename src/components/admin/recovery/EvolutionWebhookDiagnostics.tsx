import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Stethoscope, Wrench, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticsResult {
  expected_url: string;
  configured_url: string | null;
  url_matches: boolean;
  webhook_enabled: boolean;
  required_events: string[];
  configured_events: string[];
  missing_events: string[];
  all_events_present: boolean;
  health: {
    total_sent_or_more: number;
    stuck_sent_no_ack: number;
    confirmed_delivered_real: number;
    delivered_assumed_count: number;
    confirmed_read: number;
    last_real_delivery_ack_at: string | null;
    last_read_ack_at: string | null;
    webhook_health: 'critical_no_ack_ever' | 'warning_no_recent_ack' | 'healthy' | 'idle_no_recent_messages';
  } | null;
  recommendation: string;
  error?: string;
}

// 🔒 P11: edge function evolution-connect retorna envelope { ok, data, traceId }.
type EnvelopeResp<T> =
  | { ok: true; data: T; traceId: string }
  | { ok: false; error: { code: string; message: string }; traceId: string };

function unwrap<T>(resp: unknown): { payload: T | null; errorMessage: string | null } {
  const r = resp as EnvelopeResp<T> | null | undefined;
  if (!r) return { payload: null, errorMessage: null };
  if (r.ok === true) return { payload: r.data, errorMessage: null };
  return { payload: null, errorMessage: r.error?.message ?? 'Erro desconhecido' };
}

export function EvolutionWebhookDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-connect', {
        body: { action: 'webhook_diagnostics' },
      });
      if (error) throw error;
      const { payload, errorMessage } = unwrap<DiagnosticsResult>(data);
      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }
      setResult(payload);
    } catch (err: any) {
      toast.error('Falha ao executar diagnóstico: ' + (err.message || 'erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const fixWebhook = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-connect', {
        body: { action: 'fix_webhook' },
      });
      if (error) throw error;
      const { payload, errorMessage } = unwrap<{ success?: boolean; message?: string }>(data);
      if (errorMessage) {
        toast.error(errorMessage);
        return;
      }
      if (payload?.success) {
        toast.success('Webhook reconfigurado com sucesso!');
        await runDiagnostics();
      } else {
        toast.error(payload?.message || 'Falha ao corrigir webhook');
      }
    } catch (err: any) {
      toast.error('Erro ao corrigir: ' + (err.message || 'desconhecido'));
    } finally {
      setFixing(false);
    }
  };

  const healthBadge = (health: string | undefined) => {
    if (health === 'healthy') return <Badge className="bg-green-100 text-green-700 border-green-300">Saudável</Badge>;
    if (health === 'idle_no_recent_messages') return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Aguardando primeiro envio</Badge>;
    if (health === 'warning_no_recent_ack') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Atenção — sem confirmações recentes</Badge>;
    return <Badge variant="destructive">Crítico — nenhum ack recebido</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Diagnóstico do Webhook Evolution
            </CardTitle>
            <CardDescription>
              Verifica se a Evolution API está enviando confirmações de entrega/leitura para o sistema
            </CardDescription>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Stethoscope className="h-4 w-4 mr-2" />}
            Executar diagnóstico
          </Button>
        </div>
      </CardHeader>
      {result && (
        <CardContent className="space-y-4">
          {/* Saúde geral */}
          {result.health && (
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <span className="font-medium">Saúde do webhook:</span>
              {healthBadge(result.health.webhook_health)}
            </div>
          )}

          {/* Configuração */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              {result.url_matches ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">URL do webhook</p>
                <p className="text-xs text-muted-foreground break-all">Esperado: {result.expected_url}</p>
                <p className="text-xs text-muted-foreground break-all">Configurado: {result.configured_url || '— (não configurado)'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              {result.all_events_present ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">Eventos requisitados</p>
                <p className="text-xs text-muted-foreground">Necessários: {result.required_events.join(', ')}</p>
                {result.missing_events.length > 0 && (
                  <p className="text-xs text-destructive">Faltando: {result.missing_events.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          {result.health && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-muted">
                <p className="text-2xl font-bold">{result.health.total_sent_or_more}</p>
                <p className="text-muted-foreground">Enviadas total</p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="text-2xl font-bold text-green-600">{result.health.confirmed_delivered_real}</p>
                <p className="text-muted-foreground">Entregues confirmadas</p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="text-2xl font-bold text-yellow-600">{result.health.delivered_assumed_count}</p>
                <p className="text-muted-foreground">Entregues presumidas</p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="text-2xl font-bold text-blue-600">{result.health.confirmed_read}</p>
                <p className="text-muted-foreground">Lidas confirmadas</p>
              </div>
            </div>
          )}

          {/* Recomendação */}
          <Alert variant={result.all_events_present && result.url_matches ? 'default' : 'destructive'}>
            <AlertTitle>Recomendação</AlertTitle>
            <AlertDescription>{result.recommendation}</AlertDescription>
          </Alert>

          {(!result.url_matches || !result.all_events_present) && (
            <Button onClick={fixWebhook} disabled={fixing} className="w-full">
              {fixing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
              Corrigir webhook automaticamente
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
