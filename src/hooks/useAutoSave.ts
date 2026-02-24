import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<AutoSaveData | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');

  // Verificar se está online
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Função que efetivamente salva no Supabase
  const performSave = useCallback(async (data: AutoSaveData): Promise<boolean> => {
    if (!data.quizId || isSavingRef.current) return false;

    // ✅ Dedup: skip save if payload hasn't changed
    const snapshot = JSON.stringify(data);
    if (snapshot === lastSavedSnapshotRef.current) {
      console.log('[AutoSave] ⏭️ Payload não mudou, pulando save');
      return true;
    }

    try {
      isSavingRef.current = true;
      setStatus('saving');
      onSaveStart?.();

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
      onSaveComplete?.();

      if (showToast) {
        toast.success('Rascunho salvo automaticamente');
      }

      return true;
    } catch (error: any) {
      console.error('[AutoSave] Erro ao salvar:', error);
      setStatus('error');
      onSaveError?.(error);

      if (showToast) {
        toast.error('Erro ao salvar rascunho: ' + error.message);
      }

      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [onSaveStart, onSaveComplete, onSaveError, showToast]);

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
  const markAsSaved = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setHasUnsavedChanges(false);
    setStatus('saved');
    setLastSavedAt(new Date());
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
