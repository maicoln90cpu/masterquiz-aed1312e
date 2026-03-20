import React, { useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FileQuestion, Plus, Trash2, AlertCircle, Edit3, Copy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface QuestionsListProps {
  questions: any[];
  currentStep: number;
  currentQuestionIndex?: number;
  onQuestionClick: (index: number) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (index: number) => void;
  onUpdateQuestion?: (index: number, updates: any) => void;
  questionsPerQuizLimit?: number;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const isQuestionComplete = (question: any) => {
  const questionBlock = question.blocks?.find((b: any) => b.type === 'question');
  const hasText = questionBlock?.questionText?.trim().length > 0 || question.question_text?.trim().length > 0;
  const hasOptions = questionBlock?.options?.length > 0 || question.options?.length > 0;
  return hasText && hasOptions;
};

export const QuestionsList = memo(({ 
  questions, 
  currentStep, 
  currentQuestionIndex = 0,
  onQuestionClick,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  questionsPerQuizLimit = 10
}: QuestionsListProps) => {
  const { t } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onDeleteQuestion(index);
  };

  const startEditing = (e: React.MouseEvent, index: number, currentLabel: string, questionText: string) => {
    e.stopPropagation();
    setEditingLabel(currentLabel || questionText || '');
    setEditingIndex(index);
  };

  const finishEditing = () => {
    if (editingIndex !== null && onUpdateQuestion) {
      onUpdateQuestion(editingIndex, { custom_label: editingLabel });
    }
    setEditingIndex(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FileQuestion className="h-4 w-4" />
            {t('createQuiz.questionsList')}
          </h3>
          <Button
            id="add-question-btn"
            size="sm"
            variant="ghost"
            onClick={onAddQuestion}
            disabled={questions.length >= questionsPerQuizLimit}
            className="h-7 w-7 p-0 flex-shrink-0"
            title={questions.length >= questionsPerQuizLimit 
              ? t('createQuiz.questionsLimitReached', { limit: questionsPerQuizLimit })
              : t('createQuiz.addQuestion')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {questions.length}/{questionsPerQuizLimit} {t('createQuiz.appearance.questions')}
        </p>
        <Progress value={(questions.length / questionsPerQuizLimit) * 100} className="h-2" />
      </div>

      {/* Alerta de limite */}
      {questions.length >= questionsPerQuizLimit * 0.8 && (
        <Alert 
          variant={questions.length >= questionsPerQuizLimit ? "destructive" : "default"} 
          className="mx-4 mt-4 flex-shrink-0"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {questions.length >= questionsPerQuizLimit
              ? t('createQuiz.questionsAtLimit', { limit: questionsPerQuizLimit })
              : t('createQuiz.questionsNearLimit', { current: questions.length, limit: questionsPerQuizLimit })}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {questions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground italic">
                {t('createQuiz.noQuestionsYet')}
              </p>
            </div>
          ) : (
            questions.map((q, index) => {
              const questionBlock = q.blocks?.find((b: any) => b.type === 'question');
              const questionText = questionBlock?.questionText || q.question_text || '';
              const customLabel = q.custom_label || '';
              const cleanText = stripHtml(questionText);
              const displayText = customLabel || cleanText || t('createQuiz.emptyQuestion');
              const isComplete = isQuestionComplete(q);
              const isEditing = editingIndex === index;
              const isActive = currentStep === 3 && currentQuestionIndex === index;

              return (
                <div
                  key={q.id || index}
                  className={cn(
                    "w-full text-left p-2 rounded-md transition-all border",
                    isActive
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {/* Badge numérico */}
                    <button
                      onClick={() => onQuestionClick(index)}
                      className="flex-shrink-0 relative mt-0.5"
                      type="button"
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      {isComplete && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
                      )}
                    </button>

                    {/* Texto — 2 linhas max */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onQuestionClick(index)}
                      onDoubleClick={(e) => startEditing(e, index, customLabel, questionText)}
                    >
                      {isEditing ? (
                        <Input
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onBlur={finishEditing}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishEditing();
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="h-6 text-xs py-0 px-1 min-h-0"
                          placeholder={cleanText || t('createQuiz.emptyQuestion')}
                        />
                      ) : (
                        <p className="text-xs font-medium text-left line-clamp-2 break-words">
                          {displayText}
                        </p>
                      )}
                    </div>

                    {/* Ícones fixos à direita */}
                    <div className="flex-shrink-0 flex items-center gap-0.5 mt-0.5">
                      <button
                        type="button"
                        onClick={(e) => startEditing(e, index, customLabel, questionText)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={t('createQuiz.editQuestion', 'Editar')}
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, index)}
                        className={cn(
                          "h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 text-destructive transition-colors",
                          questions.length <= 1 && "opacity-50 pointer-events-none"
                        )}
                        disabled={questions.length <= 1}
                        title={t('createQuiz.deleteQuestion')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

    </div>
  );
});

QuestionsList.displayName = 'QuestionsList';
