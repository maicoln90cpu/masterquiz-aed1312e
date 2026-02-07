import { useEffect, useCallback } from 'react';

interface UseUndoRedoShortcutsOptions {
  /** Função para desfazer */
  onUndo: () => void;
  /** Função para refazer */
  onRedo: () => void;
  /** Se os atalhos estão habilitados (default: true) */
  enabled?: boolean;
  /** Se pode desfazer */
  canUndo?: boolean;
  /** Se pode refazer */
  canRedo?: boolean;
}

/**
 * Hook para registrar atalhos de teclado Ctrl+Z (Undo) e Ctrl+Y/Ctrl+Shift+Z (Redo)
 * 
 * @example
 * useUndoRedoShortcuts({
 *   onUndo: undo,
 *   onRedo: redo,
 *   canUndo: history.canUndo,
 *   canRedo: history.canRedo
 * });
 */
export function useUndoRedoShortcuts({
  onUndo,
  onRedo,
  enabled = true,
  canUndo = true,
  canRedo = true
}: UseUndoRedoShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Ignorar se estiver digitando em input/textarea
    const target = e.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;

    // Para campos de texto, deixar o comportamento padrão do navegador
    // A não ser que seja um campo específico do editor
    if (isInputElement && !target.closest('[data-undo-redo-enabled]')) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (!modifier) return;

    // Ctrl+Z / Cmd+Z = Undo
    if (e.key === 'z' && !e.shiftKey) {
      if (canUndo) {
        e.preventDefault();
        onUndo();
      }
      return;
    }

    // Ctrl+Y / Cmd+Shift+Z = Redo
    if ((e.key === 'y' && !e.shiftKey) || (e.key === 'z' && e.shiftKey)) {
      if (canRedo) {
        e.preventDefault();
        onRedo();
      }
      return;
    }
  }, [enabled, canUndo, canRedo, onUndo, onRedo]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}
