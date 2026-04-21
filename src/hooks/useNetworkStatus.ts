/**
 * 🛡️ Onda 6 — Etapa 2: fonte ÚNICA de verdade para status online/offline.
 *
 * Por que existe?
 *  - Antes, cada hook (useAutoSave, etc.) duplicava listeners de `online`/`offline`.
 *  - Agora, todos consomem este hook → estado consistente + fácil de testar.
 *
 * Bônus: expõe `wentOnlineAt` (timestamp da última transição offline→online),
 * que o useAutoSave usa para disparar flush automático ao recuperar a conexão.
 */

import { useEffect, useState, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  /** Última vez que voltou online (ms epoch). null se nunca ficou offline na sessão. */
  wentOnlineAt: number | null;
  /** Última vez que ficou offline (ms epoch). null se nunca ficou offline. */
  wentOfflineAt: number | null;
}

const getInitial = (): NetworkStatus => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  wentOnlineAt: null,
  wentOfflineAt: null,
});

export function useNetworkStatus(): NetworkStatus & { refresh: () => void } {
  const [status, setStatus] = useState<NetworkStatus>(getInitial);

  const refresh = useCallback(() => {
    setStatus((s) => ({ ...s, isOnline: navigator.onLine }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((s) => ({
        ...s,
        isOnline: true,
        wentOnlineAt: Date.now(),
      }));
    };
    const handleOffline = () => {
      setStatus((s) => ({
        ...s,
        isOnline: false,
        wentOfflineAt: Date.now(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { ...status, refresh };
}