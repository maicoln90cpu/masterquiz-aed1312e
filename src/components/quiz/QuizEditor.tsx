import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { QuizBlock } from "@/types/blocks";
import { createBlock } from "@/types/blocks";
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
  blocks: QuizBlock[];
  custom_label?: string;
}

interface QuizEditorState {
  questions: Question[];
  currentQuestionIndex: number;
  questionCount: number;
  questionsLimit: number;
}

interface QuizEditorActions {
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setQuestionCount: (count: number) => void;
  handleAddQuestion: () => Promise<void>;
  handleDeleteQuestion: (index: number) => void;
  handleDuplicateQuestion: (index: number) => Promise<void>;
  handleQuestionClick: (index: number) => void;
  updateCurrentQuestionBlocks: (blocks: QuizBlock[]) => void;
  initializeEmptyQuestions: (count: number) => Question[];
}

interface UseQuizEditorProps {
  questionsLimit: number;
  checkQuestionsPerQuizLimit: (currentCount: number) => Promise<boolean>;
  onNavigateToStep: (step: number) => void;
  onQuestionsUpdate: (questions: Question[]) => void;
}

export const useQuizEditor = ({
  questionsLimit,
  checkQuestionsPerQuizLimit,
  onNavigateToStep,
  onQuestionsUpdate
}: UseQuizEditorProps): [QuizEditorState, QuizEditorActions] => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  const initializeEmptyQuestions = (count: number): Question[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `temp-${index}`,
      question_text: '',
      answer_format: 'single_choice' as AnswerFormat,
      options: [],
      blocks: [
        {
          id: `block-${index}-question`,
          type: 'question',
          order: 0,
          questionText: '',
          options: [],
          answerFormat: 'single_choice' as AnswerFormat
        }
      ]
    }));
  };

  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
    onNavigateToStep(2);
  };

  const handleAddQuestion = async () => {
    const canAdd = await checkQuestionsPerQuizLimit(questions.length);
    
    if (!canAdd) {
      toast.error(
        t('createQuiz.questionsLimitReached', { limit: questionsLimit }),
        {
          action: {
            label: t('pricing.viewPlans'),
            onClick: () => window.location.href = '/pricing'
          }
        }
      );
      return;
    }

    const newQuestion: Question = {
      id: `temp-${questions.length}`,
      question_text: '',
      answer_format: 'single_choice' as AnswerFormat,
      options: [],
      blocks: [
        {
          id: `block-${questions.length}-question`,
          type: 'question',
          order: 0,
          questionText: '',
          options: [],
          answerFormat: 'single_choice' as AnswerFormat
        }
      ]
    };
    
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setQuestionCount(updatedQuestions.length);
    setCurrentQuestionIndex(questions.length);
    onNavigateToStep(2);
    onQuestionsUpdate(updatedQuestions);
    
    toast.success(t('createQuiz.questionAdded', { number: questions.length + 1 }));
  };

  const handleDuplicateQuestion = async (index: number) => {
    const canAdd = await checkQuestionsPerQuizLimit(questions.length);
    
    if (!canAdd) {
      toast.error(
        t('createQuiz.questionsLimitReached', { limit: questionsLimit }),
        {
          action: {
            label: t('pricing.viewPlans'),
            onClick: () => window.location.href = '/pricing'
          }
        }
      );
      return;
    }

    const questionToDuplicate = questions[index];
    const duplicatedQuestion: Question = {
      ...questionToDuplicate,
      id: `temp-${Date.now()}`,
      blocks: questionToDuplicate.blocks.map((block, idx) => ({
        ...block,
        id: `block-${Date.now()}-${idx}`,
        order: idx
      }))
    };
    
    const updatedQuestions = [
      ...questions.slice(0, index + 1),
      duplicatedQuestion,
      ...questions.slice(index + 1)
    ];
    
    setQuestions(updatedQuestions);
    setQuestionCount(updatedQuestions.length);
    setCurrentQuestionIndex(index + 1);
    onQuestionsUpdate(updatedQuestions);
    
    toast.success(t('createQuiz.questionDuplicated', { number: index + 2 }));
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error(t('createQuiz.minOneQuestion'));
      return;
    }
    
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    setQuestionCount(updatedQuestions.length);
    
    if (currentQuestionIndex >= updatedQuestions.length) {
      setCurrentQuestionIndex(updatedQuestions.length - 1);
    }
    
    onQuestionsUpdate(updatedQuestions);
    toast.success(t('createQuiz.questionDeleted', { number: index + 1 }));
  };

  const updateCurrentQuestionBlocks = (updatedBlocks: QuizBlock[]) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      blocks: updatedBlocks
    };
    setQuestions(updatedQuestions);
    onQuestionsUpdate(updatedQuestions);
  };

  const state: QuizEditorState = {
    questions,
    currentQuestionIndex,
    questionCount,
    questionsLimit
  };

  const actions: QuizEditorActions = {
    setQuestions,
    setCurrentQuestionIndex,
    setQuestionCount,
    handleAddQuestion,
    handleDeleteQuestion,
    handleDuplicateQuestion,
    handleQuestionClick,
    updateCurrentQuestionBlocks,
    initializeEmptyQuestions
  };

  return [state, actions];
};
