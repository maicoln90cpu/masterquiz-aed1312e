import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRateLimit } from "@/hooks/useRateLimit";
import { fetchIPWithCache } from "@/lib/ipCache";
import { evaluateConditions } from "@/lib/conditionEvaluator";
import { useABTest } from "@/hooks/useABTest";
import { calculateQuizResult } from "@/lib/calculatorEngine";
import { loadQuizForDisplay } from "@/hooks/useQuizViewRPC";
import type { 
  Quiz, 
  QuizQuestion, 
  QuizResult, 
  QuizFormConfig, 
  CustomField, 
  Profile
} from "@/types/quiz";

export interface PreviewData {
  quiz: Quiz | null;
  questions: QuizQuestion[];
  results: QuizResult[];
  formConfig: QuizFormConfig | null;
  customFields: CustomField[];
  ownerProfile: Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null;
}

export interface CalculatorResultType {
  rawValue: number;
  formattedValue: string;
  range?: { min: number; max: number; label: string; description: string };
}

interface UseQuizViewStateProps {
  slug?: string;
  company?: string;
  previewMode: boolean;
  previewData?: PreviewData;
}

export function useQuizViewState({
  slug,
  company,
  previewMode,
  previewData
}: UseQuizViewStateProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { checkRateLimit } = useRateLimit();
  
  // State
  const [loading, setLoading] = useState(!previewMode);
  const [quiz, setQuiz] = useState<Quiz | null>(previewData?.quiz || null);
  const [quizOwnerProfile, setQuizOwnerProfile] = useState<Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null>(previewData?.ownerProfile || null);
  const [questions, setQuestions] = useState<QuizQuestion[]>(previewData?.questions || []);
  const [results, setResults] = useState<QuizResult[]>(previewData?.results || []);
  const [formConfig, setFormConfig] = useState<QuizFormConfig | null>(previewData?.formConfig || null);
  const [customFields, setCustomFields] = useState<CustomField[]>(previewData?.customFields || []);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResultType | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['pt']);
  const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(previewData?.quiz || null);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // A/B Testing
  const { variant: abVariant, markConversion } = useABTest(
    quiz?.id, 
    (quiz as any)?.ab_test_active || false
  );

  // Visible questions based on conditions (branching)
  const visibleQuestions = questions.filter((question) => {
    if (!(question as any).conditions) return true;
    return evaluateConditions((question as any).conditions, answers);
  });

  const currentQuestion = visibleQuestions[currentStep];

  // Load quiz on mount (non-preview mode)
  useEffect(() => {
    if (!previewMode) {
      loadQuiz();
    }
  }, [slug, previewMode]);

  // Load translations when language changes
  useEffect(() => {
    if (quiz && selectedLanguage !== 'pt') {
      loadTranslations();
    } else if (originalQuiz) {
      setQuiz(originalQuiz);
    }
  }, [selectedLanguage]);

  const loadTranslations = async () => {
    if (!quiz || selectedLanguage === 'pt') return;

    try {
      const { data: quizTrans } = await supabase
        .from('quiz_translations')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('language_code', selectedLanguage)
        .maybeSingle();

      if (quizTrans) {
        setQuiz({
          ...quiz,
          title: quizTrans.title,
          description: quizTrans.description
        });
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const loadQuiz = async () => {
    try {
      // Usar RPC com fallback automático
      const result = await loadQuizForDisplay(slug || '', company);
      
      if (!result.success) {
        if (result.error === 'company_not_found') {
          console.error('[QuizView] Company not found:', company);
          toast.error(t('quizView.companyNotFound', 'Empresa não encontrada'));
          navigate('/');
          return;
        }
        if (result.error === 'quiz_not_found') {
          toast.error(t('quizView.notFound'));
          navigate('/');
          return;
        }
        throw new Error(result.error);
      }

      const data = result.data!;
      
      // Setar todos os estados de uma vez
      setQuiz(data.quiz);
      setOriginalQuiz(data.quiz);
      setQuestions(data.questions);
      setResults(data.results);
      setFormConfig(data.formConfig);
      setCustomFields(data.customFields);
      setQuizOwnerProfile(data.ownerProfile);

      // Configurar idiomas disponíveis
      if (data.translations && data.translations.length > 0) {
        const langs = ['pt', ...data.translations];
        setAvailableLanguages(langs);

        const browserLang = navigator.language.split('-')[0];
        if (langs.includes(browserLang) && browserLang !== 'pt') {
          setSelectedLanguage(browserLang);
        }
      }

      // Track view event (pode continuar assíncrono)
      supabase.functions.invoke('track-quiz-analytics', {
        body: { quizId: data.quiz.id, event: 'view' }
      }).catch(err => console.warn('View tracking failed:', err));

      // Track funnel step 0
      supabase.functions.invoke('track-quiz-step', {
        body: { 
          quizId: data.quiz.id, 
          sessionId,
          stepNumber: 0,
          questionId: null
        }
      }).catch(err => console.warn('Initial step tracking failed:', err));

      setLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error(t('quizView.notFound'));
      navigate('/');
    }
  };

  // Track if auto-submit has been triggered to prevent duplicates
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Calculate score in real-time
    let score = 0;
    questions.forEach((question) => {
      const questionBlock = question.blocks?.find((b: any) => b.type === 'question') as any;
      if (!questionBlock) return;
      
      const answer = newAnswers[question.id];
      if (!answer) return;
      
      const options = questionBlock.options || [];
      const scores = questionBlock.scores || [];
      
      if (questionBlock.answerFormat === 'multiple_choice' && Array.isArray(answer)) {
        answer.forEach((selectedOption: string) => {
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
    
    setTotalScore(score);

    // Auto-submit when show_results=false on last question (single/yes_no only)
    const quizShowResults = (quiz as any)?.show_results !== false;
    if (!quizShowResults && !autoSubmitted) {
      const isLastVisible = currentStep === visibleQuestions.length - 1;
      const currentQ = visibleQuestions[currentStep];
      if (isLastVisible && currentQ?.id === questionId) {
        const questionBlock = currentQ.blocks?.find((b: any) => b.type === 'question') as any;
        const answerFormat = questionBlock?.answerFormat || currentQ.answer_format;
        // For single_choice/yes_no, auto-submit immediately after selecting
        // For multiple_choice/short_text, user needs to confirm (keep button visible)
        if (answerFormat === 'single_choice' || answerFormat === 'yes_no') {
          setAutoSubmitted(true);
          // Small delay so user sees their selection
          setTimeout(() => {
            submitQuizSilent(newAnswers, score);
          }, 600);
        }
      }
    }
  };

  const nextStep = async () => {
    const nextStepNumber = currentStep + 1;
    
    if (currentStep === 0 && questions.length > 0 && quiz) {
      await supabase.functions.invoke('track-quiz-analytics', {
        body: { quizId: quiz.id, event: 'start' }
      });
    }

    // Track funnel step
    if (!previewMode && quiz?.id) {
      const currentQ = visibleQuestions[currentStep];
      supabase.functions.invoke('track-quiz-step', {
        body: { 
          quizId: quiz.id, 
          sessionId,
          stepNumber: nextStepNumber,
          questionId: currentQ?.id || null
        }
      }).catch(err => console.warn('Step tracking failed:', err));
    }

    setCurrentStep(nextStepNumber);
  };

  const prevStep = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const submitQuiz = async (overrideAnswers?: Record<string, any>, overrideScore?: number) => {
    if (!quiz) return;
    
    const finalAnswers = overrideAnswers || answers;
    
    try {
      const ipAddress = await fetchIPWithCache(3000) || 'unknown';
      
      const rateLimitCheck = await checkRateLimit('quiz:submit', ipAddress);
      if (!rateLimitCheck.allowed) {
        return;
      }

      // Track final step (P10 fix)
      if (!previewMode && quiz.id) {
        const lastQ = visibleQuestions[visibleQuestions.length - 1];
        supabase.functions.invoke('track-quiz-step', {
          body: { 
            quizId: quiz.id, 
            sessionId,
            stepNumber: visibleQuestions.length,
            questionId: lastQ?.id || null
          }
        }).catch(err => console.warn('Final step tracking failed:', err));
      }

      // Check response limit for quiz owner
      const { data: ownerSub } = await supabase
        .from('user_subscriptions')
        .select('response_limit')
        .eq('user_id', quiz.user_id)
        .single();

      if (ownerSub?.response_limit) {
        const { data: ownerQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('user_id', quiz.user_id);

        const ownerQuizIds = ownerQuizzes?.map(q => q.id) || [];

        if (ownerQuizIds.length > 0) {
          const { count: totalResponses } = await supabase
            .from('quiz_responses')
            .select('id', { count: 'exact', head: true })
            .in('quiz_id', ownerQuizIds);

          if (totalResponses !== null && totalResponses >= ownerSub.response_limit) {
            toast.error(t('quizView.responseLimitReached', 'Este quiz atingiu o limite de respostas do plano'));
            return;
          }
        }
      }

      const { quizResponseSchema } = await import('@/lib/validations');
      const validationResult = quizResponseSchema.safeParse({
        name: formData.name || '',
        email: formData.email || '',
        whatsapp: formData.whatsapp || '',
        customFields: formData
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0].message;
        toast.error(errorMessage);
        return;
      }

      // Calculate score
      let calculatedScore = overrideScore ?? 0;
      if (overrideScore === undefined) {
        Object.entries(finalAnswers).forEach(([questionId, selectedAnswer]) => {
          const question = questions.find(q => q.id === questionId);
          if (!question || !question.blocks) return;
          
          const questionBlock = question.blocks.find((b: any) => b.type === 'question') as any;
          if (!questionBlock) return;
          
          const options = questionBlock.options || [];
          const scores = questionBlock.scores || [];
          
          if (questionBlock.answerFormat === 'multiple_choice' && Array.isArray(selectedAnswer)) {
            selectedAnswer.forEach((selected: string) => {
              const optionIndex = options.indexOf(selected);
              if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
                calculatedScore += scores[optionIndex];
              }
            });
          } else if (selectedAnswer) {
            const optionIndex = options.indexOf(selectedAnswer);
            if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
              calculatedScore += scores[optionIndex];
            }
          }
        });
      }

      // Check for calculator result
      const calculatorResultConfig = results.find(r => (r as any).result_type === 'calculator');
      let calculatedValue: CalculatorResultType | null = null;
      
      if (calculatorResultConfig) {
        const calcResult = calculateQuizResult(
          (calculatorResultConfig as any).formula || '',
          ((calculatorResultConfig as any).variable_mapping as Record<string, string>) || {},
          finalAnswers,
          questions as any,
          (calculatorResultConfig as any).display_format || 'number',
          (calculatorResultConfig as any).decimal_places ?? 2,
          (calculatorResultConfig as any).result_unit || '',
          ((calculatorResultConfig as any).calculator_ranges as any[]) || []
        );
        
        if (calcResult.success) {
          calculatedValue = {
            rawValue: calcResult.rawValue,
            formattedValue: calcResult.formattedValue,
            range: calcResult.range
          };
          setCalculatorResult(calculatedValue);
        }
      }
      
      // Find result based on score
      let result = results.find(r => 
        r.condition_type === 'score_range' &&
        calculatedScore >= (r.min_score || 0) && 
        calculatedScore <= (r.max_score || Infinity)
      );

      if (!result) {
        result = results.find(r => r.condition_type === 'always') || results[0];
      }

      // Save response
      const { error, data } = await supabase
        .from('quiz_responses')
        .insert({
          quiz_id: quiz.id,
          answers: finalAnswers,
          respondent_name: formData.name || null,
          respondent_email: formData.email || null,
          respondent_whatsapp: formData.whatsapp || null,
          custom_field_data: formData,
          result_id: result?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting quiz response:', error);
        throw error;
      }

      // Trigger webhook
      if (data && quiz.user_id) {
        supabase.functions.invoke('trigger-user-webhook', {
          body: {
            response_id: data.id,
            quiz_id: quiz.id,
            user_id: quiz.user_id
          }
        }).catch(err => console.error('Webhook error:', err));
      }

      // Track completion
      await supabase.functions.invoke('track-quiz-analytics', {
        body: { quizId: quiz.id, event: 'complete' }
      });

      setFinalResult(result || null);
      setShowResult(true);
      
      // Show different toast based on show_results mode
      const quizShowResults = (quiz as any)?.show_results !== false;
      if (quizShowResults) {
        toast.success(t('quizView.submitSuccess'));
      } else {
        toast.success(t('quizView.responseSaved', 'Resposta salva! Obrigado por participar.'), { duration: 3000 });
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      
      if (error?.code === '42501') {
        toast.error(t('quizView.quizNotActive', 'Este quiz não está mais ativo'));
      } else if (error?.message?.includes('rate')) {
        toast.error(t('quizView.rateLimitError', 'Aguarde alguns segundos antes de tentar novamente'));
      } else {
        toast.error(t('quizView.submitError'));
      }
    }
  };

  // Silent version used by auto-submit (no-results mode)
  const submitQuizSilent = (overrideAnswers: Record<string, any>, overrideScore: number) => {
    submitQuiz(overrideAnswers, overrideScore);
  };

  return {
    // State
    loading,
    quiz,
    quizOwnerProfile,
    questions,
    results,
    formConfig,
    customFields,
    currentStep,
    answers,
    formData,
    showResult,
    finalResult,
    calculatorResult,
    totalScore,
    selectedLanguage,
    availableLanguages,
    sessionId,
    visibleQuestions,
    currentQuestion,
    abVariant,
    
    // Setters
    setFormData,
    setSelectedLanguage,
    
    // Actions
    handleAnswer,
    nextStep,
    prevStep,
    submitQuiz,
    markConversion
  };
}
