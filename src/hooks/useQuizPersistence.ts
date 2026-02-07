import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logQuizAction } from "@/lib/auditLogger";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRateLimit } from "@/hooks/useRateLimit";
import type { QuizBlock } from "@/types/blocks";
import type { EditorQuestion } from "@/types/quiz";
import type { 
  QuizAppearanceState, 
  QuizFormConfigState, 
  QuizEditorState 
} from "./useQuizState";

// ============================================
// TIPOS
// ============================================

interface UseQuizPersistenceOptions {
  quizId: string | null;
  appearanceState: QuizAppearanceState;
  formConfigState: QuizFormConfigState;
  editorState: QuizEditorState;
  questions: EditorQuestion[];
  updateUI: (updates: Record<string, unknown>) => void;
  updateEditor: (updates: Partial<QuizEditorState>) => void;
  updateAppearance: (updates: Partial<QuizAppearanceState>) => void;
  updateFormConfig: (updates: Partial<QuizFormConfigState>) => void;
  setQuestions: (questions: EditorQuestion[]) => void;
  clearHistory: () => void;
}

// ============================================
// HOOK
// ============================================

export function useQuizPersistence({
  quizId,
  appearanceState,
  formConfigState,
  editorState,
  questions,
  updateUI,
  updateEditor,
  updateAppearance,
  updateFormConfig,
  setQuestions,
  clearHistory,
}: UseQuizPersistenceOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkRateLimit } = useRateLimit();

  // ✅ Helper para isolar localStorage por usuário
  const getStorageKey = useCallback((userId: string, key: string) => {
    return `quiz_${userId}_${key}`;
  }, []);

  // ✅ Hook de AutoSave robusto
  const {
    status: autoSaveStatus,
    lastSavedAt: lastSavedToSupabase,
    hasUnsavedChanges,
    isOnline,
    scheduleAutoSave,
    saveNow: saveAutoSaveNow,
    markAsSaved,
    isSaving: isSavingDraft
  } = useAutoSave({
    debounceMs: 30000,
    enabled: !!quizId,
    showToast: false,
    onSaveComplete: () => {
      console.log('[AutoSave] ✅ Rascunho salvo automaticamente');
    },
    onSaveError: (error) => {
      console.error('[AutoSave] ❌ Erro ao salvar:', error);
    }
  });

  // ✅ Persistir estado em localStorage E agendar autosave no Supabase
  useEffect(() => {
    const saveToLocalStorage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const state = {
        questionCount: editorState.questionCount,
        isPublic: editorState.isPublic,
        ...appearanceState,
        ...formConfigState,
        step: editorState.step,
        questions
      };
      localStorage.setItem(getStorageKey(user.id, 'draft_state'), JSON.stringify(state));
      
      // Agendar autosave no Supabase
      if (quizId) {
        scheduleAutoSave({
          quizId,
          ...appearanceState,
          questionCount: editorState.questionCount,
          isPublic: editorState.isPublic,
          questions,
          formConfig: {
            collectionTiming: formConfigState.collectionTiming,
            collectName: formConfigState.collectName,
            collectEmail: formConfigState.collectEmail,
            collectWhatsapp: formConfigState.collectWhatsapp
          }
        });
      }
    };
    
    const timeoutId = setTimeout(saveToLocalStorage, 300);
    return () => clearTimeout(timeoutId);
  }, [
    editorState.questionCount, editorState.isPublic, editorState.step,
    appearanceState, formConfigState, questions, quizId, 
    scheduleAutoSave, getStorageKey
  ]);

  // ✅ Salvar no Supabase ao fechar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && quizId) {
        e.preventDefault();
        e.returnValue = '';
        
        const payload = JSON.stringify({
          quizId,
          ...appearanceState,
          questions,
          timestamp: new Date().toISOString()
        });
        
        const beaconUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-quiz-draft`;
        navigator.sendBeacon(beaconUrl, payload);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, quizId, appearanceState, questions]);

  // ✅ Carregar quiz existente
  const loadExistingQuiz = useCallback(async (loadQuizId: string) => {
    // Garantir que template selector está oculto e loading ativo ANTES de carregar
    updateUI({ isLoadingQuiz: true, showTemplateSelector: false });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateUI({ isLoadingQuiz: false });
        return;
      }

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', loadQuizId)
        .eq('user_id', user.id)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', loadQuizId)
        .order('order_number', { ascending: true });

      const { data: formConfig } = await supabase
        .from('quiz_form_config')
        .select('*')
        .eq('quiz_id', loadQuizId)
        .maybeSingle();

      // Preencher estados
      updateEditor({
        quizId: loadQuizId,
        questionCount: quiz.question_count,
        isPublic: quiz.is_public,
        abTestActive: quiz.ab_test_active ?? false,
        step: 3,
      });

      updateAppearance({
        title: quiz.title,
        description: quiz.description || '',
        template: quiz.template,
        logoUrl: quiz.logo_url || '',
        showLogo: quiz.show_logo ?? true,
        showTitle: quiz.show_title ?? true,
        showDescription: quiz.show_description ?? true,
        showQuestionNumber: quiz.show_question_number ?? true,
      });

      if (formConfig) {
        updateFormConfig({
          collectName: formConfig.collect_name,
          collectEmail: formConfig.collect_email,
          collectWhatsapp: formConfig.collect_whatsapp,
          collectionTiming: formConfig.collection_timing,
        });
      }

      if (questionsData) {
        setQuestions(questionsData.map((q, idx) => ({
          id: q.id,
          question_text: q.question_text,
          answer_format: q.answer_format,
          options: (q.options as string[]) || [],
          media_url: q.media_url || undefined,
          media_type: q.media_type || undefined,
          order_number: idx,
          custom_label: (q as Record<string, unknown>).custom_label as string || '',
          conditions: q.conditions || null,
          blocks: q.blocks && Array.isArray(q.blocks) && q.blocks.length > 0
            ? (q.blocks as unknown as QuizBlock[])
            : [
                {
                  id: `block-${q.id}-question`,
                  type: 'question' as const,
                  order: 0,
                  questionText: q.question_text,
                  answerFormat: q.answer_format,
                  options: (q.options as string[]) || []
                }
              ]
        })));
      }

      updateUI({ showTemplateSelector: false, isLoadingQuiz: false });
      toast.success(t('createQuiz.quizLoadedEdit'));
    } catch (error) {
      console.error('Error loading quiz:', error);
      updateUI({ isLoadingQuiz: false });
      toast.error(t('createQuiz.errorLoadingQuiz'));
      navigate('/dashboard');
    }
  }, [t, navigate, updateUI, updateEditor, updateAppearance, updateFormConfig, setQuestions]);

  // ✅ Salvar quiz (publicar)
  const saveQuiz = useCallback(async () => {
    const { title, description, template, logoUrl, showLogo, showTitle, showDescription, showQuestionNumber } = appearanceState;
    const { collectionTiming, collectName, collectEmail, collectWhatsapp } = formConfigState;
    const { questionCount, isPublic } = editorState;

    // Validação básica
    if (!title || title.trim() === '') {
      toast.error(t('createQuiz.titleRequired'));
      return false;
    }

    if (questionCount < 1) {
      toast.error(t('createQuiz.minQuestionsRequired'));
      return false;
    }

    if (collectionTiming !== 'none' && !collectName && !collectEmail && !collectWhatsapp) {
      toast.error(t('createQuiz.minFieldRequired'));
      return false;
    }

    try {
      updateUI({ isSaving: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('createQuiz.loginRequired'));
        navigate('/login');
        return false;
      }

      const rateLimitCheck = await checkRateLimit('quiz:create', user.id);
      if (!rateLimitCheck.allowed) {
        updateUI({ isSaving: false });
        return false;
      }

      let quiz;
      const currentQuizId = quizId;

      if (currentQuizId) {
        const { data, error } = await supabase
          .from('quizzes')
          .update({
            title: title || 'Novo Quiz',
            description,
            template,
            logo_url: logoUrl,
            show_logo: showLogo,
            show_title: showTitle,
            show_description: showDescription,
            show_question_number: showQuestionNumber,
            question_count: questionCount,
            is_public: true,
            status: 'active'
          })
          .eq('id', currentQuizId)
          .select()
          .single();
        
        if (error) throw error;
        quiz = data;
        
        logQuizAction("quiz:updated", quiz.id, { title: quiz.title });
      } else {
        // Verificar se é o primeiro quiz do usuário (antes de inserir)
        const { count: existingQuizCount } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');

        const isFirstQuiz = existingQuizCount === 0;

        const { data, error } = await supabase
          .from('quizzes')
          .insert({
            user_id: user.id,
            title: title || t('createQuiz.newQuiz'),
            description,
            template,
            logo_url: logoUrl,
            show_logo: showLogo,
            show_title: showTitle,
            show_description: showDescription,
            show_question_number: showQuestionNumber,
            question_count: questionCount,
            is_public: true,
            status: 'active'
          })
          .select()
          .single();
        
        if (error) throw error;
        quiz = data;
        
        logQuizAction("quiz:created", quiz.id, { title: quiz.title, template });
        
        localStorage.setItem(getStorageKey(user.id, 'current_quiz_id'), quiz.id);

        // Disparar evento GTM se for o primeiro quiz
        if (isFirstQuiz) {
          const w = window as Window & { dataLayer?: Record<string, unknown>[] };
          w.dataLayer = w.dataLayer || [];
          w.dataLayer.push({
            event: 'first_quiz_created',
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            user_id: user.id
          });
          console.log('🎯 [GTM] Event pushed: first_quiz_created');

          // Atualizar estágio do usuário para 'construtor'
          await supabase
            .from('profiles')
            .update({ 
              user_stage: 'construtor',
              stage_updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .eq('user_stage', 'explorador');
          
          console.log('🎯 [PQL] User stage upgraded to construtor');
        }
      }

      updateEditor({ quizId: quiz.id, quizSlug: quiz.slug });

      // Upsert form config
      const { error: formError } = await supabase
        .from('quiz_form_config')
        .upsert({
          quiz_id: quiz.id,
          collection_timing: collectionTiming as 'before' | 'after' | 'none',
          collect_name: collectName,
          collect_email: collectEmail,
          collect_whatsapp: collectWhatsapp
        }, {
          onConflict: 'quiz_id'
        });

      if (formError) throw formError;

      // Save questions
      if (questions.length > 0) {
        if (currentQuizId) {
          const { error: deleteError } = await supabase
            .from('quiz_questions')
            .delete()
            .eq('quiz_id', quiz.id);

          if (deleteError) throw deleteError;
        }

        const questionsToInsert = questions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question_text || '📊 Slide informativo',
          answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
          options: q.options || [],
          order_number: index,
          media_type: q.media_type || null,
          media_url: q.media_url || null,
          blocks: Array.isArray(q.blocks) ? q.blocks : [],
          custom_label: q.custom_label || null
        }));

        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      // Create default result if doesn't exist
      const { data: existingResults } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('quiz_id', quiz.id)
        .limit(1);

      if (!existingResults || existingResults.length === 0) {
        await supabase
          .from('quiz_results')
          .insert({
            quiz_id: quiz.id,
            order_number: 1,
            condition_type: 'always',
            result_text: t('createQuiz.defaultResult.text'),
            button_text: t('createQuiz.defaultResult.button'),
            redirect_url: 'https://example.com'
          });
      }

      toast.success(t('createQuiz.congratsQuizLive'));
      
      markAsSaved();
      localStorage.removeItem(getStorageKey(user.id, 'draft_state'));
      updateUI({ shareDialogOpen: true, isSaving: false });
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CreateQuiz] ❌ Erro ao salvar quiz:', errorMessage);
      toast.error(t('createQuiz.errorPublishing'));
      updateUI({ isSaving: false });
      return false;
    }
  }, [
    appearanceState, formConfigState, editorState, questions, quizId,
    t, navigate, checkRateLimit, updateUI, updateEditor, markAsSaved, getStorageKey
  ]);

  // ✅ Salvar rascunho manualmente
  const saveDraftToSupabase = useCallback(async () => {
    if (!quizId) {
      toast.info("Publique o quiz primeiro para habilitar o salvamento automático");
      return;
    }

    const success = await saveAutoSaveNow();
    if (success) {
      toast.success("Rascunho salvo com sucesso!");
    }
  }, [quizId, saveAutoSaveNow]);

  // ✅ Limpar localStorage
  const clearLocalStorage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.removeItem(getStorageKey(user.id, 'current_quiz_id'));
      localStorage.removeItem(getStorageKey(user.id, 'draft_state'));
    }
  }, [getStorageKey]);

  return {
    // AutoSave
    autoSaveStatus,
    lastSavedToSupabase,
    hasUnsavedChanges,
    isOnline,
    isSavingDraft,
    
    // Actions
    loadExistingQuiz,
    saveQuiz,
    saveDraftToSupabase,
    clearLocalStorage,
    markAsSaved,
    getStorageKey,
  };
}
