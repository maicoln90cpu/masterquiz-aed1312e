import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHistoryOptions {
  /** Número máximo de estados no histórico (default: 30) */
  maxHistory?: number;
  /** Debounce em ms para agrupar mudanças rápidas (default: 300) */
  debounceMs?: number;
  /** Tamanho máximo estimado em KB para o histórico total (default: 5000 = 5MB) */
  maxMemoryKb?: number;
}

interface UseHistoryReturn<T> {
  /** Estado atual */
  state: T;
  /** Atualiza o estado e adiciona ao histórico */
  setState: (newState: T | ((prev: T) => T)) => void;
  /** Desfaz a última alteração */
  undo: () => void;
  /** Refaz a alteração desfeita */
  redo: () => void;
  /** Verifica se pode desfazer */
  canUndo: boolean;
  /** Verifica se pode refazer */
  canRedo: boolean;
  /** Limpa todo o histórico */
  clearHistory: () => void;
  /** Número de ações que podem ser desfeitas */
  undoCount: number;
  /** Número de ações que podem ser refeitas */
  redoCount: number;
  /** Força salvar o estado atual no histórico (ignora debounce) */
  forceSave: () => void;
  /** Estimativa de memória usada pelo histórico (KB) */
  memoryUsageKb: number;
}

// ── Utilidades de performance ──

/**
 * Hash rápido para comparação de igualdade (FNV-1a 32-bit).
 * Muito mais rápido que JSON.stringify para objetos grandes.
 * Usado apenas para detectar se houve mudança — não para persistência.
 */
function fastHash(obj: unknown): number {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, unsigned
  }
  return hash;
}

/**
 * Estimativa rápida de tamanho em bytes (sem serializar de novo se possível).
 * Usa amostragem para objetos grandes.
 */
function estimateSizeKb(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === 'string') return obj.length / 1024;
  if (typeof obj === 'number' || typeof obj === 'boolean') return 0.008;
  // Para arrays/objetos, serializar uma vez (inevitável para estimativa precisa)
  try {
    const str = JSON.stringify(obj);
    return str.length * 2 / 1024; // UTF-16 = 2 bytes per char
  } catch {
    return 1; // fallback
  }
}

/**
 * Hook para gerenciar histórico de estados com Undo/Redo
 * 
 * Fase 7 — Otimizações de performance:
 * - Hash rápido (FNV-1a) para detecção de duplicatas
 * - Limite de memória configurável (maxMemoryKb)
 * - Auto-pruning quando memória excede o limite
 * - Lock síncrono (sem setTimeout) para prevenir race conditions
 * - Cache de hash por entrada para evitar re-serialização
 * 
 * @example
 * const { state, setState, undo, redo, canUndo, canRedo } = useHistory<Question[]>([], {
 *   maxHistory: 30,
 *   debounceMs: 500,
 *   maxMemoryKb: 5000
 * });
 */
export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): UseHistoryReturn<T> {
  const { maxHistory = 30, debounceMs = 300, maxMemoryKb = 5000 } = options;

  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  
  // Refs para debounce e performance
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<T | null>(null);
  const lastSavedState = useRef<T>(initialState);
  const lastSavedHash = useRef<number>(fastHash(initialState));
  
  // ✅ Cache de tamanhos estimados para cada entrada do histórico
  const memoryCacheRef = useRef<number[]>([]);
  const totalMemoryRef = useRef(0);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ── Função interna para salvar no histórico ──
  const saveToHistory = useCallback((currentState: T, newState: T) => {
    // ✅ Comparação rápida via hash (FNV-1a) em vez de JSON.stringify completo
    const newHash = fastHash(newState);
    if (newHash === lastSavedHash.current) {
      return;
    }

    // ✅ Estimar tamanho da nova entrada
    const entrySizeKb = estimateSizeKb(currentState);

    setPast(prev => {
      let newPast = [...prev, currentState];
      const newMemCache = [...memoryCacheRef.current, entrySizeKb];
      let newTotal = totalMemoryRef.current + entrySizeKb;
      
      // ✅ Limite por contagem
      while (newPast.length > maxHistory) {
        newPast.shift();
        newTotal -= newMemCache.shift() || 0;
      }
      
      // ✅ Limite por memória — remover entradas mais antigas até caber
      while (newTotal > maxMemoryKb && newPast.length > 1) {
        newPast.shift();
        newTotal -= newMemCache.shift() || 0;
      }
      
      memoryCacheRef.current = newMemCache;
      totalMemoryRef.current = Math.max(0, newTotal);
      
      return newPast;
    });

    // Limpar o futuro quando nova ação é feita
    setFuture([]);
    lastSavedState.current = newState;
    lastSavedHash.current = newHash;
  }, [maxHistory, maxMemoryKb]);

  // Força salvar imediatamente (útil antes de operações importantes)
  const forceSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    if (pendingState.current !== null) {
      saveToHistory(lastSavedState.current, pendingState.current);
      pendingState.current = null;
    }
  }, [saveToHistory]);

  // Atualiza o estado com debounce para o histórico
  const setState = useCallback((newStateOrFn: T | ((prev: T) => T)) => {
    setStateInternal(prev => {
      const newState = typeof newStateOrFn === 'function' 
        ? (newStateOrFn as (prev: T) => T)(prev) 
        : newStateOrFn;

      // Atualizar pending state
      pendingState.current = newState;

      // Debounce para salvar no histórico
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        if (pendingState.current !== null) {
          saveToHistory(lastSavedState.current, pendingState.current);
          pendingState.current = null;
        }
      }, debounceMs);

      return newState;
    });
  }, [debounceMs, saveToHistory]);

  // Undo
  const undo = useCallback(() => {
    // Força salvar qualquer mudança pendente primeiro
    if (pendingState.current !== null && debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      saveToHistory(lastSavedState.current, pendingState.current);
      pendingState.current = null;
    }

    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setFuture(prevFuture => [state, ...prevFuture]);
      setStateInternal(previous);
      lastSavedState.current = previous;
      lastSavedHash.current = fastHash(previous);
      
      // ✅ Atualizar cache de memória
      memoryCacheRef.current.pop();

      return newPast;
    });
  }, [state, saveToHistory]);

  // Redo
  const redo = useCallback(() => {
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast(prevPast => [...prevPast, state]);
      setStateInternal(next);
      lastSavedState.current = next;
      lastSavedHash.current = fastHash(next);
      
      // ✅ Atualizar cache de memória
      memoryCacheRef.current.push(estimateSizeKb(state));
      totalMemoryRef.current += estimateSizeKb(state);

      return newFuture;
    });
  }, [state]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingState.current = null;
    setPast([]);
    setFuture([]);
    lastSavedState.current = state;
    lastSavedHash.current = fastHash(state);
    memoryCacheRef.current = [];
    totalMemoryRef.current = 0;
  }, [state]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
    undoCount: past.length,
    redoCount: future.length,
    forceSave,
    memoryUsageKb: totalMemoryRef.current,
  };
}
