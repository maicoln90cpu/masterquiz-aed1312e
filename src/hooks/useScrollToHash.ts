import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Rola suavemente até a âncora indicada no hash da URL ao montar/atualizar a rota.
 *
 * Compensa o header fixo (80px) e tolera componentes lazy-loaded com retries.
 *
 * @example
 * ```tsx
 * useScrollToHash(); // dentro de Index.tsx
 * ```
 */
export const useScrollToHash = (headerOffset = 80) => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.replace('#', '');
    let attempts = 0;
    const maxAttempts = 20; // até ~2s aguardando lazy load

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, 100);
      }
    };

    // pequeno delay inicial para dar tempo de o React montar a árvore
    const t = setTimeout(tryScroll, 50);
    return () => clearTimeout(t);
  }, [hash, pathname, headerOffset]);
};
