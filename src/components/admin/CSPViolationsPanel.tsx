import { useCSPMonitor } from "@/hooks/useCSPMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CSPViolationsPanel = () => {
  const { violations } = useCSPMonitor();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Monitoramento de CSP
        </CardTitle>
        <CardDescription>
          Violações de Content Security Policy detectadas em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        {violations.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Nenhuma violação de CSP detectada. Todos os scripts estão carregando corretamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {violations.length} violação(ões) detectada(s). Verifique o console para mais detalhes.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {violations.map((violation, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-destructive/10 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {violation.effectiveDirective}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {violation.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-mono break-all">
                    Bloqueado: {violation.blockedURI || 'inline'}
                  </p>
                  {violation.sourceFile && (
                    <p className="text-xs text-muted-foreground">
                      Arquivo: {violation.sourceFile}:{violation.lineNumber}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
