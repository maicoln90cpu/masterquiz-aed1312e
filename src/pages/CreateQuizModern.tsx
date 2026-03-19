import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save, Eye, Loader2, RotateCcw, AlertTriangle, Rocket, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { QuestionConfigStep } from "@/components/quiz/QuestionConfigStep";
import { AppearanceConfigStep } from "@/components/quiz/AppearanceConfigStep";
import { VisitorFormConfigStep } from "@/components/quiz/VisitorFormConfigStep";
import { ResultsConfigStep } from "@/components/quiz/ResultsConfigStep";
import { QuizTemplateSelector } from "@/components/quiz/QuizTemplateSelector";
import { AIQuizGenerator } from "@/components/quiz/AIQuizGenerator";
import { FloatingTutorial } from "@/components/quiz/FloatingTutorial";
import { QuestionsList } from "@/components/quiz/QuestionsList";
import { CompactBlockPalette } from "@/components/quiz/blocks/CompactBlockPalette";
import { UndoRedoControls } from "@/components/quiz/UndoRedoControls";
import { UnifiedQuizPreview } from "@/components/quiz/UnifiedQuizPreview";
import { QuizProgressIndicator } from "@/components/quiz/QuizProgressIndicator";
import { QuickAddToolbar } from "@/components/quiz/QuickAddToolbar";
import { AutoSaveIndicator } from "@/components/quiz/AutoSaveIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { createBlock } from "@/types/blocks";
import { ExpressProgressBar } from "@/components/quiz/ExpressProgressBar";
import { ExpressCelebration } from "@/components/quiz/ExpressCelebration";

import { useQuizState } from "@/hooks/useQuizState";
import { useQuizPersistence } from "@/hooks/useQuizPersistence";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { useQuizTemplateSelection } from "@/hooks/useQuizTemplateSelection";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useEditorInteractionTracker } from "@/hooks/useEditorInteractionTracker";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { useProfile } from "@/hooks/useProfile";

/**
 * CreateQuizModern — Layout "Modern" do editor de quiz.
 * 
 * Diferenças do Classic:
 * - Etapas em barra horizontal abaixo do header (1-5 + Preview)
 * - Step 1: Quantidade de Perguntas + Formato (showResults movido aqui)
 * - Step 3: Painel de propriedades do bloco selecionado no lado direito
 * - Sem aside direito com toggle Preview/Steps
 * 
 * Este componente será iterado independentemente do Classic.
 * Por enquanto é um placeholder funcional que renderiza o layout básico.
 */

interface ModernStepInfo {
  number: number;
  label: string;
  completed: boolean;
}

const CreateQuizModern = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { getQuestionsPerQuizLimit } = useSubscriptionLimits();
  const { profile } = useProfile();

  const isEditMode = !!searchParams.get('id');
  const isExpressMode = searchParams.get('mode') === 'express';
  const [showCelebration, setShowCelebration] = useState(false);
  const [publishedQuizUrl, setPublishedQuizUrl] = useState('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const { hasInteracted, trackInteraction } = useEditorInteractionTracker(searchParams.get('id'));

  const firedEventsRef = useRef(new Set<string>());
  const fireOnce = useCallback((event: string, data: Record<string, unknown> = {}) => {
    const quizId = searchParams.get('id');
    const key = `${event}_${quizId}`;
    if (firedEventsRef.current.has(key)) return;
    firedEventsRef.current.add(key);
    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...data });
  }, [searchParams]);

  const {
    uiState,
    editorState,
    appearanceState,
    formConfigState,
    questions,
    updateUI,
    updateEditor,
    updateAppearance,
    updateFormConfig,
    setQuestions,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    handleQuestionsUpdate,
    updateCurrentQuestionBlocks,
    handleQuestionClick,
    clearAndStartFresh,
    clearHistory,
    initializeEmptyQuestions,
  } = useQuizState({
    isEditMode,
    questionsLimit: 10
  });

  const {
    autoSaveStatus,
    lastSavedToSupabase,
    hasUnsavedChanges,
    isOnline,
    isSavingDraft,
    loadExistingQuiz,
    saveQuiz,
    saveDraftToSupabase,
    clearLocalStorage,
    getStorageKey,
  } = useQuizPersistence({
    editorState,
    appearanceState,
    formConfigState,
    questions,
    updateEditor,
    updateAppearance,
    updateFormConfig,
    setQuestions,
    updateUI,
    clearHistory,
    initializeEmptyQuestions,
  });

  const {
    handleAddQuestion,
    handleDuplicateQuestion,
    handleRemoveQuestion,
    handleReorderQuestions,
  } = useQuizQuestions({
    questions,
    setQuestions: handleQuestionsUpdate,
    editorState,
    updateEditor,
    trackInteraction,
  });

  const {
    handleTemplateSelect,
  } = useQuizTemplateSelection({
    updateAppearance,
    updateUI,
  });

  // Load quiz in edit mode
  useEffect(() => {
    const quizId = searchParams.get('id');
    if (isEditMode && quizId) {
      loadExistingQuiz(quizId);
    }
  }, [isEditMode, searchParams, loadExistingQuiz]);

  // Steps definition
  const steps: ModernStepInfo[] = useMemo(() => [
    { number: 1, label: t('createQuiz.step1Title', 'Quantidade e Formato'), completed: editorState.step > 1 },
    { number: 2, label: t('createQuiz.step2Title', 'Aparência'), completed: editorState.step > 2 },
    { number: 3, label: t('createQuiz.step3Title', 'Perguntas'), completed: editorState.step > 3 },
    { number: 4, label: t('createQuiz.step4Title', 'Coleta de Dados'), completed: editorState.step > 4 },
    { number: 5, label: t('createQuiz.step5Title', 'Resultados'), completed: editorState.step > 5 },
  ], [editorState.step, t]);

  const handleStepClick = useCallback((step: number) => {
    updateEditor({ step });
  }, [updateEditor]);

  // Template selector / AI generator
  if (uiState.showTemplateSelector) {
    return (
      <QuizTemplateSelector
        onSelect={handleTemplateSelect}
        onBack={() => navigate('/meus-quizzes')}
        onAIGenerate={() => updateUI({ showTemplateSelector: false, showAIGenerator: true })}
      />
    );
  }

  if (uiState.showAIGenerator) {
    return (
      <AIQuizGenerator
        onBack={() => updateUI({ showAIGenerator: false, showTemplateSelector: true })}
      />
    );
  }

  if (uiState.isLoadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('createQuiz.loadingQuiz')}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* ========== HEADER ========== */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/meus-quizzes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.back')}
          </Button>
          <h1 className="text-lg font-bold truncate max-w-[200px]">
            {appearanceState.title || t('createQuiz.newQuiz', 'Novo Quiz')}
          </h1>
          <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSavedToSupabase} />
        </div>
        <div className="flex items-center gap-2">
          <UndoRedoControls
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            undoCount={undoCount}
            redoCount={redoCount}
          />
          <LanguageSwitch />
          <Button
            variant="default"
            size="sm"
            onClick={() => saveQuiz()}
            disabled={uiState.isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {t('common.save')}
          </Button>
        </div>
      </header>

      {/* ========== HORIZONTAL STEP BAR ========== */}
      <nav className="border-b bg-card/50 px-4 py-2 shrink-0">
        <div className="flex items-center gap-1 max-w-4xl mx-auto">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => handleStepClick(step.number)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                editorState.step === step.number
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : step.completed
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                editorState.step === step.number
                  ? "bg-primary-foreground text-primary"
                  : step.completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {step.completed && editorState.step !== step.number ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.number
                )}
              </span>
              <span className="hidden md:inline truncate">{step.label}</span>
            </button>
          ))}
          
          {/* Preview button */}
          <button
            onClick={() => setShowPreviewDialog(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={t('createQuiz.preview', 'Preview')}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline">{t('createQuiz.preview', 'Preview')}</span>
          </button>
        </div>
      </nav>

      {/* ========== EXPRESS PROGRESS BAR ========== */}
      {isExpressMode && (
        <ExpressProgressBar currentStep={editorState.step} totalSteps={5} />
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* STEP 1: Quantidade e Formato */}
          {editorState.step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('createQuiz.step1Title', 'Quantidade de Perguntas e Formato')}</CardTitle>
                <CardDescription>{t('createQuiz.step1Description', 'Defina quantas perguntas e o formato do seu quiz')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question count slider */}
                <div className="space-y-3">
                  <Label>{t('createQuiz.questionCount', 'Número de perguntas')}: <strong>{editorState.questionCount}</strong></Label>
                  <Slider
                    value={[editorState.questionCount]}
                    onValueChange={([val]) => updateEditor({ questionCount: val })}
                    min={1}
                    max={editorState.questionsLimit}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('createQuiz.questionCountHint', 'Máximo: {{max}} perguntas no seu plano', { max: editorState.questionsLimit })}
                  </p>
                </div>

                {/* Quiz format selector — NEW in Modern */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">{t('createQuiz.quizFormat', 'Formato do Quiz')}</Label>
                  <Select
                    value={appearanceState.showResults ? 'results' : 'funnel'}
                    onValueChange={(val) => {
                      updateAppearance({ showResults: val === 'results' });
                      trackInteraction();
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="results">
                        🏆 {t('createQuiz.formatResults', 'Com Resultados — Quiz tradicional com tela de resultado')}
                      </SelectItem>
                      <SelectItem value="funnel">
                        🔄 {t('createQuiz.formatFunnel', 'Formato Funil — Sem tela de resultados, foco em coleta')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {appearanceState.showResults
                      ? t('createQuiz.formatResultsHint', 'Os respondentes verão uma tela de resultado ao final do quiz.')
                      : t('createQuiz.formatFunnelHint', 'Sem tela de resultado. Ideal para funis de qualificação e captura de leads.')
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Aparência */}
          {editorState.step === 2 && (
            <AppearanceConfigStep
              title={appearanceState.title}
              setTitle={(v) => { updateAppearance({ title: v }); trackInteraction(); }}
              description={appearanceState.description}
              setDescription={(v) => { updateAppearance({ description: v }); trackInteraction(); }}
              template={appearanceState.template}
              setTemplate={(v) => { updateAppearance({ template: v }); trackInteraction(); }}
              logoUrl={appearanceState.logoUrl}
              setLogoUrl={(v) => { updateAppearance({ logoUrl: v }); trackInteraction(); }}
              showLogo={appearanceState.showLogo}
              setShowLogo={(v) => { updateAppearance({ showLogo: v }); trackInteraction(); }}
              showTitle={appearanceState.showTitle}
              setShowTitle={(v) => { updateAppearance({ showTitle: v }); trackInteraction(); }}
              showDescription={appearanceState.showDescription}
              setShowDescription={(v) => { updateAppearance({ showDescription: v }); trackInteraction(); }}
              showQuestionNumber={appearanceState.showQuestionNumber}
              setShowQuestionNumber={(v) => { updateAppearance({ showQuestionNumber: v }); trackInteraction(); }}
              showResults={appearanceState.showResults}
              setShowResults={(v) => { updateAppearance({ showResults: v }); trackInteraction(); }}
              progressStyle={appearanceState.progressStyle}
              setProgressStyle={(v) => { updateAppearance({ progressStyle: v }); trackInteraction(); }}
              quizId={editorState.quizId}
            />
          )}

          {/* STEP 3: Perguntas — layout com 3 colunas */}
          {editorState.step === 3 && (
            <div className="flex gap-4 -mx-4 px-4">
              {/* Left: Questions list */}
              <div className="w-64 shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('createQuiz.questions', 'Perguntas')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <QuestionsList
                      questions={questions}
                      currentIndex={editorState.currentQuestionIndex}
                      onQuestionClick={handleQuestionClick}
                      onAddQuestion={handleAddQuestion}
                      onDuplicateQuestion={handleDuplicateQuestion}
                      onRemoveQuestion={handleRemoveQuestion}
                      onReorderQuestions={handleReorderQuestions}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Center: Editor */}
              <div className="flex-1 min-w-0">
                <QuestionConfigStep
                  questions={questions}
                  currentQuestionIndex={editorState.currentQuestionIndex}
                  onQuestionsUpdate={handleQuestionsUpdate}
                  onQuestionClick={handleQuestionClick}
                  onUpdateBlocks={updateCurrentQuestionBlocks}
                  template={appearanceState.template}
                  onAddQuestion={handleAddQuestion}
                  onDuplicateQuestion={handleDuplicateQuestion}
                  onRemoveQuestion={handleRemoveQuestion}
                  onReorderQuestions={handleReorderQuestions}
                  trackInteraction={trackInteraction}
                />
              </div>

              {/* Right: Block Properties Panel (placeholder) */}
              <div className="w-72 shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('createQuiz.blockProperties', 'Propriedades do Bloco')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    {editorState.selectedBlockIndex !== null && questions[editorState.currentQuestionIndex]?.blocks?.[editorState.selectedBlockIndex] ? (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-2">
                          {questions[editorState.currentQuestionIndex].blocks![editorState.selectedBlockIndex].type}
                        </p>
                        <p className="text-xs">
                          {t('createQuiz.blockPropertiesHint', 'As propriedades deste bloco aparecerão aqui nas próximas fases.')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t('createQuiz.selectBlockHint', 'Selecione um bloco para ver suas propriedades')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* STEP 4: Coleta de Dados */}
          {editorState.step === 4 && (
            <VisitorFormConfigStep
              collectionTiming={formConfigState.collectionTiming}
              setCollectionTiming={(v) => { updateFormConfig({ collectionTiming: v }); trackInteraction(); }}
              collectName={formConfigState.collectName}
              setCollectName={(v) => { updateFormConfig({ collectName: v }); trackInteraction(); }}
              collectEmail={formConfigState.collectEmail}
              setCollectEmail={(v) => { updateFormConfig({ collectEmail: v }); trackInteraction(); }}
              collectWhatsapp={formConfigState.collectWhatsapp}
              setCollectWhatsapp={(v) => { updateFormConfig({ collectWhatsapp: v }); trackInteraction(); }}
              deliveryTiming={formConfigState.deliveryTiming}
              setDeliveryTiming={(v) => { updateFormConfig({ deliveryTiming: v }); trackInteraction(); }}
              quizId={editorState.quizId}
            />
          )}

          {/* STEP 5: Resultados */}
          {editorState.step === 5 && (
            <ResultsConfigStep
              quizId={editorState.quizId}
              questions={questions}
              showResults={appearanceState.showResults}
            />
          )}
        </div>
      </div>

      {/* ========== FOOTER NAV ========== */}
      <footer className="border-t bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          onClick={() => {
            if (editorState.step > 1) updateEditor({ step: editorState.step - 1 });
          }}
          disabled={editorState.step <= 1}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.previous', 'Anterior')}
        </Button>

        <div className="text-sm text-muted-foreground">
          {t('createQuiz.stepOf', 'Etapa {{current}} de {{total}}', { current: editorState.step, total: 5 })}
        </div>

        {editorState.step < 5 ? (
          <Button
            onClick={() => updateEditor({ step: editorState.step + 1 })}
          >
            {t('common.next', 'Próximo')}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => saveQuiz()}
            disabled={uiState.isSaving}
          >
            <Rocket className="h-4 w-4 mr-1" />
            {t('createQuiz.publish', 'Publicar')}
          </Button>
        )}
      </footer>

      {/* ========== PREVIEW DIALOG ========== */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('createQuiz.preview', 'Preview')}</DialogTitle>
            <DialogDescription>{t('createQuiz.previewDescription', 'Visualize como seu quiz ficará para os respondentes')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <UnifiedQuizPreview
              questions={questions}
              title={appearanceState.title}
              description={appearanceState.description}
              template={appearanceState.template}
              logoUrl={appearanceState.logoUrl}
              showLogo={appearanceState.showLogo}
              showTitle={appearanceState.showTitle}
              showDescription={appearanceState.showDescription}
              showQuestionNumber={appearanceState.showQuestionNumber}
              progressStyle={appearanceState.progressStyle}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Express celebration */}
      {showCelebration && (
        <ExpressCelebration onClose={() => setShowCelebration(false)} />
      )}
    </main>
  );
};

export default CreateQuizModern;
