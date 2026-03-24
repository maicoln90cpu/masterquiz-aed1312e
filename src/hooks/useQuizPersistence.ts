import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logQuizAction } from "@/lib/auditLogger";
import { pushGTMEvent } from "@/lib/gtmLogger";
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
  /** Whether the user has made real edits (not just auto-generated content) */
  hasUserInteracted?: boolean;
  /** Whether this is express mode (for publish_source tracking) */
  isExpressMode?: boolean;
  /** Editor layout mode — 'modern' fires B-variant events for A/B tracking */
  editorMode?: 'classic' | 'modern';
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
  hasUserInteracted = false,
  isExpressMode = false,
  editorMode = 'classic',
}: UseQuizPersistenceOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkRateLimit } = useRateLimit();

  // ✅ Helper para isolar localStorage por usuário
  const getStorageKey = useCallback((userId: string, key: string) => {
    return `quiz_${userId}_${key}`;
  }, []);

  // ✅ Callbacks estáveis para AutoSave (evita cascata de re-renders)
  const onSaveCompleteStable = useCallback(() => {
    console.log('[AutoSave] ✅ Rascunho salvo automaticamente');
  }, []);

  const onSaveErrorStable = useCallback((error: Error) => {
    console.error('[AutoSave] ❌ Erro ao salvar:', error);
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
    onSaveComplete: onSaveCompleteStable,
    onSaveError: onSaveErrorStable,
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
        showResults: (quiz as any).show_results ?? true,
        progressStyle: ((quiz as any).progress_style as 'bar' | 'counter' | 'none') || 'counter',
        globalTextAlign: ((quiz as any).global_text_align as 'left' | 'center' | 'right') || 'left',
        globalFontSize: ((quiz as any).global_font_size as 'small' | 'medium' | 'large') || 'medium',
        globalFontFamily: ((quiz as any).global_font_family as 'sans' | 'serif' | 'mono') || 'sans',
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
      return { success: false, slug: '' };
    }

    if (questionCount < 1) {
      toast.error(t('createQuiz.minQuestionsRequired'));
      return { success: false, slug: '' };
    }

    if (collectionTiming !== 'none' && !collectName && !collectEmail && !collectWhatsapp) {
      toast.error(t('createQuiz.minFieldRequired'));
      return { success: false, slug: '' };
    }

    try {
      updateUI({ isSaving: true });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('createQuiz.loginRequired'));
        navigate('/login');
        return { success: false, slug: '' };
      }

      const rateLimitCheck = await checkRateLimit('quiz:create', user.id);
      if (!rateLimitCheck.allowed) {
        updateUI({ isSaving: false });
        return { success: false, slug: '' };
      }

      let quiz;
      const currentQuizId = quizId;

      if (currentQuizId) {
        // Helper: generate random express slug client-side for retry
        const generateExpressSlugClient = () => 
          'exp-' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');

        const publishPayload = {
            title: title || 'Novo Quiz',
            description,
            template,
            logo_url: logoUrl,
            show_logo: showLogo,
            show_title: showTitle,
            show_description: showDescription,
            show_question_number: showQuestionNumber,
            show_results: appearanceState.showResults,
            progress_style: appearanceState.progressStyle || 'counter',
            question_count: questionCount,
            is_public: true,
            status: 'active'
          } as any;

        let { data, error } = await supabase
          .from('quizzes')
          .update(publishPayload)
          .eq('id', currentQuizId)
          .select()
          .single();
        
        // Retry once on slug collision (23505) for any quiz
        if (error && error.code === '23505') {
          console.warn('[QuizPersistence] Slug collision on publish, retrying with new slug...');
          const retrySlug = isExpressMode 
            ? generateExpressSlugClient() 
            : null; // null forces trigger to regenerate
          const { data: retryData, error: retryError } = await supabase
            .from('quizzes')
            .update({ ...publishPayload, slug: retrySlug })
            .eq('id', currentQuizId)
            .select()
            .single();
          if (retryError) throw retryError;
          data = retryData;
          error = null;
        }

        if (error) throw error;
        quiz = data;
        
        logQuizAction("quiz:updated", quiz.id, { title: quiz.title });

        // PQL v2: Promoção de estágio + eventos condicionais
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_stage')
            .eq('id', user.id)
            .single();

          const currentStage = profile?.user_stage || 'explorador';
          const earlyStages = ['explorador', 'iniciado', 'engajado'];
          const w = window as Window & { dataLayer?: Record<string, unknown>[] };
          w.dataLayer = w.dataLayer || [];

          // Evento quiz_first_published — 1x ao publicar pela primeira vez
          const publishEventName = editorMode === 'modern' ? 'quiz_first_publishedB' : 'quiz_first_published';
          if (earlyStages.includes(currentStage)) {
            pushGTMEvent(publishEventName, {
              quiz_id: quiz.id,
              quiz_title: quiz.title,
              user_id: user.id,
              publish_source: isExpressMode ? 'express_auto' : 'manual',
              editor_mode: editorMode,
            });
          }

          // first_quiz_created — SOMENTE se houve interação real
          const createEventName = editorMode === 'modern' ? 'first_quiz_createdB' : 'first_quiz_created';
          if (earlyStages.includes(currentStage) && hasUserInteracted) {
            pushGTMEvent(createEventName, {
              quiz_id: quiz.id,
              quiz_title: quiz.title,
              user_id: user.id,
              editor_mode: editorMode,
            });

            // Promover para engajado se ainda não passou
            if (currentStage === 'explorador' || currentStage === 'iniciado') {
              await supabase
                .from('profiles')
                .update({ user_stage: 'engajado', stage_updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .in('user_stage', ['explorador', 'iniciado']);
              console.log('🎯 [PQL] User stage upgraded to engajado (UPDATE branch)');
            }
          }

          // Promover para construtor ao publicar (independente de interação)
          if (earlyStages.includes(currentStage)) {
            await supabase
              .from('profiles')
              .update({ user_stage: 'construtor', stage_updated_at: new Date().toISOString() })
              .eq('id', user.id)
              .in('user_stage', ['explorador', 'iniciado', 'engajado']);
            console.log('🎯 [PQL] User stage upgraded to construtor (UPDATE branch)');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from('onboarding_status')
              .update({ first_quiz_created: true })
              .eq('id', user.id);
          }
        } catch (stageErr) {
          console.warn('⚠️ Failed to update user_stage in UPDATE branch:', stageErr);
        }
      } else {
        // Verificar user_stage para detectar primeiro quiz (mais robusto que contar quizzes)
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_stage')
          .eq('id', user.id)
          .single();

        const currentStage = profile?.user_stage || 'explorador';
        const earlyStages = ['explorador', 'iniciado', 'engajado'];

        let { data, error } = await supabase
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
            show_results: appearanceState.showResults,
            progress_style: appearanceState.progressStyle || 'counter',
            question_count: questionCount,
            is_public: true,
            status: 'active'
          } as any)
          .select()
          .single();
        
        // Retry once on slug collision (23505) for manual quizzes
        if (error && error.code === '23505') {
          console.warn('[QuizPersistence] Slug collision on manual INSERT, retrying with slug: null...');
          const retryResult = await supabase
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
              show_results: appearanceState.showResults,
              progress_style: appearanceState.progressStyle || 'counter',
              question_count: questionCount,
              is_public: true,
              status: 'active',
              slug: null
            } as any)
            .select()
            .single();
          if (retryResult.error) throw retryResult.error;
          data = retryResult.data;
          error = null;
        }

        if (error) throw error;
        quiz = data;
        
        logQuizAction("quiz:created", quiz.id, { title: quiz.title, template });
        
        localStorage.setItem(getStorageKey(user.id, 'current_quiz_id'), quiz.id);

        // PQL v2: Promoção de estágio + eventos condicionais (INSERT branch)
        if (earlyStages.includes(currentStage)) {
          const w = window as Window & { dataLayer?: Record<string, unknown>[] };
          w.dataLayer = w.dataLayer || [];

          // quiz_first_published — sempre ao publicar pela primeira vez
          const publishEventName = editorMode === 'modern' ? 'quiz_first_publishedB' : 'quiz_first_published';
          pushGTMEvent(publishEventName, {
            quiz_id: quiz.id,
            quiz_title: quiz.title,
            user_id: user.id,
            publish_source: isExpressMode ? 'express_auto' : 'manual',
            editor_mode: editorMode,
          });

          // first_quiz_created — SOMENTE se houve interação real
          const createEventName = editorMode === 'modern' ? 'first_quiz_createdB' : 'first_quiz_created';
          if (hasUserInteracted) {
            pushGTMEvent(createEventName, {
              quiz_id: quiz.id,
              quiz_title: quiz.title,
              user_id: user.id,
              editor_mode: editorMode,
            });
          }

          // Promover para construtor ao publicar
          await supabase
            .from('profiles')
            .update({ 
              user_stage: 'construtor',
              stage_updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .in('user_stage', ['explorador', 'iniciado', 'engajado']);
          
          console.log('🎯 [PQL] User stage upgraded to construtor (INSERT branch)');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('onboarding_status')
            .update({ first_quiz_created: true })
            .eq('id', user.id);
          
          console.log('🎯 [Onboarding] first_quiz_created milestone marked');
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

      // Save questions using upsert to preserve IDs
      if (questions.length > 0) {
        const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        // Fetch existing question IDs for this quiz
        const { data: existingQuestions } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('quiz_id', quiz.id);
        
        const existingIds = new Set((existingQuestions || []).map(q => q.id));
        
        // Separate questions into existing (upsert) and new (insert)
        const questionsToUpsert = questions
          .filter(q => isUUID(q.id) && existingIds.has(q.id))
          .map((q, _idx) => ({
            id: q.id,
            quiz_id: quiz.id,
            question_text: q.question_text || '📊 Slide informativo',
            answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
            options: q.options || [],
            order_number: questions.indexOf(q),
            media_type: q.media_type || null,
            media_url: q.media_url || null,
            blocks: Array.isArray(q.blocks) ? q.blocks : [],
            custom_label: q.custom_label || null
          }));
        
        const questionsToInsert = questions
          .filter(q => !isUUID(q.id) || !existingIds.has(q.id))
          .map((q) => ({
            quiz_id: quiz.id,
            question_text: q.question_text || '📊 Slide informativo',
            answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
            options: q.options || [],
            order_number: questions.indexOf(q),
            media_type: q.media_type || null,
            media_url: q.media_url || null,
            blocks: Array.isArray(q.blocks) ? q.blocks : [],
            custom_label: q.custom_label || null
          }));
        
        // Delete questions that were removed by the user
        const currentIds = questions.filter(q => isUUID(q.id)).map(q => q.id);
        const idsToDelete = [...existingIds].filter(id => !currentIds.includes(id));
        
        if (idsToDelete.length > 0) {
          await supabase.from('quiz_questions').delete().in('id', idsToDelete);
        }
        
        // Upsert existing questions (preserves IDs)
        if (questionsToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('quiz_questions')
            .upsert(questionsToUpsert, { onConflict: 'id' });
          if (upsertError) throw upsertError;
        }
        
        // Insert new questions
        if (questionsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('quiz_questions')
            .insert(questionsToInsert);
          if (insertError) throw insertError;
        }
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
      
      markAsSaved({
        quizId: quiz.id,
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
      localStorage.removeItem(getStorageKey(user.id, 'draft_state'));
      updateUI({ shareDialogOpen: true, isSaving: false });
      
      return { success: true, slug: quiz.slug || '' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CreateQuiz] ❌ Erro ao salvar quiz:', errorMessage);
      toast.error(t('createQuiz.errorPublishing'));
      updateUI({ isSaving: false });
      return { success: false, slug: '' };
    }
  }, [
    appearanceState, formConfigState, editorState, questions, quizId,
    t, navigate, checkRateLimit, updateUI, updateEditor, markAsSaved, getStorageKey,
    hasUserInteracted, isExpressMode
  ]);

  // ✅ Salvar rascunho manualmente (save direto, não depende do auto-save)
  const saveDraftToSupabase = useCallback(async () => {
    if (!quizId) {
      toast.info("Publique o quiz primeiro para habilitar o salvamento automático");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Atualizar metadados do quiz (mantém status atual)
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: appearanceState.title || 'Novo Quiz',
          description: appearanceState.description,
          template: appearanceState.template,
          logo_url: appearanceState.logoUrl,
          show_logo: appearanceState.showLogo,
          show_title: appearanceState.showTitle,
          show_description: appearanceState.showDescription,
          show_question_number: appearanceState.showQuestionNumber,
          progress_style: appearanceState.progressStyle || 'counter',
          show_results: appearanceState.showResults !== false,
          question_count: editorState.questionCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId)
        .eq('user_id', user.id);

      if (quizError) throw quizError;

      // Atualizar form config
      await supabase
        .from('quiz_form_config')
        .upsert({
          quiz_id: quizId,
          collection_timing: formConfigState.collectionTiming as 'before' | 'after' | 'none',
          collect_name: formConfigState.collectName,
          collect_email: formConfigState.collectEmail,
          collect_whatsapp: formConfigState.collectWhatsapp
        }, { onConflict: 'quiz_id' });

      // Salvar perguntas (upsert para preservar IDs)
      if (questions.length > 0) {
        const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        const { data: existingQ } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('quiz_id', quizId);
        
        const existingIds = new Set((existingQ || []).map(q => q.id));
        
        const toUpsert = questions
          .filter(q => isUUID(q.id) && existingIds.has(q.id))
          .map((q) => ({
            id: q.id,
            quiz_id: quizId,
            question_text: q.question_text || '📊 Slide informativo',
            answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
            options: q.options || [],
            order_number: questions.indexOf(q),
            media_type: q.media_type || null,
            media_url: q.media_url || null,
            blocks: Array.isArray(q.blocks) ? q.blocks : [],
            custom_label: q.custom_label || null
          }));
        
        const toInsert = questions
          .filter(q => !isUUID(q.id) || !existingIds.has(q.id))
          .map((q) => ({
            quiz_id: quizId,
            question_text: q.question_text || '📊 Slide informativo',
            answer_format: (q.answer_format || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
            options: q.options || [],
            order_number: questions.indexOf(q),
            media_type: q.media_type || null,
            media_url: q.media_url || null,
            blocks: Array.isArray(q.blocks) ? q.blocks : [],
            custom_label: q.custom_label || null
          }));
        
        const currentIds = questions.filter(q => isUUID(q.id)).map(q => q.id);
        const idsToDelete = [...existingIds].filter(id => !currentIds.includes(id));
        
        if (idsToDelete.length > 0) {
          await supabase.from('quiz_questions').delete().in('id', idsToDelete);
        }
        
        if (toUpsert.length > 0) {
          const { error: uE } = await supabase.from('quiz_questions').upsert(toUpsert, { onConflict: 'id' });
          if (uE) throw uE;
        }
        
        if (toInsert.length > 0) {
          const { error: iE } = await supabase.from('quiz_questions').insert(toInsert);
          if (iE) throw iE;
        }
      }

      markAsSaved({
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
      toast.success("Salvo com sucesso!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[SaveDraft] ❌ Erro:', msg);
      toast.error("Erro ao salvar: " + msg);
    }
  }, [quizId, appearanceState, formConfigState, editorState.questionCount, questions, markAsSaved]);

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
