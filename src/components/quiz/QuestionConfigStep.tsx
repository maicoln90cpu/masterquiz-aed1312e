import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Edit, Eye } from "lucide-react";
import { BlockEditor } from "./blocks/BlockEditor";
import { QuizBlockPreview } from "./QuizBlockPreview";
import { AISuggestionsSidebar } from "./AISuggestionsSidebar";
import { ConditionBuilder, type QuestionConditions } from "./ConditionBuilder";
import type { QuizBlock } from "@/types/blocks";
import { createBlock, migrateQuestionToBlocks, normalizeOption } from "@/types/blocks";
import { cn } from "@/lib/utils";

interface QuestionConfigStepProps {
  questions: any[];
  questionCount: number;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
  quizTitle: string;
  quizDescription: string;
  quizId?: string;
  onQuestionsUpdate: (questions: any[]) => void;
  initialQuestionIndex?: number;
  /** Whether we're in express mode (for milestone events/banners) */
  isExpressMode?: boolean;
  /** Fire idempotent GTM events (1x per quizId) */
  fireOnce?: (event: string, data?: Record<string, unknown>) => void;
  /** Track real user interactions for PQL */
  trackInteraction?: (actionKey: string) => void;
}

interface QuestionWithConditions {
  id: string;
  blocks: QuizBlock[];
  conditions?: QuestionConditions | null;
}

export const QuestionConfigStep = ({ 
  questions,
  questionCount, 
  isPublic, 
  onPublicChange,
  quizTitle,
  quizDescription,
  quizId,
  onQuestionsUpdate,
  initialQuestionIndex = 0,
  isExpressMode = false,
  fireOnce,
  trackInteraction,
}: QuestionConfigStepProps) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [allQuestions, setAllQuestions] = useState<QuestionWithConditions[]>([]);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");
  // ✅ REMOVIDO: saveTimeoutRef - persistência centralizada em useAutoSave/useQuizPersistence
  
  // ✅ Ref para evitar loop infinito de sincronização
  const questionsHashRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Preparar lista de perguntas anteriores para o ConditionBuilder
  // ✅ Proteção contra blocks undefined com optional chaining
  const availableQuestionsForConditions = useMemo(() => allQuestions
    .slice(0, currentQuestionIndex)
    .map((q, idx) => {
      const questionBlock = q.blocks?.find(b => b.type === 'question');
      return {
        id: q.id,
        text: questionBlock && 'questionText' in questionBlock 
          ? questionBlock.questionText 
          : `Pergunta ${idx + 1}`,
        options: questionBlock && 'options' in questionBlock 
          ? ((questionBlock.options || []) as unknown[]).map(normalizeOption)
          : []
      };
    }), [allQuestions, currentQuestionIndex]);

  // Handler para atualizar condições da pergunta atual - estabilizado
  // ✅ Proteção contra índice inválido
  const handleConditionsChange = useCallback((conditions: QuestionConditions | null) => {
    setAllQuestions(prev => {
      // ✅ Verificar se o índice é válido antes de atualizar
      if (!prev[currentQuestionIndex]) {
        logger.warn('[handleConditionsChange] Índice inválido:', currentQuestionIndex, 'total:', prev.length);
        return prev;
      }
      
      const updatedQuestions = [...prev];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        conditions
      };
      // Notificar parent de forma assíncrona para evitar loop
      setTimeout(() => onQuestionsUpdate(updatedQuestions), 0);
      return updatedQuestions;
    });
    // ✅ Persistência centralizada - sem save direto aqui
  }, [currentQuestionIndex, onQuestionsUpdate]);

  // ✅ Sync with parent questions - SEMPRE sincronizar com questions do pai
  // ❌ REMOVIDO: branch que criava perguntas localmente (causava dessincronização)
  useEffect(() => {
    const newHash = JSON.stringify(questions?.map(q => ({ id: q.id, blocksCount: q.blocks?.length || 0 })) || []);
    
    // Só atualiza se houver mudança real nos IDs das questions
    if (questions && questions.length > 0 && newHash !== questionsHashRef.current) {
      questionsHashRef.current = newHash;
      
      // ✅ Garantir que todas as questões tenham blocks válidos
      const validatedQuestions = questions.map((q, idx) => ({
        ...q,
        id: q.id || `temp-${Date.now()}-${idx}`,
        blocks: q.blocks && Array.isArray(q.blocks) && q.blocks.length > 0
          ? q.blocks
          : [createBlock('question', 0)]
      }));
      
      setAllQuestions(validatedQuestions);
      isInitializedRef.current = true;
    } else if (!questions?.length && quizId && !isInitializedRef.current) {
      loadQuestions();
    }
    // ❌ REMOVIDO: else branch que criava perguntas com id 'q1', 'q2' 
    // Isso causava dessincronização com CreateQuiz.tsx
  }, [questions, quizId, questionCount]);

  // Sync current question index
  useEffect(() => {
    setCurrentQuestionIndex(initialQuestionIndex);
  }, [initialQuestionIndex]);

  const loadQuestions = async () => {
    if (!quizId) return;
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_number');

    if (error) {
      logger.error('Error loading questions:', error);
      return;
    }

    if (data && data.length > 0) {
      const loadedQuestions = data.map(q => {
        // If blocks exist and are not empty, use them
        if (q.blocks && Array.isArray(q.blocks) && q.blocks.length > 0) {
          return {
            id: q.id,
            blocks: JSON.parse(JSON.stringify(q.blocks)) as QuizBlock[],
            conditions: q.conditions ? (q.conditions as unknown as QuestionConditions) : null
          };
        }
        
        // Otherwise migrate from old format
        const migratedBlocks = migrateQuestionToBlocks(
          q.question_text,
          q.answer_format,
          q.options as any,
          q.media_url || undefined,
          q.media_type || undefined
        );
        
        return {
          id: q.id,
          blocks: migratedBlocks,
          conditions: q.conditions ? (q.conditions as unknown as QuestionConditions) : null
        };
      });
      setAllQuestions(loadedQuestions);
    }
  };

  // ✅ REMOVIDO: saveCurrentQuestion() - persistência centralizada em useAutoSave/useQuizPersistence
  // O estado local é propagado ao parent via onQuestionsUpdate, e o auto-save global persiste no DB.

  // ✅ Estabilizado para evitar re-criação e loop
  // ✅ Proteção contra índice inválido
  const updateCurrentQuestionBlocks = useCallback((blocks: QuizBlock[]) => {
    setAllQuestions(prev => {
      if (!prev[currentQuestionIndex]) {
        logger.warn('[updateCurrentQuestionBlocks] Índice inválido:', currentQuestionIndex, 'total:', prev.length);
        return prev;
      }
      
      const updatedQuestions = [...prev];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        blocks
      };
      setTimeout(() => onQuestionsUpdate(updatedQuestions), 0);
      return updatedQuestions;
    });

    // Track real interaction for PQL v2
    if (trackInteraction) {
      trackInteraction(`block_edit_q${currentQuestionIndex}`);
    }
  }, [currentQuestionIndex, onQuestionsUpdate, trackInteraction]);

  const handleAddBlockFromSuggestion = (block: QuizBlock, position: 'before' | 'after') => {
    const currentBlocks = currentQuestion?.blocks || [];
    const questionBlockIndex = currentBlocks.findIndex(b => b.type === 'question');
    
    let updatedBlocks: QuizBlock[];
    if (position === 'before' && questionBlockIndex !== -1) {
      // Insert before question block
      updatedBlocks = [
        ...currentBlocks.slice(0, questionBlockIndex),
        block,
        ...currentBlocks.slice(questionBlockIndex)
      ];
    } else {
      // Insert after question block (or at end if no question block)
      const insertIndex = questionBlockIndex !== -1 ? questionBlockIndex + 1 : currentBlocks.length;
      updatedBlocks = [
        ...currentBlocks.slice(0, insertIndex),
        block,
        ...currentBlocks.slice(insertIndex)
      ];
    }

    // Reorder blocks
    updatedBlocks = updatedBlocks.map((b, idx) => ({ ...b, order: idx }));
    updateCurrentQuestionBlocks(updatedBlocks);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Express milestone events (idempotent via fireOnce)
      if (isExpressMode && fireOnce) {
        if (nextIndex >= 1) fireOnce('express_q2_reached', { quiz_id: quizId });
        if (nextIndex >= 3) fireOnce('express_halfway', { quiz_id: quizId });
        if (nextIndex >= allQuestions.length - 1) fireOnce('express_completed', { quiz_id: quizId });
      }

      // PQL v2: Promover explorador → iniciado ao atingir pergunta 2
      if (isExpressMode && nextIndex >= 1) {
        import('@/integrations/supabase/client').then(({ supabase }) => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('profiles')
                .update({ user_stage: 'iniciado', stage_updated_at: new Date().toISOString() })
                .eq('id', user.id)
                .eq('user_stage', 'explorador')
                .then(() => logger.log('🎯 [PQL] Promoted to iniciado (reached Q2)'));
            }
          });
        });
      }
    }
  };

  const currentQuestion = allQuestions[currentQuestionIndex];

  // Extract AI suggestions from question block
  const questionBlock = currentQuestion?.blocks?.find(b => b.type === 'question');
  const aiSuggestions = questionBlock && 'aiSuggestions' in questionBlock ? questionBlock.aiSuggestions : null;

  // ✅ Guard: Se não houver questões ainda, mostrar loading
  if (allQuestions.length === 0 || !currentQuestion) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('createQuiz.questionConfig.title')}</CardTitle>
            <CardDescription>{t('createQuiz.questionConfig.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground text-sm">Carregando perguntas...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('createQuiz.questionConfig.title')}</CardTitle>
          <CardDescription>{t('createQuiz.questionConfig.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Visibility */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">
                {t('createQuiz.questionConfig.visibility')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? t('createQuiz.questionConfig.publicDesc')
                  : t('createQuiz.questionConfig.privateDesc')
                }
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={onPublicChange}
            />
          </div>

          {/* Express motivational banners */}
          {isExpressMode && currentQuestionIndex === 3 && allQuestions.length >= 7 && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center text-sm text-green-800 dark:text-green-200">
              🚀 {t('express.bannerHalfway', 'Você já está na metade. Do jeito que está, já funciona.')}
            </div>
          )}
          {isExpressMode && currentQuestionIndex === allQuestions.length - 1 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center text-sm text-blue-800 dark:text-blue-200">
              {t('express.bannerFinal', 'Ao avançar, seu quiz será publicado automaticamente.')}
            </div>
          )}

          {/* Question Navigation */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="gap-2 font-semibold"
            >
              <ChevronLeft className="h-5 w-5" />
              Anterior
            </Button>

            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                Pergunta {currentQuestionIndex + 1} de {allQuestions.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(((currentQuestionIndex + 1) / allQuestions.length) * 100)}% concluído
              </div>
            </div>

            <Button
              type="button"
              size="default"
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === allQuestions.length - 1}
              className="gap-2 font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
            >
              Próxima
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Block Editor with Preview and AI Suggestions */}
          <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "edit" | "preview")}>
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="edit" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar Blocos
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="gap-2 bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white hover:from-violet-600 hover:to-purple-600 data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  Preview em Tempo Real
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0">
              <div className="flex flex-col w-full">
                <div className="w-full">
                  <BlockEditor
                    blocks={currentQuestion.blocks}
                    onChange={updateCurrentQuestionBlocks}
                    totalQuestions={allQuestions.length}
                    currentQuestionIndex={currentQuestionIndex}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="w-full space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Como os participantes verão:</CardTitle>
                    <CardDescription className="text-xs">
                      Preview em tempo real da pergunta {currentQuestionIndex + 1}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <div className="quiz-preview-scaled">
                  <QuizBlockPreview blocks={currentQuestion.blocks} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Condition Builder - Lógica Condicional */}
          <ConditionBuilder
            conditions={currentQuestion.conditions || null}
            onChange={handleConditionsChange}
            availableQuestions={availableQuestionsForConditions}
            currentQuestionIndex={currentQuestionIndex}
          />

        </CardContent>
      </Card>
    </div>
  );
};
