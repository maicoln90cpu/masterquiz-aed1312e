import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle2, XCircle, Lightbulb, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { Quiz, QuizResult, QuizQuestion } from "@/types/quiz";
import type { CalculatorResultType } from "@/hooks/useQuizViewState";
import { sanitizeHtml } from "@/lib/sanitize";

// 🔒 REGRESSION SHIELD: result_text pode conter HTML formatado pelo RichTextEditor (v2.44.0).
// Sempre sanitizar antes de renderizar com dangerouslySetInnerHTML — sanitizeHtml() bloqueia
// <script>, <iframe>, on*= e demais vetores XSS. Não remover esta sanitização.
const stripHtml = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim();

// Detecta se o texto contém tags HTML (resultado novo formato vs texto puro legado)
const hasHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text || '');

// Stagger animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.5 }
  }
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, scale: 1,
    transition: { duration: 0.6, type: "spring" as const, bounce: 0.4 }
  }
};

interface QuizViewResultProps {
  quiz: Quiz;
  finalResult: QuizResult;
  calculatorResult: CalculatorResultType | null;
  questions?: QuizQuestion[];
  answers?: Record<string, any>;
}

export function QuizViewResult({ quiz, finalResult, calculatorResult, questions, answers }: QuizViewResultProps) {
  const { t } = useTranslation();
  const confettiFired = useRef(false);
  const isCalculator = (finalResult as any).result_type === 'calculator';

  // Fire confetti on mount
  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    
    const duration = 2000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

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
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card className="overflow-hidden">
            <CardHeader>
              <motion.div variants={itemVariants}>
                <CardTitle className="quiz-title-responsive flex items-center gap-2">
                  {isCalculator && <Calculator className="h-6 w-6 text-primary" />}
                  {t('quizView.result')}
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calculator Result Display */}
              {isCalculator && calculatorResult && (
                <motion.div variants={scaleInVariants} className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Seu resultado</p>
                  <div className="quiz-result-number text-primary mb-3">
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
                </motion.div>
              )}
              
              {finalResult.video_url && (
                <motion.div variants={itemVariants} className="w-full rounded-lg overflow-hidden">
                  {finalResult.video_url.includes('youtube.com') || finalResult.video_url.includes('youtu.be') ? (
                    <div className="aspect-video">
                      <iframe
                        src={finalResult.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        allow="autoplay"
                      />
                    </div>
                  ) : finalResult.video_url.includes('vimeo.com') ? (
                    <div className="aspect-video">
                      <iframe
                        src={finalResult.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        allow="autoplay"
                      />
                    </div>
                  ) : (
                    <video
                      src={finalResult.video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full rounded-lg"
                    />
                  )}
                </motion.div>
              )}

              {finalResult.image_url && (
                <motion.div variants={itemVariants}>
                  <img src={finalResult.image_url} alt="Result" className="w-full rounded-lg" />
                </motion.div>
              )}
              
              <motion.div variants={itemVariants} className="prose max-w-none">
                {(() => {
                  const rawText = isCalculator && calculatorResult
                    ? (finalResult.result_text || '').replace(/\{result\}/g, calculatorResult.formattedValue)
                    : (finalResult.result_text || '');
                  // Backward compat: texto puro legado renderiza com whitespace-pre-wrap
                  if (!hasHtml(rawText)) {
                    return <p className="quiz-body-responsive whitespace-pre-wrap">{rawText}</p>;
                  }
                  // Novo formato: HTML do RichTextEditor — sempre sanitizar
                  return (
                    <div
                      className="quiz-body-responsive ql-editor-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawText) }}
                    />
                  );
                })()}
              </motion.div>
              
              {finalResult.button_text && finalResult.redirect_url && (
                <motion.div variants={itemVariants}>
                  <Button asChild className="w-full btn-primary min-h-[44px]">
                    <a href={finalResult.redirect_url} target="_blank" rel="noopener noreferrer">
                      {finalResult.button_text}
                    </a>
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Gabarito Comentado - end_of_quiz mode */}
          {showGabarito && (
            <motion.div variants={itemVariants}>
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
                      <motion.div 
                        key={q.id} 
                        variants={itemVariants}
                        className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                          )}
                          <p className="font-semibold text-sm">{idx + 1}. {stripHtml(questionBlock?.questionText || q.question_text)}</p>
                        </div>
                        <div className="ml-7 space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Sua resposta:</span> <span className={isCorrect ? 'text-success font-medium' : 'text-destructive font-medium'}>{Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || '—'}</span></p>
                          {questionBlock?.correct_answer && !isCorrect && (
                            <p><span className="text-muted-foreground">Resposta correta:</span> <span className="text-success font-medium">{questionBlock.correct_answer}</span></p>
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
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {!quiz.hide_branding && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="text-center py-4"
          >
            <a 
              href="https://masterquiz.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Powered by MasterQuiz
            </a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
