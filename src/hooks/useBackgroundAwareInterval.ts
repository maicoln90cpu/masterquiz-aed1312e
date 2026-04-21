import { useEffect, useState } from 'react';

/**
 * Retorna `intervalMs` quando a aba está visível e `false` quando oculta.
 * Plug-and-play em `refetchInterval` do TanStack Query — pausa polling automaticamente
 * quando o usuário troca de aba, evitando rede/CPU desnecessários.
 *
 * Uso:
 *   const refetchInterval = useBackgroundAwareInterval(60_000);
 *   useQuery({ queryKey, queryFn, refetchInterval });
 */
export function useBackgroundAwareInterval(intervalMs: number): number | false {
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onChange = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return isVisible ? intervalMs : false;
}