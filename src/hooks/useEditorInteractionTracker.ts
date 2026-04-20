import { logger } from '@/lib/logger';
import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para rastrear interações REAIS do usuário no editor de quiz.
 * Usado para condicionar o disparo de `first_quiz_created` — só dispara
 * quando o usuário realmente editou algo (não apenas navegou automaticamente).
 *
 * Interações que contam:
 * - Editar título do quiz
 * - Editar texto de pergunta
 * - Alterar opções de resposta
 * - Adicionar/remover/reordenar blocos
 * - Clicar "Modo avançado"
 *
 * Interações que NÃO contam:
 * - Selecionar objetivo no /start
 * - Navegar entre perguntas (apenas visualizar)
 * - Auto-save disparar
 */
export function useEditorInteractionTracker(quizId: string | null) {
  const [interactionCount, setInteractionCount] = useState(0);
  const trackedActionsRef = useRef(new Set<string>());

  const hasInteracted = interactionCount >= 1;

  // Reset quando quizId muda
  useEffect(() => {
    trackedActionsRef.current.clear();
    setInteractionCount(0);
  }, [quizId]);

  /**
   * Registra uma interação real do usuário.
   * Cada `actionKey` é contado apenas 1x (idempotente por tipo).
   * Exemplos de actionKey: 'title_edit', 'block_edit', 'option_edit', 'question_reorder'
   */
  const trackInteraction = useCallback((actionKey: string) => {
    if (trackedActionsRef.current.has(actionKey)) return;
    trackedActionsRef.current.add(actionKey);
    setInteractionCount(prev => prev + 1);
    logger.log(`📝 [InteractionTracker] Tracked: ${actionKey} (total: ${trackedActionsRef.current.size})`);
  }, []);

  return {
    interactionCount,
    hasInteracted,
    trackInteraction,
  };
}
