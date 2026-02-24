import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizViewState, type PreviewData } from "@/hooks/useQuizViewState";
import { useQuizTracking } from "@/hooks/useQuizTracking";
import { 
  QuizViewResult, 
  QuizViewForm, 
  QuizViewQuestion, 
  QuizViewHeader 
} from "@/components/quiz/view";

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
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (!state.quiz) return null;

  // Show form before quiz if configured
  const showFormBefore = state.formConfig?.collection_timing === 'before' && state.currentStep === 0;
  const showFormAfter = state.formConfig?.collection_timing === 'after' && state.currentStep === state.visibleQuestions.length;

  // Show result screen (only if show_results is enabled)
  const quizShowResults = (state.quiz as any)?.show_results !== false;
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

        <Card>
          <CardContent className="pt-6">
            {showFormBefore || showFormAfter ? (
              <QuizViewForm
                formConfig={state.formConfig}
                customFields={state.customFields}
                formData={state.formData}
                setFormData={state.setFormData}
                onSubmit={showFormBefore ? state.nextStep : state.submitQuiz}
                isBeforeQuiz={showFormBefore}
              />
            ) : state.currentQuestion ? (
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
            ) : null}
          </CardContent>
        </Card>
        
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
