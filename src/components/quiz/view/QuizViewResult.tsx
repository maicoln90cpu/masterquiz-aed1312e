import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle2, XCircle, Lightbulb, ClipboardList } from "lucide-react";
import type { Quiz, QuizResult, QuizQuestion } from "@/types/quiz";
import type { CalculatorResultType } from "@/hooks/useQuizViewState";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

interface QuizViewResultProps {
  quiz: Quiz;
  finalResult: QuizResult;
  calculatorResult: CalculatorResultType | null;
  questions?: QuizQuestion[];
  answers?: Record<string, any>;
}

export function QuizViewResult({ quiz, finalResult, calculatorResult, questions, answers }: QuizViewResultProps) {
  const { t } = useTranslation();
  const isCalculator = (finalResult as any).result_type === 'calculator';

  // Check if any question has end_of_quiz explanation mode
  const endOfQuizQuestions = (questions || []).filter((q) => {
    const questionBlock = (q.blocks as any[])?.find((b: any) => b.type === 'question');
    return questionBlock?.explanation && questionBlock?.explanationMode === 'end_of_quiz';
  });
  const showGabarito = endOfQuizQuestions.length > 0 && answers;

  // Calculate score
  let correctCount = 0;
  if (showGabarito) {
    endOfQuizQuestions.forEach((q) => {
      const questionBlock = (q.blocks as any[])?.find((b: any) => b.type === 'question');
      const userAnswer = answers[q.id];
      if (questionBlock?.correct_answer && userAnswer === questionBlock.correct_answer) {
        correctCount++;
      }
    });
  }

  return (
    <main className={`min-h-screen bg-background py-12 px-4 quiz-template-${quiz.template || 'moderno'}`}>
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {isCalculator && <Calculator className="h-6 w-6 text-primary" />}
              {t('quizView.result')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calculator Result Display */}
            {isCalculator && calculatorResult && (
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Seu resultado</p>
                <div className="text-5xl font-bold text-primary mb-3">
                  {calculatorResult.formattedValue}
                </div>
                {calculatorResult.range && (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {calculatorResult.range.label}
                    </Badge>
                    {calculatorResult.range.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {calculatorResult.range.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {finalResult.image_url && (
              <img src={finalResult.image_url} alt="Result" className="w-full rounded-lg" />
            )}
            
            <div className="prose max-w-none">
              <p className="text-lg whitespace-pre-wrap">
                {isCalculator && calculatorResult 
                  ? finalResult.result_text.replace(/\{result\}/g, calculatorResult.formattedValue)
                  : finalResult.result_text
                }
              </p>
            </div>
            
            {finalResult.button_text && finalResult.redirect_url && (
              <Button asChild className="w-full btn-primary">
                <a href={finalResult.redirect_url} target="_blank" rel="noopener noreferrer">
                  {finalResult.button_text}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Gabarito Comentado - end_of_quiz mode */}
        {showGabarito && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Gabarito Comentado
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {correctCount} de {endOfQuizQuestions.length} acertos
                </Badge>
                <Badge variant={correctCount >= endOfQuizQuestions.length * 0.7 ? 'default' : 'destructive'} className="text-sm">
                  {Math.round((correctCount / endOfQuizQuestions.length) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {endOfQuizQuestions.map((q, idx) => {
                const questionBlock = (q.blocks as any[])?.find((b: any) => b.type === 'question');
                const userAnswer = answers[q.id];
                const isCorrect = questionBlock?.correct_answer && userAnswer === questionBlock.correct_answer;

                return (
                  <div key={q.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="font-semibold text-sm">{idx + 1}. {stripHtml(questionBlock?.questionText || q.question_text)}</p>
                    </div>
                    <div className="ml-7 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Sua resposta:</span> <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>{Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || '—'}</span></p>
                      {questionBlock?.correct_answer && !isCorrect && (
                        <p><span className="text-muted-foreground">Resposta correta:</span> <span className="text-green-700 font-medium">{questionBlock.correct_answer}</span></p>
                      )}
                      {questionBlock?.explanation && (
                        <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-1.5 text-primary font-medium mb-1">
                            <Lightbulb className="h-4 w-4" />
                            <span>Explicação</span>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">{questionBlock.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
        {!quiz.hide_branding && (
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
