import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Check, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { QuizBlockPreview } from "@/components/quiz/QuizBlockPreview";
import { sanitizeHtml } from "@/lib/sanitize";
import type { QuizBlock } from "@/types/blocks";
import type { QuizQuestion, Quiz } from "@/types/quiz";

interface QuizViewQuestionProps {
  quiz: Quiz;
  question: QuizQuestion;
  currentStep: number;
  totalQuestions: number;
  visibleQuestionsCount: number;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isLastQuestion: boolean;
  showFormAfter: boolean;
  onSubmit: () => void;
  showResults?: boolean;
  onCtaClick?: (ctaText: string, ctaUrl: string, blockId?: string) => void;
}

export function QuizViewQuestion({
  quiz,
  question,
  currentStep,
  totalQuestions,
  visibleQuestionsCount,
  answers,
  onAnswer,
  onNext,
  onPrev,
  isLastQuestion,
  showFormAfter,
  onSubmit,
  showResults = true,
  onCtaClick
}: QuizViewQuestionProps) {
  const { t } = useTranslation();
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingAutoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Detect auto-advance from question block settings
  const questionBlock = question.blocks?.find((b: any) => b.type === 'question') as any;
  const answerFormat = questionBlock?.answerFormat || question.answer_format;
  const isRequired = questionBlock?.required !== false;
  const autoAdvance = questionBlock?.autoAdvance === true;
  
  // Auto-advance: for single_choice/yes_no, advance after selection
  const shouldAutoAdvance = autoAdvance && (answerFormat === 'single_choice' || answerFormat === 'yes_no');

  // Detect loading block behavior
  const loadingBlock = question.blocks?.find((b: any) => b.type === 'loading') as any;
  const hasLoadingBlock = !!loadingBlock;
  const loadingAutoAdvance = loadingBlock?.autoAdvance === true;
  const loadingDuration = loadingBlock?.duration || 5;

  // Reset loading state when question changes
  useEffect(() => {
    setLoadingComplete(false);
  }, [question.id]);

  // Loading block auto-advance timer
  useEffect(() => {
    if (!hasLoadingBlock) return;
    
    const timer = setTimeout(() => {
      setLoadingComplete(true);
      if (loadingAutoAdvance) {
        // Auto-advance after loading completes
        if (isLastQuestion) {
          if (showFormAfter) onNext(); else onSubmit();
        } else {
          onNext();
        }
      }
    }, loadingDuration * 1000);

    return () => clearTimeout(timer);
  }, [hasLoadingBlock, loadingAutoAdvance, loadingDuration, question.id, isLastQuestion, showFormAfter, onNext, onSubmit]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const handleAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      if (isLastQuestion) {
        if (showFormAfter) onNext(); else onSubmit();
      } else {
        onNext();
      }
    }, 500);
  }, [isLastQuestion, showFormAfter, onNext, onSubmit]);

  const isNextDisabled = () => {
    const options = questionBlock?.options || (question as any).options || [];
    
    if (!isRequired) return false;
    
    const currentAnswer = answers[question.id];
    
    if (answerFormat === 'short_text') {
      return !currentAnswer || currentAnswer.trim() === '';
    }
    
    if (answerFormat === 'multiple_choice') {
      return !Array.isArray(currentAnswer) || currentAnswer.length === 0;
    }
    
    const hasValidOptions = options.length > 0 && 
      !options.every((o: any) => {
        const text = typeof o === 'string' ? o : o.text || '';
        return !text.trim();
      });
    
    if (!hasValidOptions) return false;
    
    return !currentAnswer;
  };

  const handleNextClick = () => {
    if (isLastQuestion) {
      if (showFormAfter) {
        onNext();
      } else {
        onSubmit();
      }
    } else {
      onNext();
    }
  };

  // Check if question has no answer options (informational slide with button block)
  const hasQuestionBlock = question.blocks?.some((b: any) => b.type === 'question');
  const hasButtonBlock = question.blocks?.some((b: any) => b.type === 'button' && (b as any).action === 'next_question');
  const isInformationalSlide = !hasQuestionBlock && hasButtonBlock;
  // REGRA: sempre que existe bloco de pergunta, NÃO mostrar botão "Próxima Pergunta" automático
  // O bloco de pergunta já tem seu próprio fluxo de resposta
  const hasManualNavButton = hasQuestionBlock || hasButtonBlock;

  // Determine if we should hide the next button
  // Hide when: loading block with autoAdvance, or loading not complete yet, or normal auto-advance
  const shouldHideNextForLoading = hasLoadingBlock && (loadingAutoAdvance || !loadingComplete);

  const renderQuestionBlocks = () => {
    if (!question.blocks || !Array.isArray(question.blocks) || question.blocks.length === 0) {
      return (
        <>
          <h3 className="text-xl font-semibold">{question.question_text}</h3>
          {question.media_url && (
            <img src={question.media_url} alt="Question media" className="w-full rounded-lg" />
          )}
        </>
      );
    }

    // Collect textInput values from answers for controlled rendering
    const textInputValues: Record<string, string> = {};
    if (question.blocks) {
      for (const block of question.blocks) {
        if ((block as any).type === 'textInput') {
          const stored = answers[`textInput:${block.id}`] || answers[question.id];
          if (typeof stored === 'string') {
            textInputValues[block.id] = stored;
          }
        }
      }
    }

    const handleTextInputChange = (blockId: string, value: string) => {
      // For questions with a single textInput, store under question.id
      // For multiple, store under textInput:<blockId>
      const textInputBlocks = question.blocks?.filter((b: any) => b.type === 'textInput') || [];
      if (textInputBlocks.length === 1) {
        onAnswer(question.id, value);
      } else {
        onAnswer(`textInput:${blockId}`, value);
      }
    };

    // Pass ALL questions up to and including currentStep for AnswerSummary
    const allQuestions = (quiz as any).questions || [];

    return (
      <div className="space-y-6">
        {question.blocks
          .sort((a: QuizBlock, b: QuizBlock) => (a.order || 0) - (b.order || 0))
          .map((block: QuizBlock) => {
            if (block.type === 'question') {
              return (
                <QuestionBlockRenderer
                  key={block.id}
                  block={block}
                  questionId={question.id}
                  answers={answers}
                  onAnswer={onAnswer}
                  onAutoAdvance={shouldAutoAdvance ? handleAutoAdvance : undefined}
                  showNextButton={!shouldAutoAdvance && !hasButtonBlock && !shouldHideNextForLoading}
                  onNextClick={handleNextClick}
                  isNextDisabled={isNextDisabled()}
                  isLastQuestion={isLastQuestion}
                  showFormAfter={showFormAfter}
                  showResults={showResults}
                />
              );
            }
            
            return (
              <QuizBlockPreview 
                key={block.id} 
                blocks={[block]} 
                showNavigationButton={false}
                onNavigateNext={handleNextClick}
                onNavigateToQuestion={() => {}}
                wrapInCard={false}
                answers={answers}
                questions={allQuestions.slice(0, currentStep + 1)}
                currentStep={currentStep}
                totalQuestions={totalQuestions}
                textInputValues={textInputValues}
                onTextInputChange={handleTextInputChange}
                onCtaClick={onCtaClick}
                globalTextAlign={(quiz as any).global_text_align || undefined}
                globalFontSize={(quiz as any).global_font_size || undefined}
                globalFontFamily={(quiz as any).global_font_family || undefined}
              />
            );
          })}
      </div>
    );
  };

  // Progress bar percentage
  const progressPercent = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;

  // Determine if we should show navigation buttons
  // Hide "Next" when auto-advance is active AND answer is single choice
  const hideNextButton = shouldAutoAdvance && !isInformationalSlide;

  return (
    <div className="space-y-6">
      {/* Back arrow at top-left */}
      {currentStep > 0 && (
        <button 
          onClick={onPrev}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors -mt-2 mb-2"
          aria-label={t('quizView.previous')}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">{t('quizView.previous')}</span>
        </button>
      )}

      {/* Progress indicator: bar, counter, or none */}
      {(() => {
        const progressStyle = (quiz as any).progress_style ?? (quiz.show_question_number !== false ? 'counter' : 'none');
        if (progressStyle === 'none') return null;
        if (progressStyle === 'bar') return (
          <div className="quiz-progress-premium">
            <div className="progress-root">
              <div className="progress-indicator" style={{ transform: `translateX(-${100 - progressPercent}%)` }} />
            </div>
          </div>
        );
        // counter
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>{currentStep + 1} / {totalQuestions}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="quiz-progress-premium">
              <div className="progress-root">
                <div className="progress-indicator" style={{ transform: `translateX(-${100 - progressPercent}%)` }} />
              </div>
            </div>
          </div>
        );
      })()}
      
      {renderQuestionBlocks()}
      
      {/* Navigation: show Next/Finish button */}
      {/* Hide when: auto-advance active, informational slide, manual nav button, loading not complete, or last question without results */}
      {!hideNextButton && !isInformationalSlide && !hasManualNavButton && !shouldHideNextForLoading && !(isLastQuestion && !showResults && !showFormAfter) && (
        <div className="flex gap-2">
          <Button
            onClick={handleNextClick}
            disabled={isNextDisabled()}
            className="flex-1 btn-primary"
          >
            {isLastQuestion ? t('quizView.finish') : (questionBlock?.nextButtonText || t('quizView.next'))}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Sub-component for rendering question blocks with options
interface QuestionBlockRendererProps {
  block: QuizBlock;
  questionId: string;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
  onAutoAdvance?: () => void;
  showNextButton?: boolean;
  onNextClick?: () => void;
  isNextDisabled?: boolean;
  isLastQuestion?: boolean;
  showFormAfter?: boolean;
  showResults?: boolean;
}

function QuestionBlockRenderer({ block, questionId, answers, onAnswer, onAutoAdvance, showNextButton, onNextClick, isNextDisabled, isLastQuestion, showFormAfter, showResults }: QuestionBlockRendererProps) {
  const { t } = useTranslation();
  const [answered, setAnswered] = useState(false);
  const questionBlock = block as any;
  const answerFormat = questionBlock.answerFormat;
  const options = questionBlock.options || [];
  const emojis = questionBlock.emojis || [];
  const optionImages = questionBlock.optionImages || [];
  const optionImageLayout = questionBlock.optionImageLayout || '1x4';
  const optionImageSize = questionBlock.optionImageSize || 'medium';
  const explanation = questionBlock.explanation;
  const correctAnswer = questionBlock.correct_answer;
  const explanationMode = questionBlock.explanationMode;
  const showInlineExplanation = explanation && explanationMode !== 'end_of_quiz' && answered;

  return (
    <div className="space-y-4">
      <div>
        <div 
          className="prose prose-sm max-w-none quiz-question-responsive font-semibold mb-2 [&>p]:m-0 [&>h1]:m-0 [&>h2]:m-0 [&>h3]:m-0"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionBlock.questionText || '') }}
        />
        {questionBlock.subtitle && (
          <div 
            className="prose prose-sm max-w-none text-sm text-muted-foreground mb-2 [&>p]:m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionBlock.subtitle) }}
          />
        )}
        {questionBlock.hint && (
          <p className="text-xs text-muted-foreground italic mb-4">
            💡 {questionBlock.hint}
          </p>
        )}
      </div>
      
      {answerFormat === 'short_text' ? (
        <Input 
          placeholder="Digite sua resposta..." 
          value={answers[questionId] || ''}
          onChange={(e) => { if (!answered) onAnswer(questionId, e.target.value); }}
          onBlur={() => { if (answers[questionId] && explanation && explanationMode !== 'end_of_quiz') setAnswered(true); }}
          className="w-full"
          disabled={answered}
        />
      ) : answerFormat === 'multiple_choice' ? (
        <>
          <p className="text-xs text-muted-foreground">Selecione uma ou mais opções</p>
          <MultipleChoiceOptions
            options={options}
            emojis={emojis}
            optionImages={optionImages}
            optionImageLayout={optionImageLayout}
            optionImageSize={optionImageSize}
            questionId={questionId}
            answers={answers}
            correctAnswer={correctAnswer}
            answered={answered}
            onAnswer={(qId, val) => {
              if (!answered) {
                onAnswer(qId, val);
                if (explanation && explanationMode !== 'end_of_quiz' && Array.isArray(val) && val.length > 0) {
                  setAnswered(true);
                }
              }
            }}
            disabled={answered}
          />
        </>
      ) : (
        <SingleChoiceOptions
          options={options}
          emojis={emojis}
          optionImages={optionImages}
          optionImageLayout={optionImageLayout}
          optionImageSize={optionImageSize}
          questionId={questionId}
          answers={answers}
          correctAnswer={correctAnswer}
          answered={answered}
          onAnswer={(qId, val) => {
            if (!answered) {
              onAnswer(qId, val);
              if (explanation && explanationMode !== 'end_of_quiz') {
                setAnswered(true);
              } else if (onAutoAdvance) {
                onAutoAdvance();
              }
            }
          }}
          disabled={answered}
        />
      )}

      {showInlineExplanation && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Lightbulb className="h-5 w-5" />
            <span>Gabarito Comentado</span>
          </div>
          {correctAnswer && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">Resposta correta:</span> {correctAnswer}
            </div>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
        </div>
      )}

      {/* Botão Próxima integrado ao bloco de pergunta */}
      {showNextButton && !(isLastQuestion && !showResults && !showFormAfter) && (
        <div className="pt-2">
          <Button
            onClick={onNextClick}
            disabled={isNextDisabled}
            className="w-full btn-primary"
          >
            {isLastQuestion
              ? t('quizView.finish')
              : (questionBlock.nextButtonText || t('quizView.next'))}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface OptionsProps {
  options: any[];
  emojis: string[];
  optionImages?: string[];
  optionImageLayout?: string;
  optionImageSize?: string;
  questionId: string;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
  disabled?: boolean;
  correctAnswer?: string;
  answered?: boolean;
}

const getImageLayoutClass = (layout?: string, hasImages?: boolean) => {
  if (!hasImages) return 'space-y-2';
  switch (layout) {
    case '2x2': return 'grid grid-cols-2 gap-3';
    case '4x1': return 'grid grid-cols-4 gap-3';
    default: return 'space-y-2';
  }
};

const getImageSizeClass = (size?: string) => {
  switch (size) {
    case 'tiny': return 'max-h-[60px]';
    case 'small': return 'max-h-[80px]';
    case 'large': return 'max-h-[180px]';
    default: return 'max-h-[120px]';
  }
};

function MultipleChoiceOptions({ options, emojis, optionImages, optionImageLayout, optionImageSize, questionId, answers, onAnswer, disabled, correctAnswer, answered }: OptionsProps) {
  const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];
  const hasImages = optionImages && optionImages.some(img => img);

  const getOptionStyle = (optionText: string) => {
    if (!answered || !correctAnswer) {
      const isSelected = currentAnswers.includes(optionText);
      return isSelected 
        ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' 
        : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5';
    }
    const isSelected = currentAnswers.includes(optionText);
    const isCorrect = optionText === correctAnswer;
    if (isSelected && isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    if (!isSelected && isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    return 'border-muted-foreground/20 opacity-60';
  };

  return (
    <div className={getImageLayoutClass(optionImageLayout, hasImages)}>
      {options.map((option: any, idx: number) => {
        const optionText = typeof option === 'string' ? option : option.text || option.value || `Opção ${idx + 1}`;
        const emoji = emojis[idx];
        const image = optionImages?.[idx];
        const isSelected = currentAnswers.includes(optionText);
        const isCorrect = answered && correctAnswer && optionText === correctAnswer;
        
        return (
          <div 
            key={idx} 
            className={`flex ${hasImages && optionImageLayout !== '1x4' ? 'flex-col items-center text-center' : 'items-center'} gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] select-none min-h-[44px] ${getOptionStyle(optionText)}`}
            onClick={() => {
              if (disabled) return;
              const newValue = isSelected 
                ? currentAnswers.filter((v: string) => v !== optionText)
                : [...currentAnswers, optionText];
              onAnswer(questionId, newValue);
            }}
          >
            {image ? (
              <img src={image} alt={optionText} className={`${getImageSizeClass(optionImageSize)} w-full object-cover rounded-lg`} />
            ) : emoji ? (
              <span className="flex-shrink-0 text-2xl w-10 h-10 flex items-center justify-center">{emoji}</span>
            ) : (
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                answered && isCorrect ? 'bg-green-100 dark:bg-green-900/40' :
                answered && isSelected ? 'bg-red-100 dark:bg-red-900/40' :
                'bg-primary/10'
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
            )}
            <span className={`${hasImages && optionImageLayout !== '1x4' ? '' : 'flex-1'} text-base`}>
              {optionText}
            </span>
            <Checkbox 
              id={`checkbox-${questionId}-${idx}`}
              checked={isSelected}
              className="h-5 w-5 flex-shrink-0 ml-auto pointer-events-none"
              tabIndex={-1}
            />
            {answered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {answered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
          </div>
        );
      })}
    </div>
  );
}

function SingleChoiceOptions({ options, emojis, optionImages, optionImageLayout, optionImageSize, questionId, answers, onAnswer, disabled, correctAnswer, answered }: OptionsProps) {
  const hasImages = optionImages && optionImages.some(img => img);

  const getOptionStyle = (optionText: string) => {
    const isSelected = answers[questionId] === optionText;
    if (!answered || !correctAnswer) {
      return isSelected 
        ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' 
        : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5';
    }
    const isCorrect = optionText === correctAnswer;
    if (isSelected && isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-50 dark:bg-red-950/30';
    if (!isSelected && isCorrect) return 'border-green-500 bg-green-50 dark:bg-green-950/30';
    return 'border-muted-foreground/20 opacity-60';
  };

  return (
    <RadioGroup
      value={answers[questionId]}
      onValueChange={(value) => onAnswer(questionId, value)}
      className={getImageLayoutClass(optionImageLayout, hasImages)}
    >
      {options.map((option: any, idx: number) => {
        const optionText = typeof option === 'string' ? option : option.text || option.value || `Opção ${idx + 1}`;
        const emoji = emojis[idx];
        const image = optionImages?.[idx];
        const isSelected = answers[questionId] === optionText;
        const isCorrect = answered && correctAnswer && optionText === correctAnswer;
        
        return (
          <div 
            key={idx} 
            className={`flex ${hasImages && optionImageLayout !== '1x4' ? 'flex-col items-center text-center' : 'items-center'} gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] min-h-[44px] ${getOptionStyle(optionText)}`}
            onClick={() => { if (!disabled) onAnswer(questionId, optionText); }}
          >
            {image ? (
              <img src={image} alt={optionText} className={`${getImageSizeClass(optionImageSize)} w-full object-cover rounded-lg`} />
            ) : emoji ? (
              <span className="flex-shrink-0 text-2xl w-10 h-10 flex items-center justify-center">{emoji}</span>
            ) : (
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                answered && isCorrect ? 'bg-green-100 dark:bg-green-900/40' :
                answered && isSelected ? 'bg-red-100 dark:bg-red-900/40' :
                'bg-primary/10'
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
            )}
            <RadioGroupItem value={optionText} id={`option-${questionId}-${idx}`} className="sr-only" />
            <Label htmlFor={`option-${questionId}-${idx}`} className={`${hasImages && optionImageLayout !== '1x4' ? '' : 'flex-1'} cursor-pointer text-base`}>
              {optionText}
            </Label>
            {answered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {answered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
            {!answered && isSelected && <Check className="h-5 w-5 text-primary" />}
          </div>
        );
      })}
    </RadioGroup>
  );
}
