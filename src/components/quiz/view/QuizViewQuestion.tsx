import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Check, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { QuizBlockPreview } from "@/components/quiz/QuizBlockPreview";
import { sanitizeSimpleText } from "@/lib/sanitize";
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
  onSubmit
}: QuizViewQuestionProps) {
  const { t } = useTranslation();

  const isNextDisabled = () => {
    const questionBlock = question.blocks?.find((b: any) => b.type === 'question') as any;
    const options = questionBlock?.options || (question as any).options || [];
    const answerFormat = questionBlock?.answerFormat;
    const isRequired = questionBlock?.required !== false;
    
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
                />
              );
            }
            
            return (
              <QuizBlockPreview 
                key={block.id} 
                blocks={[block]} 
                showNavigationButton={false}
                onNavigateNext={onNext}
                onNavigateToQuestion={() => {}}
              />
            );
          })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {quiz.show_question_number !== false && (
        <div className="text-sm text-muted-foreground">
          Questão {currentStep + 1} de {totalQuestions}
        </div>
      )}
      
      {renderQuestionBlocks()}
      
      <div className="flex gap-2">
        {currentStep > 0 && (
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('quizView.previous')}
          </Button>
        )}
        <Button
          onClick={handleNextClick}
          disabled={isNextDisabled()}
          className="flex-1 btn-primary"
        >
          {isLastQuestion ? t('quizView.finish') : t('quizView.next')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Sub-component for rendering question blocks with options
interface QuestionBlockRendererProps {
  block: QuizBlock;
  questionId: string;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
}

function QuestionBlockRenderer({ block, questionId, answers, onAnswer }: QuestionBlockRendererProps) {
  const [answered, setAnswered] = useState(false);
  // Cast to any for question block properties
  const questionBlock = block as any;
  const answerFormat = questionBlock.answerFormat;
  const options = questionBlock.options || [];
  const emojis = questionBlock.emojis || [];
  const explanation = questionBlock.explanation;
  const correctAnswer = questionBlock.correct_answer;
  const explanationMode = questionBlock.explanationMode;
  const showInlineExplanation = explanation && explanationMode !== 'end_of_quiz' && answered;

  return (
    <div className="space-y-4">
      <div>
        <h3 
          className="text-xl font-semibold mb-2"
          dangerouslySetInnerHTML={{ __html: sanitizeSimpleText(questionBlock.questionText || '') }}
        />
        {questionBlock.subtitle && (
          <p 
            className="text-sm text-muted-foreground mb-2"
            dangerouslySetInnerHTML={{ __html: sanitizeSimpleText(questionBlock.subtitle) }}
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
        <MultipleChoiceOptions
          options={options}
          emojis={emojis}
          questionId={questionId}
          answers={answers}
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
      ) : (
        <SingleChoiceOptions
          options={options}
          emojis={emojis}
          questionId={questionId}
          answers={answers}
          onAnswer={(qId, val) => {
            if (!answered) {
              onAnswer(qId, val);
              if (explanation && explanationMode !== 'end_of_quiz') {
                setAnswered(true);
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
    </div>
  );
}

interface OptionsProps {
  options: any[];
  emojis: string[];
  questionId: string;
  answers: Record<string, any>;
  onAnswer: (questionId: string, value: any) => void;
  disabled?: boolean;
}

function MultipleChoiceOptions({ options, emojis, questionId, answers, onAnswer, disabled }: OptionsProps) {
  const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];

  return (
    <div className="space-y-2">
      {options.map((option: any, idx: number) => {
        const optionText = typeof option === 'string' ? option : option.text || option.value || `Opção ${idx + 1}`;
        const emoji = emojis[idx];
        const isSelected = currentAnswers.includes(optionText);
        
        return (
          <div 
            key={idx} 
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              isSelected 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/20 hover:border-primary/50'
            }`}
            onClick={() => {
              const newValue = isSelected 
                ? currentAnswers.filter((v: string) => v !== optionText)
                : [...currentAnswers, optionText];
              onAnswer(questionId, newValue);
            }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
              {emoji || String.fromCharCode(65 + idx)}
            </div>
            <Checkbox 
              id={`checkbox-${idx}`}
              checked={isSelected}
              className="sr-only"
            />
            <Label htmlFor={`checkbox-${idx}`} className="flex-1 cursor-pointer text-base">
              {optionText}
            </Label>
            {isSelected && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SingleChoiceOptions({ options, emojis, questionId, answers, onAnswer, disabled }: OptionsProps) {
  return (
    <RadioGroup
      value={answers[questionId]}
      onValueChange={(value) => onAnswer(questionId, value)}
      className="space-y-2"
    >
      {options.map((option: any, idx: number) => {
        const optionText = typeof option === 'string' ? option : option.text || option.value || `Opção ${idx + 1}`;
        const emoji = emojis[idx];
        const isSelected = answers[questionId] === optionText;
        
        return (
          <div 
            key={idx} 
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              isSelected 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/20 hover:border-primary/50'
            }`}
            onClick={() => { if (!disabled) onAnswer(questionId, optionText); }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
              {emoji || String.fromCharCode(65 + idx)}
            </div>
            <RadioGroupItem value={optionText} id={`option-${idx}`} className="sr-only" />
            <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base">
              {optionText}
            </Label>
            {isSelected && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
        );
      })}
    </RadioGroup>
  );
}
