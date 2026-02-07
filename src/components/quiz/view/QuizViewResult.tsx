import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";
import type { Quiz, QuizResult } from "@/types/quiz";
import type { CalculatorResultType } from "@/hooks/useQuizViewState";

interface QuizViewResultProps {
  quiz: Quiz;
  finalResult: QuizResult;
  calculatorResult: CalculatorResultType | null;
}

export function QuizViewResult({ quiz, finalResult, calculatorResult }: QuizViewResultProps) {
  const { t } = useTranslation();
  const isCalculator = (finalResult as any).result_type === 'calculator';

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
