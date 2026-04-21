import { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface QueryFallbackProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isFetching?: boolean;
  onRetry?: () => void;
  /** Skeleton renderizado durante o primeiro carregamento. */
  loadingFallback?: ReactNode;
  /** Conteúdo exibido quando não há dados (após sucesso). */
  emptyMessage?: string;
  isEmpty?: boolean;
  children: ReactNode;
}

/**
 * Wrapper universal para queries TanStack em telas administrativas.
 *
 * Trata 4 estados de forma consistente:
 *   1. Carregando inicial → skeleton
 *   2. Erro → mensagem amigável + botão "Tentar novamente" + aviso de offline
 *   3. Vazio → mensagem configurável
 *   4. Sucesso → renderiza children
 *
 * Substitui o padrão repetido de `if (isLoading) return <Skeleton/>; if (error) return <Alert/>` em cada painel.
 */
export function QueryFallback({
  isLoading,
  isError,
  error,
  isFetching = false,
  onRetry,
  loadingFallback,
  emptyMessage,
  isEmpty = false,
  children,
}: QueryFallbackProps) {
  const { isOnline } = useNetworkStatus();

  if (isLoading) {
    return <>{loadingFallback ?? <Skeleton className="h-48 w-full" />}</>;
  }

  if (isError) {
    const message = (error as { message?: string })?.message ?? 'Erro desconhecido';
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {!isOnline && <WifiOff className="h-3.5 w-3.5" />}
          Não foi possível carregar os dados
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm opacity-90">
            {!isOnline
              ? 'Você está offline. Verifique sua conexão e tente novamente.'
              : message}
          </p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isFetching || !isOnline}
              className="gap-2"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {emptyMessage ?? 'Nenhum dado encontrado.'}
      </p>
    );
  }

  return <>{children}</>;
}
