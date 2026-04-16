import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { runGTMDiagnostic, type GTMDiagnosticResult } from '@/services/gtmDiagnosticService';
import { cn } from '@/lib/utils';

function StepStatus({ label, status, detail }: { label: string; status: boolean | null; detail?: string }) {
  const icon = status === true
    ? <CheckCircle className="h-5 w-5 text-green-500" />
    : status === false
    ? <XCircle className="h-5 w-5 text-red-500" />
    : <AlertTriangle className="h-5 w-5 text-yellow-500" />;

  const badge = status === true
    ? <Badge variant="outline" className="border-green-500 text-green-600 text-xs">OK</Badge>
    : status === false
    ? <Badge variant="outline" className="border-red-500 text-red-600 text-xs">Falha</Badge>
    : <Badge variant="outline" className="text-xs">Pendente</Badge>;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}

export const GTMDiagnosticTab = () => {
  const [manualRefreshKey, setManualRefreshKey] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery<GTMDiagnosticResult>({
    queryKey: ['gtm-diagnostic', manualRefreshKey],
    queryFn: () => runGTMDiagnostic(3, 2000),
    staleTime: 60_000,
    retry: false,
  });

  const handleRecheck = () => {
    setManualRefreshKey(k => k + 1);
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const allPassed = data?.step1_configured && data?.step2_scriptLoaded && data?.step3_dataLayerReady;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Status do Google Tag Manager</span>
            <Button variant="outline" size="sm" onClick={handleRecheck} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Verificar Novamente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            {allPassed
              ? <Badge className="bg-green-500 text-white">✅ Configurado e Funcional</Badge>
              : data?.step1_configured === false
              ? <Badge variant="outline" className="border-yellow-500 text-yellow-600">⚠️ Não Configurado</Badge>
              : <Badge variant="destructive">❌ Problema Detectado</Badge>
            }
            {data?.gtmId && (
              <span className="text-xs text-muted-foreground font-mono">ID: {data.gtmId}</span>
            )}
          </div>

          {/* 3-Step Verification */}
          <div className="space-y-3">
            <StepStatus
              label="1. GTM ID Configurado"
              status={data?.step1_configured ?? null}
              detail={data?.gtmId ? `ID encontrado: ${data.gtmId}` : 'Nenhum GTM ID encontrado no sistema'}
            />
            <StepStatus
              label="2. Script Carregado no DOM"
              status={data?.step2_scriptLoaded ?? null}
              detail={data?.step2_scriptLoaded ? 'Script gtm.js detectado na página' : 'Script gtm.js não encontrado no DOM'}
            />
            <StepStatus
              label="3. DataLayer Inicializado"
              status={data?.step3_dataLayerReady ?? null}
              detail={data?.step3_dataLayerReady ? 'window.dataLayer existe e contém eventos' : 'window.dataLayer vazio ou inexistente'}
            />
          </div>

          {data?.error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{data.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Troubleshooting Tips */}
      {!allPassed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💡 Dicas de Solução</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {!data?.step1_configured && (
              <p>• Configure o GTM ID em <strong>Configurações Gerais</strong> ou no perfil do administrador (campo &quot;GTM Container ID&quot;).</p>
            )}
            {data?.step1_configured && !data?.step2_scriptLoaded && (
              <p>• O script GTM não foi injetado na página. Verifique se o componente de injeção está ativo e se o ID está no formato correto (GTM-XXXXXXX).</p>
            )}
            {data?.step2_scriptLoaded && !data?.step3_dataLayerReady && (
              <p>• O script foi carregado mas o dataLayer está vazio. Verifique se há bloqueadores de anúncios ativos ou se o container GTM está publicado.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GTMDiagnosticTab;
