import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Video, HardDrive, AlertTriangle } from "lucide-react";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export const VideoStorageCard = () => {
  const { 
    allowVideoUpload, 
    videoStorageLimitMb, 
    usedMb, 
    videoCount,
    remainingMb, 
    usagePercentage,
    isLoading 
  } = useVideoStorage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento de Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!allowVideoUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento de Vídeos
          </CardTitle>
          <CardDescription>
            Recurso não disponível no seu plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Upload de vídeos não está disponível no seu plano atual. 
              Faça upgrade para desbloquear esta funcionalidade.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Armazenamento de Vídeos
        </CardTitle>
        <CardDescription>
          Gerencie o uso de armazenamento dos seus vídeos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Vídeos Enviados</p>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold">{videoCount}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Espaço Disponível</p>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-accent" />
              <p className="text-2xl font-bold">{remainingMb.toFixed(1)}MB</p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uso de Armazenamento</span>
            <span className="font-medium">
              {usedMb.toFixed(2)}MB / {videoStorageLimitMb}MB
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-3 ${
              isAtLimit 
                ? '[&>div]:bg-destructive' 
                : isNearLimit 
                ? '[&>div]:bg-warning' 
                : ''
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {usagePercentage.toFixed(1)}% utilizado
            </p>
            {isAtLimit && (
              <Badge variant="destructive" className="text-xs">
                Limite atingido
              </Badge>
            )}
            {isNearLimit && !isAtLimit && (
              <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">
                Próximo ao limite
              </Badge>
            )}
          </div>
        </div>

        {/* Alertas */}
        {isAtLimit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você atingiu o limite de armazenamento. Delete vídeos ou faça upgrade do seu plano para continuar enviando.
            </AlertDescription>
          </Alert>
        )}

        {isNearLimit && !isAtLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você está próximo do limite de armazenamento ({usagePercentage.toFixed(1)}%). 
              Considere fazer upgrade do seu plano.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• Limite do plano: {videoStorageLimitMb}MB</p>
          <p>• Tamanho médio por vídeo: {videoCount > 0 ? (usedMb / videoCount).toFixed(1) : 0}MB</p>
          <p>• Formato suportado: MP4, WebM, MOV (até 100MB)</p>
        </div>
      </CardContent>
    </Card>
  );
};
