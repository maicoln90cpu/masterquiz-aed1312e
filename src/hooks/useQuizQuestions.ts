import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createBlock } from "@/types/blocks";
import type { EditorQuestion } from "@/types/quiz";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

// ============================================
// TIPOS
// ============================================

interface UseQuizQuestionsOptions {
  questions: EditorQuestion[];
  setQuestions: (questions: EditorQuestion[]) => void;
  questionsLimit: number;
  currentQuestionIndex: number;
  updateEditor: (updates: { questionCount?: number; currentQuestionIndex?: number; step?: number }) => void;
  updateUI: (updates: { deleteDialogOpen?: boolean; questionToDelete?: number | null }) => void;
}

// ============================================
// HOOK
// ============================================

export function useQuizQuestions({
  questions,
  setQuestions,
  questionsLimit,
  currentQuestionIndex,
  updateEditor,
  updateUI,
}: UseQuizQuestionsOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkQuestionsPerQuizLimit, getQuestionsPerQuizLimit } = useSubscriptionLimits();

  // ✅ Adicionar pergunta
  const handleAddQuestion = useCallback(async () => {
    const canAdd = await checkQuestionsPerQuizLimit(questions.length);
    
    if (!canAdd) {
      const limit = await getQuestionsPerQuizLimit();
      toast.error(
        t('createQuiz.questionsLimitReached', { limit }),
        {
          action: {
            label: t('pricing.viewPlans'),
            onClick: () => navigate('/pricing')
          }
        }
      );
      return;
    }

    const newQuestion: EditorQuestion = {
      id: `temp-${Date.now()}`,
      question_text: '',
      answer_format: 'single_choice',
      options: [],
      order_number: questions.length,
      blocks: [createBlock('question', 0)]
    };
    
    const newQuestions = [...questions, newQuestion];
    setQuestions(newQuestions);
    
    requestAnimationFrame(() => {
      updateEditor({
        questionCount: newQuestions.length,
        currentQuestionIndex: newQuestions.length - 1,
        step: 2
      });
    });
    
    toast.success(t('createQuiz.questionAdded', { number: newQuestions.length }));
  }, [questions, setQuestions, updateEditor, checkQuestionsPerQuizLimit, getQuestionsPerQuizLimit, t, navigate]);

  // ✅ Abrir diálogo de deletar
  const handleDeleteQuestion = useCallback((index: number) => {
    if (questions.length <= 1) {
      toast.error(t('createQuiz.minOneQuestion'));
      return;
    }
    
    updateUI({ deleteDialogOpen: true, questionToDelete: index });
  }, [questions.length, updateUI, t]);

  // ✅ Confirmar deleção
  const confirmDeleteQuestion = useCallback((questionToDelete: number | null) => {
    if (questionToDelete === null) return;
    
    const updatedQuestions = questions.filter((_, i) => i !== questionToDelete);
    setQuestions(updatedQuestions);
    
    let newIndex = currentQuestionIndex;
    if (currentQuestionIndex >= updatedQuestions.length) {
      newIndex = updatedQuestions.length - 1;
    }
    
    updateEditor({
      questionCount: updatedQuestions.length,
      currentQuestionIndex: newIndex
    });
    
    toast.success(t('createQuiz.questionDeleted', { number: questionToDelete + 1 }));
  }, [questions, currentQuestionIndex, setQuestions, updateEditor, updateUI, t]);

  // ✅ Atualizar uma pergunta específica
  const updateQuestion = useCallback((index: number, updates: Partial<EditorQuestion>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  }, [questions, setQuestions]);

  return {
    handleAddQuestion,
    handleDeleteQuestion,
    confirmDeleteQuestion,
    updateQuestion,
    checkQuestionsPerQuizLimit,
    getQuestionsPerQuizLimit,
  };
}
