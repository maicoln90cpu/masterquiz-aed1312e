import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Hook para renderização lazy baseada em visibilidade do elemento
 * Usado para otimizar performance carregando seções apenas quando visíveis
 */
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '100px'
): { ref: RefObject<HTMLDivElement>; isVisible: boolean } {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Uma vez visível, para de observar
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

export default useIntersectionObserver;
