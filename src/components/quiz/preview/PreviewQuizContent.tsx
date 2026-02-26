import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { QuizBlockPreview } from '../QuizBlockPreview';
import { sanitizeSimpleText } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { QuizBlock } from '@/types/blocks';
import type { EditorQuestion } from '@/types/quiz';

interface QuestionData {
  questionText: string;
  answerFormat: string;
  options: string[];
}

interface PreviewQuizContentProps {
  currentQuestion: EditorQuestion | undefined;
  currentQuestionIndex: number;
  sortedBlocks: QuizBlock[];
  questionData: QuestionData;
  selectedAnswers: Record<string, string | string[]>;
  visibleQuestionsLength: number;
  onAnswerSelect: (value: string, isMultiple: boolean) => void;
  onTextAnswer?: (text: string) => void;
  onNavigateNext: () => void;
  onNavigateToQuestion: (index: number) => void;
}

export const PreviewQuizContent = ({
  currentQuestion,
  currentQuestionIndex,
  sortedBlocks,
  questionData,
  selectedAnswers,
  visibleQuestionsLength,
  onAnswerSelect,
  onTextAnswer,
  onNavigateNext,
  onNavigateToQuestion
}: PreviewQuizContentProps) => {
  const { t } = useTranslation();

  if (!currentQuestion) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p className="text-sm">{t('preview.addQuestions', 'Adicione perguntas para ver o preview')}</p>
      </Card>
    );
  }

  const { questionText, answerFormat, options } = questionData;
  const isMultiple = answerFormat === 'multiple_choice';

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0.8 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
      >
        <div className="space-y-3 overflow-hidden">
          {sortedBlocks.length > 0 ? (
            <QuizBlockPreview
              blocks={sortedBlocks}
              showNavigationButton={false}
              wrapInCard={false}
              selectedAnswer={selectedAnswers[currentQuestion.id]}
              onAnswerSelect={onAnswerSelect}
              onTextChange={onTextAnswer}
              onNavigateNext={() => {
                if (currentQuestionIndex < visibleQuestionsLength - 1) {
                  onNavigateNext();
                }
              }}
              onNavigateToQuestion={(index) => {
                if (index >= 0 && index < visibleQuestionsLength) {
                  onNavigateToQuestion(index);
                }
              }}
            />
          ) : (
            // Fallback for old format without blocks
            <div className="space-y-4">
              {currentQuestion.media_url && (
                <img 
                  src={currentQuestion.media_url} 
                  alt="Question media" 
                  className="w-full rounded-lg"
                />
              )}
              <h3 
                className="text-lg font-semibold"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeSimpleText(questionText || t('preview.questionPlaceholder', 'Sua pergunta aparecerá aqui')) 
                }}
              />

              {(answerFormat === 'single_choice' || answerFormat === 'yes_no') && (
                <RadioGroup
                  value={(selectedAnswers[currentQuestion.id] as string) || ''}
                  onValueChange={(value) => onAnswerSelect(value, false)}
                >
                  {options.map((option: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {isMultiple && (
                <div className="space-y-2">
                  {options.map((option: string, idx: number) => {
                    const selectedOptions = (selectedAnswers[currentQuestion.id] as string[]) || [];
                    const isSelected = selectedOptions.includes(option);
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
                          isSelected && "bg-accent/30 border-primary"
                        )}
                        onClick={() => onAnswerSelect(option, true)}
                      >
                        <Checkbox 
                          id={`checkbox-${idx}`} 
                          checked={isSelected}
                          onCheckedChange={() => onAnswerSelect(option, true)}
                        />
                        <Label htmlFor={`checkbox-${idx}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
