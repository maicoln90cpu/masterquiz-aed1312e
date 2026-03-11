import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHistoryOptions {
  /** Número máximo de estados no histórico (default: 50) */
  maxHistory?: number;
  /** Debounce em ms para agrupar mudanças rápidas (default: 300) */
  debounceMs?: number;
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
}

/**
 * Hook para gerenciar histórico de estados com Undo/Redo
 * 
 * @example
 * const { state, setState, undo, redo, canUndo, canRedo } = useHistory<Question[]>([], {
 *   maxHistory: 50,
 *   debounceMs: 300
 * });
 */
export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): UseHistoryReturn<T> {
  const { maxHistory = 50, debounceMs = 300 } = options;

  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  
  // Refs para debounce
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<T | null>(null);
  const lastSavedState = useRef<T>(initialState);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ✅ Ref para prevenir saves durante transições
  const isSavingRef = useRef(false);

  // Função interna para salvar no histórico
  const saveToHistory = useCallback((currentState: T, newState: T) => {
    // ✅ Guard contra saves duplicados
    if (isSavingRef.current) return;
    
    // Não salvar se for igual ao estado anterior
    const currentJson = JSON.stringify(currentState);
    const newJson = JSON.stringify(newState);
    if (currentJson === newJson) {
      return;
    }
    
    // ✅ Não salvar se o novo estado é vazio e o anterior também
    if (newJson === '[]' && currentJson === '[]') {
      return;
    }

    isSavingRef.current = true;

    setPast(prev => {
      const newPast = [...prev, currentState];
      // Limitar tamanho do histórico
      if (newPast.length > maxHistory) {
        return newPast.slice(-maxHistory);
      }
      return newPast;
    });

    // Limpar o futuro quando nova ação é feita
    setFuture([]);
    lastSavedState.current = newState;
    
    // ✅ Liberar lock
    setTimeout(() => {
      isSavingRef.current = false;
    }, 50);
  }, [maxHistory]);

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
    forceSave
  };
}
