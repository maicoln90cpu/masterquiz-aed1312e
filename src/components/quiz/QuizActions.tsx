import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { logQuizAction } from "@/lib/auditLogger";
import type { QuizSettingsState } from "./QuizSettings";
import type { Database } from "@/integrations/supabase/types";

type AnswerFormat = Database['public']['Enums']['answer_format'];
type MediaType = Database['public']['Enums']['media_type'];

interface Question {
  id: string;
  question_text: string;
  answer_format: AnswerFormat;
  options: any[];
  media_url?: string;
  media_type?: MediaType | null;
  blocks: any[];
}

interface QuizActionsProps {
  quizId: string | null;
  setQuizId: (id: string) => void;
  setQuizSlug: (slug: string) => void;
  questions: Question[];
  settings: QuizSettingsState;
  questionCount: number;
  checkRateLimit: (action: string, identifier: string) => Promise<{ allowed: boolean }>;
  getStorageKey: (userId: string, key: string) => string;
}

export const useQuizActions = ({
  quizId,
  setQuizId,
  setQuizSlug,
  questions,
  settings,
  questionCount,
  checkRateLimit,
  getStorageKey
}: QuizActionsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedToSupabase, setLastSavedToSupabase] = useState<Date | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const validateQuiz = () => {
    if (!settings.title || settings.title.trim() === '') {
      toast.error(t('createQuiz.titleRequired'));
      return false;
    }

    if (questionCount < 1) {
      toast.error(t('createQuiz.minQuestionsRequired'));
      return false;
    }

    if (settings.collectionTiming !== 'none' && !settings.collectName && !settings.collectEmail && !settings.collectWhatsapp) {
      toast.error(t('createQuiz.minFieldRequired'));
      return false;
    }

    return true;
  };

  const saveDraftToSupabase = async () => {
    if (!quizId) {
      toast.info(t('components.quizActions.publishFirst'));
      return;
    }

    try {
      setIsSavingDraft(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('quizzes')
        .update({
          title: settings.title || 'Novo Quiz',
          description: settings.description,
          template: settings.template,
          logo_url: settings.logoUrl,
          show_logo: settings.showLogo,
          show_title: settings.showTitle,
          show_description: settings.showDescription,
          show_question_number: settings.showQuestionNumber,
          question_count: questionCount,
          is_public: settings.isPublic
        })
        .eq('id', quizId);

      await supabase
        .from('quiz_form_config')
        .upsert({
          quiz_id: quizId,
          collection_timing: settings.collectionTiming as any,
          collect_name: settings.collectName,
          collect_email: settings.collectEmail,
          collect_whatsapp: settings.collectWhatsapp
        }, {
          onConflict: 'quiz_id'
        });

      if (questions.length > 0) {
        const questionsToSave = questions.map((q, idx) => ({
          id: q.id?.startsWith('temp-') ? undefined : q.id,
          quiz_id: quizId,
          question_text: q.question_text || '',
          order_number: idx + 1,
          answer_format: (q.answer_format || 'single_choice') as AnswerFormat,
          options: q.options || [],
          media_url: q.media_url || null,
          media_type: q.media_type || null,
          blocks: Array.isArray(q.blocks) ? q.blocks : []
        }));

        await supabase
          .from('quiz_questions')
          .upsert(questionsToSave, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
      }

      setHasUnsavedChanges(false);
      setLastSavedToSupabase(new Date());
      toast.success(t('components.quizActions.draftSaved'));
    } catch (error: any) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error(t('components.quizActions.draftError') + ': ' + error.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const saveQuiz = async () => {
    if (!validateQuiz()) {
      return;
    }

    console.log('[QuizActions] 🚀 Iniciando salvamento do quiz');

    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('createQuiz.loginRequired'));
        navigate('/login');
        return;
      }

      const rateLimitCheck = await checkRateLimit('quiz:create', user.id);
      if (!rateLimitCheck.allowed) {
        setIsSaving(false);
        return;
      }

      let quiz;
      if (quizId) {
        const { data, error } = await supabase
          .from('quizzes')
          .update({
            title: settings.title || 'Novo Quiz',
            description: settings.description,
            template: settings.template,
            logo_url: settings.logoUrl,
            show_logo: settings.showLogo,
            show_title: settings.showTitle,
            show_description: settings.showDescription,
            show_question_number: settings.showQuestionNumber,
            question_count: questionCount,
            is_public: true,
            status: 'active'
          })
          .eq('id', quizId)
          .select()
          .single();
        
        if (error) throw error;
        quiz = data;
        setQuizSlug(quiz.slug);
        
        logQuizAction("quiz:updated", quiz.id, { title: quiz.title });
      } else {
        const { data, error } = await supabase
          .from('quizzes')
          .insert({
            user_id: user.id,
            title: settings.title || t('createQuiz.newQuiz'),
            description: settings.description,
            template: settings.template,
            logo_url: settings.logoUrl,
            show_logo: settings.showLogo,
            show_title: settings.showTitle,
            show_description: settings.showDescription,
            show_question_number: settings.showQuestionNumber,
            question_count: questionCount,
            is_public: true,
            status: 'active'
          })
          .select()
          .single();
        
        if (error) throw error;
        quiz = data;
        setQuizId(quiz.id);
        setQuizSlug(quiz.slug);
        
        logQuizAction("quiz:created", quiz.id, { title: quiz.title, template: settings.template });
        
        localStorage.setItem(getStorageKey(user.id, 'current_quiz_id'), quiz.id);
      }

      const { error: formError } = await supabase
        .from('quiz_form_config')
        .upsert({
          quiz_id: quiz.id,
          collection_timing: settings.collectionTiming as any,
          collect_name: settings.collectName,
          collect_email: settings.collectEmail,
          collect_whatsapp: settings.collectWhatsapp
        }, {
          onConflict: 'quiz_id'
        });

      if (formError) throw formError;

      if (questions.length > 0) {
        if (quizId) {
          await supabase
            .from('quiz_questions')
            .delete()
            .eq('quiz_id', quiz.id);
        }

        const questionsToInsert = questions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question_text || '📊 Slide informativo',
          answer_format: (q.answer_format || 'single_choice') as AnswerFormat,
          options: q.options || [],
          order_number: index,
          media_type: q.media_type || null,
          media_url: q.media_url || null,
          blocks: Array.isArray(q.blocks) ? q.blocks : []
        }));

        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

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
      
      setHasUnsavedChanges(false);
      setLastSavedToSupabase(new Date());
      localStorage.removeItem(getStorageKey(user.id, 'draft_state'));
      setShareDialogOpen(true);
    } catch (error: any) {
      console.error('[QuizActions] ❌ Erro ao salvar quiz:', error);
      toast.error(t('createQuiz.errorPublishing'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    isSavingDraft,
    hasUnsavedChanges,
    lastSavedToSupabase,
    shareDialogOpen,
    setHasUnsavedChanges,
    setShareDialogOpen,
    saveQuiz,
    saveDraftToSupabase
  };
};
