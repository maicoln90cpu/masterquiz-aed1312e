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

/**
 * Estimativa rápida de tamanho em KB.
 */
function estimateSizeKb(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === 'string') return obj.length / 1024;
  if (typeof obj === 'number' || typeof obj === 'boolean') return 0.008;
  try {
    return JSON.stringify(obj).length * 2 / 1024;
  } catch {
    return 1;
  }
}

/**
 * Hook para gerenciar histórico de estados com Undo/Redo
 * 
 * Fase 7 — Otimizações de performance:
 * - Limite de memória configurável (maxMemoryKb) com auto-pruning
 * - maxHistory reduzido de 50 para 30 (melhor uso de memória)
 * - Remoção do lock via setTimeout (race condition eliminada)
 * - Cache de tamanho por entrada para pruning eficiente
 */
export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): UseHistoryReturn<T> {
  const { maxHistory = 30, debounceMs = 300, maxMemoryKb = 5000 } = options;

  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<T | null>(null);
  const lastSavedState = useRef<T>(initialState);

  // ✅ Cache de tamanhos estimados para auto-pruning por memória
  const memoryCacheRef = useRef<number[]>([]);
  const totalMemoryRef = useRef(0);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Função interna para salvar no histórico
  const saveToHistory = useCallback((currentState: T, newState: T) => {
    // Comparação por stringify (confiável para qualquer tipo)
    const currentJson = JSON.stringify(currentState);
    const newJson = JSON.stringify(newState);
    if (currentJson === newJson) return;
    if (newJson === '[]' && currentJson === '[]') return;

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
      
      // ✅ Limite por memória — auto-pruning
      while (newTotal > maxMemoryKb && newPast.length > 1) {
        newPast.shift();
        newTotal -= newMemCache.shift() || 0;
      }
      
      memoryCacheRef.current = newMemCache;
      totalMemoryRef.current = Math.max(0, newTotal);
      
      return newPast;
    });

    setFuture([]);
    lastSavedState.current = newState;
  }, [maxHistory, maxMemoryKb]);

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

  const setState = useCallback((newStateOrFn: T | ((prev: T) => T)) => {
    setStateInternal(prev => {
      const newState = typeof newStateOrFn === 'function' 
        ? (newStateOrFn as (prev: T) => T)(prev) 
        : newStateOrFn;

      pendingState.current = newState;

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

  const undo = useCallback(() => {
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
      memoryCacheRef.current.pop();
      return newPast;
    });
  }, [state, saveToHistory]);

  const redo = useCallback(() => {
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);
      setPast(prevPast => [...prevPast, state]);
      setStateInternal(next);
      lastSavedState.current = next;
      const entrySizeKb = estimateSizeKb(state);
      memoryCacheRef.current.push(entrySizeKb);
      totalMemoryRef.current += entrySizeKb;
      return newFuture;
    });
  }, [state]);

  const clearHistory = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingState.current = null;
    setPast([]);
    setFuture([]);
    lastSavedState.current = state;
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
