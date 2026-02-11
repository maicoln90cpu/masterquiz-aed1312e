import React, { useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FileQuestion, Plus, Trash2, AlertCircle, CheckCircle2, Edit3, HelpCircle, ListChecks, CheckSquare, MessageSquare, Image as ImageIcon, Video, Music, Blocks } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// ✅ Memoizado para evitar re-renders desnecessários
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDeleteIndex, setQuestionToDeleteIndex] = useState<number | null>(null);
  
  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setQuestionToDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDeleteIndex !== null) {
      onDeleteQuestion(questionToDeleteIndex);
    }
    setDeleteConfirmOpen(false);
    setQuestionToDeleteIndex(null);
  };
  
  // ✅ Função para remover HTML e deixar apenas texto
  const stripHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };
  
  // Check if a question is complete
  const isQuestionComplete = (question: any) => {
    const questionBlock = question.blocks?.find((b: any) => b.type === 'question');
    const hasText = questionBlock?.content?.trim().length > 0 || question.question_text?.trim().length > 0;
    const hasOptions = questionBlock?.options?.length > 0 || question.options?.length > 0;
    return hasText && hasOptions;
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
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
            className="h-7 w-7 p-0"
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
        <Progress 
          value={(questions.length / questionsPerQuizLimit) * 100} 
          className="h-2"
        />
      </div>

      {/* Alerta de limite */}
      {questions.length >= questionsPerQuizLimit * 0.8 && (
        <Alert 
          variant={questions.length >= questionsPerQuizLimit ? "destructive" : "default"} 
          className="mx-4 mt-4"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {questions.length >= questionsPerQuizLimit
              ? t('createQuiz.questionsAtLimit', { limit: questionsPerQuizLimit })
              : t('createQuiz.questionsNearLimit', { current: questions.length, limit: questionsPerQuizLimit })}
          </AlertDescription>
        </Alert>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {questions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground italic">
                {t('createQuiz.noQuestionsYet')}
              </p>
            </div>
          ) : (
            <>
              {questions.map((q, index) => {
                const questionBlock = q.blocks?.find((b: any) => b.type === 'question');
                const questionText = questionBlock?.content || q.question_text || '';
                const customLabel = q.custom_label || '';
                // ✅ Limpar HTML do texto para exibição
                const cleanText = stripHtml(questionText);
                const displayText = customLabel || cleanText || t('createQuiz.emptyQuestion');
                const isTruncated = cleanText.length > 50;
                const isComplete = isQuestionComplete(q);
                const isEditing = editingIndex === index;
                
                // ✅ Detectar tipo de pergunta
                const answerFormat = questionBlock?.answerFormat || q.answer_format || 'single_choice';
                const getQuestionTypeIcon = () => {
                  switch (answerFormat) {
                    case 'yes_no':
                      return <CheckSquare className="h-3.5 w-3.5" />;
                    case 'single_choice':
                      return <ListChecks className="h-3.5 w-3.5" />;
                    case 'multiple_choice':
                      return <CheckSquare className="h-3.5 w-3.5" />;
                    case 'short_text':
                      return <MessageSquare className="h-3.5 w-3.5" />;
                    default:
                      return <HelpCircle className="h-3.5 w-3.5" />;
                  }
                };
                
                // ✅ Detectar mídia
                const hasImage = q.blocks?.some((b: any) => b.type === 'image');
                const hasVideo = q.blocks?.some((b: any) => b.type === 'video');
                const hasAudio = q.blocks?.some((b: any) => b.type === 'audio');
                const firstMediaBlock = q.blocks?.find((b: any) => 
                  ['image', 'video', 'audio'].includes(b.type)
                );
                
                // ✅ Contador de blocos
                const blockCount = q.blocks?.length || 0;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-full text-left p-3 rounded-md transition-all relative group border",
                      currentStep === 3 && currentQuestionIndex === index
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start gap-2 pr-20">
                      {/* Thumbnail de Mídia */}
                      {firstMediaBlock && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted border border-border">
                          {firstMediaBlock.type === 'image' && firstMediaBlock.url && (
                            <img 
                              src={firstMediaBlock.url} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {firstMediaBlock.type === 'video' && (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Video className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {firstMediaBlock.type === 'audio' && (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Music className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => onQuestionClick(index)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingLabel(customLabel || cleanText || '');
                          setEditingIndex(index);
                        }}
                        className="flex-1 flex items-start gap-2 min-w-0"
                      >
                        <div className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                          currentStep === 3 && currentQuestionIndex === index
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              {getQuestionTypeIcon()}
                              {t('createQuiz.questionNumber', { number: index + 1 })}
                            </span>
                            {isComplete && (
                              <span className="inline-flex h-2 w-2 rounded-full bg-green-500" title="Pergunta completa" />
                            )}
                            {/* Contador de blocos */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                              <Blocks className="h-2.5 w-2.5" />
                              {blockCount}
                            </span>
                          </div>
                          
                          {isEditing ? (
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              onBlur={() => {
                                if (onUpdateQuestion) {
                                  onUpdateQuestion(index, { custom_label: editingLabel });
                                }
                                setEditingIndex(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (onUpdateQuestion) {
                                    onUpdateQuestion(index, { custom_label: editingLabel });
                                  }
                                  setEditingIndex(null);
                                }
                                if (e.key === 'Escape') {
                                  setEditingIndex(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="h-7 text-sm"
                              placeholder={cleanText || t('createQuiz.emptyQuestion')}
                            />
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-sm font-medium max-w-[140px] truncate">
                                    {displayText}
                                  </div>
                                </TooltipTrigger>
                                {isTruncated && (
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p>{cleanText}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </button>
                    </div>
                    
                    <div className="absolute top-1.5 right-1 flex gap-0.5 z-30 bg-card border border-border rounded-md p-0.5 shadow-sm min-w-fit shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLabel(customLabel || questionText || '');
                          setEditingIndex(index);
                        }}
                        className="h-7 w-7 p-0 hover:bg-primary/10 flex-shrink-0"
                        title={t('createQuiz.renameQuestion')}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteClick(e, index)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 flex-shrink-0"
                        title={t('createQuiz.deleteQuestion')}
                        disabled={questions.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('createQuiz.deleteConfirmTitle', 'Excluir pergunta?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('createQuiz.deleteQuestionConfirm', 'Esta ação não pode ser desfeita. A pergunta será removida permanentemente do quiz.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Excluir')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

QuestionsList.displayName = 'QuestionsList';
