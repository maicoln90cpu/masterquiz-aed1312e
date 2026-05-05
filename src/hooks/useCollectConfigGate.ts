import { useCallback, useEffect, useRef, useState } from 'react';
import type { CollectFields } from '@/components/quiz/CollectConfigWarningDialog';

interface FormConfigShape {
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
  collectionTiming?: 'before' | 'after' | 'none' | string;
}

interface Params {
  formConfigState: FormConfigShape;
  updateFormConfig: (patch: Partial<FormConfigShape>) => void;
  saveQuiz: () => Promise<any> | any;
  isExpressMode: boolean;
}

/**
 * B2 — Intercepta publish em quiz REAL sem coleta configurada.
 *
 * Estratégia: ref + useEffect observando formConfigState.
 * Quando "Configurar e publicar" é clicado, gravamos o snapshot esperado
 * em `pendingExpectedRef` e chamamos `updateFormConfig`. O useEffect
 * dispara `saveQuiz()` no render seguinte, quando o state já bateu.
 */
export const useCollectConfigGate = ({
  formConfigState,
  updateFormConfig,
  saveQuiz,
  isExpressMode,
}: Params) => {
  const [showWarning, setShowWarning] = useState(false);
  // Quando true, próxima chamada de gatedPublish ignora o gating (já dismissado nesta sessão)
  const dismissedRef = useRef(false);
  // Snapshot esperado de formConfig — quando bater, dispara saveQuiz
  const pendingExpectedRef = useRef<CollectFields | null>(null);

  useEffect(() => {
    const expected = pendingExpectedRef.current;
    if (!expected) return;
    const matches =
      formConfigState.collectName === expected.collectName &&
      formConfigState.collectEmail === expected.collectEmail &&
      formConfigState.collectWhatsapp === expected.collectWhatsapp;
    if (matches) {
      pendingExpectedRef.current = null;
      // Dispara publish após state propagado
      void saveQuiz();
    }
  }, [formConfigState, saveQuiz]);

  const noCollect =
    !formConfigState.collectName &&
    !formConfigState.collectEmail &&
    !formConfigState.collectWhatsapp;

  /**
   * Wrap em torno de saveQuiz: se quiz real + sem coleta + ainda não dismissado,
   * abre o modal e retorna sem publicar. Caso contrário, publica direto.
   * Retorna `true` se o publish foi bloqueado (modal aberto).
   */
  const gatedPublish = useCallback(async (): Promise<boolean> => {
    if (isExpressMode || dismissedRef.current || !noCollect) {
      return false;
    }
    setShowWarning(true);
    return true;
  }, [isExpressMode, noCollect]);

  const confirmAndPublish = useCallback(
    (fields: CollectFields) => {
      dismissedRef.current = true;
      pendingExpectedRef.current = fields;
      // Garante timing 'after' caso esteja 'none' (senão coleta nunca é exibida ao visitante)
      const patch: Partial<FormConfigShape> = { ...fields };
      if (formConfigState.collectionTiming === 'none') {
        patch.collectionTiming = 'after';
      }
      updateFormConfig(patch);
      setShowWarning(false);
      // saveQuiz será disparado pelo useEffect quando formConfigState propagar
    },
    [formConfigState.collectionTiming, updateFormConfig],
  );

  const publishAnyway = useCallback(() => {
    dismissedRef.current = true;
    setShowWarning(false);
    void saveQuiz();
  }, [saveQuiz]);

  const handleOpenChange = useCallback((open: boolean) => {
    // Fechar (X / overlay) sem decisão = cancela publicação, NÃO marca dismissed
    if (!open) {
      pendingExpectedRef.current = null;
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  }, []);

  return {
    showWarning,
    gatedPublish,
    confirmAndPublish,
    publishAnyway,
    handleOpenChange,
  };
};