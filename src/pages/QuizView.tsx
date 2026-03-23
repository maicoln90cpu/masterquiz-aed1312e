import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizViewState, type PreviewData } from "@/hooks/useQuizViewState";
import { useQuizTracking } from "@/hooks/useQuizTracking";
import { useCtaTracking } from "@/hooks/useCtaTracking";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QuizViewResult, 
  QuizViewForm, 
  QuizViewQuestion, 
  QuizViewHeader 
} from "@/components/quiz/view";

// Shimmer loading skeleton
function QuizLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-background py-8 md:py-12 px-4">
      <div className="container max-w-2xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-48 mx-auto rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded bg-muted animate-pulse" />
        </div>
        {/* Progress bar skeleton */}
        <div className="h-2.5 w-full rounded-full bg-muted animate-pulse" />
        {/* Question skeleton */}
        <div className="space-y-4 pt-4">
          <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border-2 border-muted">
                <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 h-5 rounded bg-muted animate-pulse" />
                <div className="w-5 h-5 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

interface QuizViewProps {
  previewMode?: boolean;
  previewData?: PreviewData;
}

export default function QuizView({ previewMode = false, previewData }: QuizViewProps) {
  const { slug, company } = useParams();
  
  const state = useQuizViewState({
    slug,
    company,
    previewMode,
    previewData
  });

  // Initialize tracking
  useQuizTracking({
    quiz: state.quiz,
    quizOwnerProfile: state.quizOwnerProfile
  });

  if (state.loading) {
    return <QuizLoadingSkeleton />;
  }

  if (!state.quiz) return null;

  // Show form before quiz if configured
  const showFormBefore = state.formConfig?.collection_timing === 'before' && state.currentStep === 0;
  const showFormAfter = state.formConfig?.collection_timing === 'after' && state.currentStep === state.visibleQuestions.length;

  // Show result screen (only if show_results is enabled)
  const quizShowResults = (state.quiz as any)?.show_results !== false;
  
  // CTA tracking: only for funnel quizzes (no results) on the last question
  const isFunnelQuiz = !quizShowResults;
  const isLastStep = state.currentStep === state.visibleQuestions.length - 1;
  const currentQuestion = state.visibleQuestions[state.currentStep];
  
  const ctaTrackingParams = isFunnelQuiz && isLastStep && state.quiz && currentQuestion ? {
    quizId: state.quiz.id,
    sessionId: state.sessionId,
    questionId: currentQuestion.id,
    stepNumber: currentQuestion.order_number,
  } : null;
  
  const onCtaClick = useCtaTracking(ctaTrackingParams);

  if (state.showResult && state.finalResult && quizShowResults) {
    return (
      <QuizViewResult 
        quiz={state.quiz}
        finalResult={state.finalResult}
        calculatorResult={state.calculatorResult}
        questions={state.questions}
        answers={state.answers}
      />
    );
  }

  return (
    <main className={`min-h-screen bg-background py-8 md:py-12 px-4 quiz-template-${state.quiz.template || 'moderno'}`}>
      <div className="container max-w-2xl mx-auto container-mobile">
        <QuizViewHeader
          quiz={state.quiz}
          availableLanguages={state.availableLanguages}
          selectedLanguage={state.selectedLanguage}
          onLanguageChange={state.setSelectedLanguage}
        />

        <div className="py-6">
          <AnimatePresence mode="wait">
            {showFormBefore || showFormAfter ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <QuizViewForm
                      formConfig={state.formConfig}
                      customFields={state.customFields}
                      formData={state.formData}
                      setFormData={state.setFormData}
                      onSubmit={showFormBefore ? state.nextStep : state.submitQuiz}
                      isBeforeQuiz={showFormBefore}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ) : state.currentQuestion ? (
              <motion.div
                key={`question-${state.currentStep}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <QuizViewQuestion
                  quiz={state.quiz}
                  question={state.currentQuestion}
                  currentStep={state.currentStep}
                  totalQuestions={state.questions.length}
                  visibleQuestionsCount={state.visibleQuestions.length}
                  answers={state.answers}
                  onAnswer={state.handleAnswer}
                  onNext={state.nextStep}
                  onPrev={state.prevStep}
                  isLastQuestion={state.currentStep === state.questions.length - 1}
                  showFormAfter={state.formConfig?.collection_timing === 'after'}
                  onSubmit={state.submitQuiz}
                  showResults={quizShowResults}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        
        {!state.quiz.hide_branding && (
          <div className="text-center py-4">
            <a 
              href="https://masterquiz.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Powered by MasterQuiz
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
