/**
 * 🛡️ Onda 6 — Etapa 2: banner global de status de conexão.
 *
 * Renderizado em <App /> uma única vez. Quando o usuário fica offline:
 *  - Faixa amarela no topo (sticky, accessible: role="status" aria-live).
 *  - Mensagem clara em PT-BR explicando que alterações são preservadas.
 * Quando volta online:
 *  - Faixa verde por 3s confirmando reconexão, depois some sozinha.
 *
 * Usa apenas tokens semânticos do design system (nada de cores hardcoded).
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const { isOnline, wentOnlineAt } = useNetworkStatus();
  const [showRecovered, setShowRecovered] = useState(false);

  // Mostra confirmação verde por 3s ao voltar online
  useEffect(() => {
    if (!wentOnlineAt) return;
    setShowRecovered(true);
    const t = setTimeout(() => setShowRecovered(false), 3000);
    return () => clearTimeout(t);
  }, [wentOnlineAt]);

  if (isOnline && !showRecovered) return null;

  const offline = !isOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-sm font-medium',
        'flex items-center justify-center gap-2 shadow-md transition-colors',
        offline
          ? 'bg-yellow-500/95 text-yellow-950 dark:bg-yellow-400 dark:text-yellow-950'
          : 'bg-green-500/95 text-green-950 dark:bg-green-400 dark:text-green-950',
      )}
    >
      {offline ? (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>
            Você está offline — suas alterações serão salvas quando a conexão voltar.
          </span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span>Conexão restaurada — sincronizando alterações pendentes…</span>
        </>
      )}
    </div>
  );
}

export default OfflineBanner;