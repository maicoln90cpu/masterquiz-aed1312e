import { useState, useMemo, useEffect, useRef } from 'react';
import { evaluateConditions } from '@/lib/conditionEvaluator';
import type { EditorQuestion } from '@/types/quiz';
import type { QuizBlock } from '@/types/blocks';

export type DeviceMode = 'mobile' | 'tablet' | 'desktop';
export type PreviewStep = 'intro' | 'quiz' | 'form' | 'result';

export interface QuizResult {
  id?: string;
  result_text: string;
  condition_type: 'always' | 'score_range' | 'specific_answers';
  min_score?: number;
  max_score?: number;
  button_text?: string;
  redirect_url?: string;
  image_url?: string;
  video_url?: string;
}

export interface FormConfig {
  collect_name: boolean;
  collect_email: boolean;
  collect_whatsapp: boolean;
  collection_timing?: 'none' | 'before' | 'after' | 'both';
}

export interface FormData {
  name: string;
  email: string;
  whatsapp: string;
}

interface UseQuizPreviewStateOptions {
  questions: EditorQuestion[];
  showIntroScreen?: boolean;
  showFormScreen?: boolean;
  showResultScreen?: boolean;
  formConfig: FormConfig;
  results?: QuizResult[];
  externalQuestionIndex?: number;
}

export const useQuizPreviewState = ({
  questions,
  showIntroScreen = false,
  showFormScreen = true,
  showResultScreen = true,
  formConfig,
  results = [],
  externalQuestionIndex
}: UseQuizPreviewStateOptions) => {
  // State
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('mobile');
  // When externalQuestionIndex is provided, skip intro and go directly to quiz step
  const [currentStep, setCurrentStep] = useState<PreviewStep>(
    externalQuestionIndex !== undefined ? 'quiz' : (showIntroScreen ? 'intro' : 'quiz')
  );
  const [internalQuestionIndex, setInternalQuestionIndex] = useState(externalQuestionIndex ?? 0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', whatsapp: '' });
  const [totalScore, setTotalScore] = useState(0);

  // Sync with external question index (editor sidebar click)
  const prevExternalIndex = useRef(externalQuestionIndex);
  useEffect(() => {
    if (externalQuestionIndex !== undefined && externalQuestionIndex !== prevExternalIndex.current) {
      setInternalQuestionIndex(externalQuestionIndex);
      setCurrentStep('quiz');
      prevExternalIndex.current = externalQuestionIndex;
    }
  }, [externalQuestionIndex]);

  // Computed values - always use internal (allows free navigation in preview)
  const currentQuestionIndex = internalQuestionIndex;
  
  // Filter visible questions based on conditions (branching)
  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (!(question as any).conditions) return true;
      return evaluateConditions((question as any).conditions, selectedAnswers);
    });
  }, [questions, selectedAnswers]);

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = visibleQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / visibleQuestions.length) * 100 
    : 0;

  // Sort blocks by order
  const sortedBlocks = useMemo(() => {
    if (!currentQuestion?.blocks) return [];
    return [...currentQuestion.blocks].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) as QuizBlock[];
  }, [currentQuestion?.blocks]);

  // Get question block for metadata
  const questionBlock = useMemo(() => {
    return sortedBlocks.find((b: any) => b.type === 'question') as any;
  }, [sortedBlocks]);

  // Helper to get question data
  const getQuestionData = (question: EditorQuestion, t: (key: string, fallback: string) => string) => {
    const qBlock = question.blocks?.find((b: any) => b.type === 'question') as any;
    return {
      questionText: qBlock?.questionText || question.question_text || '',
      answerFormat: qBlock?.answerFormat || question.answer_format || 'single_choice',
      nextButtonText: qBlock?.nextButtonText || t('preview.next', 'Próxima'),
      options: (qBlock?.options?.length > 0 ? qBlock.options : question.options) || [],
      scores: qBlock?.scores || [],
      autoAdvance: qBlock?.autoAdvance || false
    };
  };

  // Calculate score
  const calculateScore = (answers: Record<string, string | string[]>, t: (key: string, fallback: string) => string) => {
    let score = 0;
    questions.forEach((question) => {
      const { options, scores } = getQuestionData(question, t);
      const answer = answers[question.id];
      if (!answer) return;

      if (Array.isArray(answer)) {
        answer.forEach((selectedOption) => {
          const optionIndex = options.indexOf(selectedOption);
          if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
            score += scores[optionIndex];
          }
        });
      } else {
        const optionIndex = options.indexOf(answer);
        if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
          score += scores[optionIndex];
        }
      }
    });
    return score;
  };

  // Get final result based on score
  const getFinalResult = (t: (key: string, fallback: string) => string): QuizResult => {
    if (results.length === 0) {
      return {
        result_text: t('preview.thankYou', 'Obrigado por completar o quiz!'),
        condition_type: 'always',
        button_text: t('preview.continue', 'Continuar')
      };
    }

    // Mesma prioridade do quiz público: primeiro faixa de pontuação, depois resultado padrão.
    const scoreRangeResult = results.find(r => {
      if (r.condition_type !== 'score_range') return false;
      const min = r.min_score ?? 0;
      const max = r.max_score ?? Infinity;
      return totalScore >= min && totalScore <= max;
    });

    return scoreRangeResult || results.find(r => r.condition_type === 'always') || results[0];
  };

  // Answer selection handler
  const handleAnswerSelect = (value: string, isMultiple: boolean, t: (key: string, fallback: string) => string, onAutoAdvance?: () => void) => {
    if (!currentQuestion) return;
    
    let newAnswers: Record<string, string | string[]>;
    
    if (isMultiple) {
      const current = (selectedAnswers[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(a => a !== value)
        : [...current, value];
      newAnswers = { ...selectedAnswers, [currentQuestion.id]: updated };
    } else {
      newAnswers = { ...selectedAnswers, [currentQuestion.id]: value };
    }
    
    setSelectedAnswers(newAnswers);
    setTotalScore(calculateScore(newAnswers, t));

    // Auto-advance for single choice
    const questionData = getQuestionData(currentQuestion, t);
    if (questionData.autoAdvance && !isMultiple && onAutoAdvance) {
      setTimeout(() => onAutoAdvance(), 400);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setInternalQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Check if form should be shown
      const shouldShowForm = showFormScreen && 
        (formConfig.collection_timing === 'after' || formConfig.collection_timing === 'both');
      const hasFormFields = formConfig.collect_name || formConfig.collect_email || formConfig.collect_whatsapp;
      
      if (shouldShowForm && hasFormFields) {
        setCurrentStep('form');
      } else if (showResultScreen) {
        setCurrentStep('result');
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setInternalQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStartQuiz = () => {
    const shouldShowFormBefore = showFormScreen && 
      (formConfig.collection_timing === 'before' || formConfig.collection_timing === 'both');
    const hasFormFields = formConfig.collect_name || formConfig.collect_email || formConfig.collect_whatsapp;
    
    if (shouldShowFormBefore && hasFormFields) {
      setCurrentStep('form');
    } else {
      setCurrentStep('quiz');
    }
  };

  const handleFormSubmit = () => {
    if (currentStep === 'form' && formConfig.collection_timing === 'before') {
      setCurrentStep('quiz');
    } else if (showResultScreen) {
      setCurrentStep('result');
    }
  };

  const handleRestart = () => {
    setCurrentStep(showIntroScreen ? 'intro' : 'quiz');
    setInternalQuestionIndex(0);
    setSelectedAnswers({});
    setFormData({ name: '', email: '', whatsapp: '' });
    setTotalScore(0);
  };

  const isAnswered = currentQuestion 
    ? !!selectedAnswers[currentQuestion.id]
    : false;

  // Handle text answer for short_text questions
  const handleTextAnswer = (questionId: string, text: string) => {
    const newAnswers = { ...selectedAnswers, [questionId]: text };
    setSelectedAnswers(newAnswers);
  };

  return {
    // State
    deviceMode,
    setDeviceMode,
    currentStep,
    setCurrentStep,
    currentQuestionIndex,
    setInternalQuestionIndex,
    selectedAnswers,
    formData,
    setFormData,
    totalScore,
    
    // Computed
    visibleQuestions,
    currentQuestion,
    progress,
    sortedBlocks,
    questionBlock,
    isAnswered,
    
    // Helpers
    getQuestionData,
    calculateScore,
    getFinalResult,
    
    // Handlers
    handleAnswerSelect,
    handleTextAnswer,
    handleNext,
    handlePrevious,
    handleStartQuiz,
    handleFormSubmit,
    handleRestart
  };
};
