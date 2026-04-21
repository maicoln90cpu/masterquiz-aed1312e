import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNetworkStatus } from './useNetworkStatus';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error' | 'offline';

interface AutoSaveOptions {
  /** Debounce delay in milliseconds (default: 30000 = 30s) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes successfully */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
  /** Callback when a version conflict is detected (other tab/device modified the quiz) */
  onConflict?: (info: { quizId: string; localVersion: number | null; remoteVersion: number | null }) => void;
  /** Show toast notifications (default: false for autosave) */
  showToast?: boolean;
}

interface AutoSaveData {
  quizId: string;
  title?: string;
  description?: string;
  template?: string;
  logoUrl?: string;
  showLogo?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showQuestionNumber?: boolean;
  questionCount?: number;
  isPublic?: boolean;
  questions?: any[];
  formConfig?: {
    collectionTiming: string;
    collectName: boolean;
    collectEmail: boolean;
    collectWhatsapp: boolean;
  };
}

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const {
    debounceMs = 30000, // 30 segundos por padrão
    enabled = true,
    onSaveStart,
    onSaveComplete,
    onSaveError,
    showToast = false
  } = options;

  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<AutoSaveData | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');

  // ✅ Refs para callbacks — estabiliza performSave/scheduleAutoSave
  const onSaveStartRef = useRef(onSaveStart);
  const onSaveCompleteRef = useRef(onSaveComplete);
  const onSaveErrorRef = useRef(onSaveError);
  const showToastRef = useRef(showToast);

  useEffect(() => { onSaveStartRef.current = onSaveStart; }, [onSaveStart]);
  useEffect(() => { onSaveCompleteRef.current = onSaveComplete; }, [onSaveComplete]);
  useEffect(() => { onSaveErrorRef.current = onSaveError; }, [onSaveError]);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  // 🛡️ Onda 6 — Etapa 2: usa fonte única de verdade
  const { isOnline, wentOnlineAt } = useNetworkStatus();

  // Espelha status='offline' quando perde a conexão
  useEffect(() => {
    if (!isOnline) setStatus('offline');
  }, [isOnline]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 🛡️ Onda 6 — Etapa 2: flush automático ao voltar online.
  // Se há dado pendente, dispara performSave em ~2s (delay para a rede estabilizar).
  // Antes: pendente ficava parado até o próximo edit do usuário.
  useEffect(() => {
    if (!wentOnlineAt) return;
    if (!pendingDataRef.current) return;
    const t = setTimeout(() => {
      if (pendingDataRef.current) {
        logger.log('[AutoSave] 🔄 Voltou online — flushing pendência');
        performSave(pendingDataRef.current);
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wentOnlineAt]);

  // Função que efetivamente salva no Supabase — deps estáveis via refs
  const performSave = useCallback(async (data: AutoSaveData): Promise<boolean> => {
    if (!data.quizId || isSavingRef.current) return false;

    // ✅ Dedup: skip save if payload hasn't changed
    const snapshot = JSON.stringify(data);
    if (snapshot === lastSavedSnapshotRef.current) {
      logger.log('[AutoSave] ⏭️ Payload não mudou, pulando save');
      return true;
    }

    try {
      isSavingRef.current = true;
      setStatus('saving');
      onSaveStartRef.current?.();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Atualizar metadados do quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: data.title || 'Novo Quiz',
          description: data.description,
          template: data.template,
          logo_url: data.logoUrl,
          show_logo: data.showLogo,
          show_title: data.showTitle,
          show_description: data.showDescription,
          show_question_number: data.showQuestionNumber,
          question_count: data.questionCount,
          is_public: data.isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.quizId)
        .eq('user_id', user.id);

      if (quizError) throw quizError;

      // Atualizar form config se existir
      if (data.formConfig) {
        await supabase
          .from('quiz_form_config')
          .upsert({
            quiz_id: data.quizId,
            collection_timing: data.formConfig.collectionTiming as any,
            collect_name: data.formConfig.collectName,
            collect_email: data.formConfig.collectEmail,
            collect_whatsapp: data.formConfig.collectWhatsapp
          }, {
            onConflict: 'quiz_id'
          });
      }

      // Salvar perguntas se existirem (DELETE + INSERT para evitar constraint violation)
      if (data.questions && data.questions.length > 0) {
        const { error: deleteError } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('quiz_id', data.quizId);

        if (deleteError) throw deleteError;

        const questionsToInsert = data.questions.map((q, idx) => ({
          quiz_id: data.quizId,
          question_text: q.question_text || '',
          order_number: idx,
          answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
          options: q.options || [],
          media_url: q.media_url || null,
          media_type: q.media_type || null,
          blocks: Array.isArray(q.blocks) ? q.blocks : [],
          conditions: q.conditions || null,
          custom_label: q.custom_label || null
        }));

        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      setStatus('saved');
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
      lastSavedSnapshotRef.current = snapshot;
      onSaveCompleteRef.current?.();

      if (showToastRef.current) {
        toast.success('Rascunho salvo automaticamente');
      }

      return true;
    } catch (error: any) {
      logger.error('[AutoSave] Erro ao salvar:', error);
      setStatus('error');
      onSaveErrorRef.current?.(error);

      if (showToastRef.current) {
        toast.error('Erro ao salvar rascunho: ' + error.message);
      }

      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Agendar salvamento com debounce
  const scheduleAutoSave = useCallback((data: AutoSaveData) => {
    if (!enabled || !data.quizId) return;

    // ✅ Dedup: se o payload não mudou desde o último save, manter status atual
    const snapshot = JSON.stringify(data);
    if (snapshot === lastSavedSnapshotRef.current) {
      return; // nada mudou, manter status 'saved'
    }

    // Armazenar dados pendentes
    pendingDataRef.current = data;
    setHasUnsavedChanges(true);
    setStatus('unsaved');

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agendar novo salvamento
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current && isOnline) {
        performSave(pendingDataRef.current);
      }
    }, debounceMs);
  }, [enabled, debounceMs, isOnline, performSave]);

  // Forçar salvamento imediato
  const saveNow = useCallback(async () => {
    if (pendingDataRef.current) {
      // Cancelar timeout pendente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return performSave(pendingDataRef.current);
    }
    return false;
  }, [performSave]);

  // Cancelar salvamento pendente
  const cancelPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setHasUnsavedChanges(false);
    setStatus('idle');
  }, []);

  // Marcar como salvo manualmente (após publicação, por exemplo)
  const markAsSaved = useCallback((currentData?: AutoSaveData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setHasUnsavedChanges(false);
    setStatus('saved');
    setLastSavedAt(new Date());
    // Atualizar snapshot para evitar que scheduleAutoSave marque como unsaved
    if (currentData) {
      lastSavedSnapshotRef.current = JSON.stringify(currentData);
    }
  }, []);

  return {
    status,
    lastSavedAt,
    hasUnsavedChanges,
    isOnline,
    scheduleAutoSave,
    saveNow,
    cancelPendingSave,
    markAsSaved,
    isSaving: status === 'saving'
  };
};
