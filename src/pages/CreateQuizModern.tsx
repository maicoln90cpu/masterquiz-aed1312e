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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { QuestionConfigStep } from "@/components/quiz/QuestionConfigStep";
import { BlockPropertiesPanel } from "@/components/quiz/blocks/BlockPropertiesPanel";
import { AppearanceConfigStep } from "@/components/quiz/AppearanceConfigStep";
import { VisitorFormConfigStep } from "@/components/quiz/VisitorFormConfigStep";
import { ResultsConfigStep } from "@/components/quiz/ResultsConfigStep";
import { QuizTemplateSelector } from "@/components/quiz/QuizTemplateSelector";
import { AIQuizGenerator } from "@/components/quiz/AIQuizGenerator";
import { UndoRedoControls } from "@/components/quiz/UndoRedoControls";
import { UnifiedQuizPreview } from "@/components/quiz/UnifiedQuizPreview";
import { AutoSaveIndicator } from "@/components/quiz/AutoSaveIndicator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
 * - Step 1: "Quantidade e Formato" (showResults movido aqui)
 * - Step 3: Painel de propriedades do bloco selecionado (placeholder)
 * - Sem aside direito com toggle Preview/Steps
 * - Preview via dialog fullscreen (botão 👁)
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

  // ✅ Hook de estado principal
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

  // ✅ Hook de persistência (same interface as Classic)
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
    quizId: editorState.quizId,
    appearanceState,
    formConfigState,
    editorState,
    questions,
    updateUI,
    updateEditor,
    updateAppearance,
    updateFormConfig,
    setQuestions,
    clearHistory,
    hasUserInteracted: hasInteracted,
    isExpressMode,
  });

  // ✅ Hook de manipulação de perguntas
  const {
    handleAddQuestion,
    handleDeleteQuestion,
    confirmDeleteQuestion,
    updateQuestion,
  } = useQuizQuestions({
    questions,
    setQuestions,
    questionsLimit: editorState.questionsLimit,
    currentQuestionIndex: editorState.currentQuestionIndex,
    updateEditor,
    updateUI,
  });

  // ✅ Hook de seleção de template
  const {
    handleSelectTemplate,
    handleCreateFromScratch,
    handleCreateWithAI,
    handleBackFromAI,
  } = useQuizTemplateSelection({
    updateUI,
    updateAppearance,
    updateFormConfig,
    updateEditor,
    setQuestions,
  });

  // ✅ Load limits
  useEffect(() => {
    const loadLimit = async () => {
      const limit = await getQuestionsPerQuizLimit();
      updateEditor({ questionsLimit: limit });
    };
    loadLimit();
  }, [getQuestionsPerQuizLimit, updateEditor]);

  // ✅ Load existing quiz
  useEffect(() => {
    const editQuizId = searchParams.get('id');
    if (editQuizId) {
      loadExistingQuiz(editQuizId);
      if (isExpressMode) {
        updateEditor({ step: 3 });
        updateUI({ showTemplateSelector: false });
        fireOnce('express_started', { quiz_id: editQuizId });
      }
    }
  }, [searchParams, loadExistingQuiz, isExpressMode, updateEditor, updateUI, fireOnce]);

  // ✅ Clear localStorage when not editing
  useEffect(() => {
    const editQuizId = searchParams.get('id');
    if (!editQuizId) {
      clearLocalStorage();
    }
  }, [searchParams, clearLocalStorage]);

  // ✅ Handler para publicar
  const handlePublish = useCallback(async () => {
    const result = await saveQuiz();
    if (result?.success && isExpressMode) {
      const slug = result.slug;
      const url = profile?.company_slug
        ? `${window.location.origin}/${profile.company_slug}/${slug}`
        : `${window.location.origin}/quiz/${slug}`;
      setPublishedQuizUrl(url);
      setShowCelebration(true);
    }
  }, [saveQuiz, isExpressMode, profile?.company_slug]);

  const expressQuizUrl = useMemo(() => {
    if (!editorState.quizSlug) return '';
    return profile?.company_slug
      ? `${window.location.origin}/${profile.company_slug}/${editorState.quizSlug}`
      : `${window.location.origin}/quiz/${editorState.quizSlug}`;
  }, [editorState.quizSlug, profile?.company_slug]);

  // Steps definition
  const steps: ModernStepInfo[] = useMemo(() => [
    { number: 1, label: t('createQuiz.step1Title', 'Quantidade e Formato'), completed: editorState.step > 1 },
    { number: 2, label: t('createQuiz.step2Title', 'Aparência'), completed: editorState.step > 2 },
    { number: 3, label: t('createQuiz.step3Title', 'Perguntas'), completed: editorState.step > 3 },
    { number: 4, label: t('createQuiz.step4Title', 'Coleta de Dados'), completed: editorState.step > 4 },
    { number: 5, label: t('createQuiz.step5Title', 'Resultados'), completed: false },
  ], [editorState.step, t]);

  const handleStepClick = useCallback((step: number) => {
    updateEditor({ step });
  }, [updateEditor]);

  // ============================================
  // RENDERS CONDICIONAIS
  // ============================================

  // Express Celebration
  if (showCelebration && isExpressMode) {
    return (
      <ExpressCelebration
        quizUrl={publishedQuizUrl || expressQuizUrl}
        quizTitle={appearanceState.title || t('createQuiz.newQuiz')}
        onGoToDashboard={() => {
          queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          navigate('/dashboard');
        }}
      />
    );
  }

  // AI Generator
  if (uiState.showAIGenerator) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">{t('createQuiz.title')}</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <AIQuizGenerator onBack={handleBackFromAI} />
        </div>
      </main>
    );
  }

  // Loading
  if (uiState.isLoadingQuiz) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('createQuiz.loadingQuiz')}</p>
        </div>
      </main>
    );
  }

  // Template Selector
  if (uiState.showTemplateSelector && !isEditMode && !isExpressMode) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="w-full max-w-full px-3 sm:px-4 py-3 sm:py-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('createQuiz.back')}
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold mt-2">{t('createQuiz.title')}</h1>
          </div>
        </header>
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <QuizTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            onCreateFromScratch={handleCreateFromScratch}
            onCreateWithAI={handleCreateWithAI}
          />
        </div>
      </main>
    );
  }

  // ============================================
  // DESTRUCTURE STATE
  // ============================================
  const { step, currentQuestionIndex, questionCount, questionsLimit, quizId, quizSlug } = editorState;
  const { title, description, template, logoUrl, showLogo, showTitle, showDescription, showQuestionNumber } = appearanceState;
  const { collectionTiming, collectName, collectEmail, collectWhatsapp, deliveryTiming } = formConfigState;
  const { isSaving } = uiState;

  // ============================================
  // RENDER PRINCIPAL — MODERN LAYOUT
  // ============================================
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* ========== HEADER ========== */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/meus-quizzes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t('createQuiz.back')}</span>
          </Button>
          <h1 className="text-lg font-bold truncate max-w-[200px]">
            {title || t('createQuiz.newQuiz', 'Novo Quiz')}
          </h1>
          <AutoSaveIndicator
            status={!isOnline ? 'offline' : autoSaveStatus}
            lastSavedAt={lastSavedToSupabase}
            hasQuizId={!!quizId}
            compact
          />
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
            onClick={handlePublish}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {t('common.save', 'Salvar')}
          </Button>
        </div>
      </header>

      {/* ========== EXPRESS PROGRESS ========== */}
      {isExpressMode && <ExpressProgressBar currentStep={1} />}

      {/* ========== HORIZONTAL STEP BAR ========== */}
      {!isExpressMode && (
        <nav className="border-b bg-card/50 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1 max-w-4xl mx-auto">
            {steps.map((s) => (
              <button
                key={s.number}
                onClick={() => handleStepClick(s.number)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
                  step === s.number
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : s.completed
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  step === s.number
                    ? "bg-primary-foreground text-primary"
                    : s.completed
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {s.completed && step !== s.number ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.number
                  )}
                </span>
                <span className="hidden md:inline truncate">{s.label}</span>
              </button>
            ))}
            
            {/* Preview button */}
            <button
              onClick={() => setShowPreviewDialog(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={t('createQuiz.preview', 'Preview')}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden lg:inline">{t('createQuiz.preview', 'Preview')}</span>
            </button>
          </div>
        </nav>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {/* STEP 1: Quantidade e Formato */}
          {step === 1 && !isExpressMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{t('createQuiz.step1.title', 'Quantidade de Perguntas e Formato')}</CardTitle>
                <CardDescription>{t('createQuiz.step1.description', 'Defina quantas perguntas e o formato do seu quiz')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Question count — same as Classic */}
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-4">
                    <p className="text-6xl font-bold text-primary">{questionCount}</p>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="question-count-input" className="text-sm text-muted-foreground">
                        {t('createQuiz.step1.questionQuantity', 'Quantidade')}
                      </Label>
                      <Input
                        id="question-count-input"
                        type="number"
                        min={1}
                        max={questionsLimit}
                        value={questionCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            updateEditor({ questionCount: Math.min(Math.max(1, value), questionsLimit) });
                          }
                        }}
                        className="w-20 h-12 text-center text-xl font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">{t('createQuiz.step1.adjustSlider', 'Ajuste a quantidade de perguntas')}</p>
                </div>

                <div className="space-y-4">
                  <Slider
                    value={[questionCount]}
                    onValueChange={(value) => updateEditor({ questionCount: value[0] })}
                    min={1}
                    max={questionsLimit}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 {t('common.question', 'pergunta')}</span>
                    <span>{questionsLimit} {t('common.questions', 'perguntas')}</span>
                  </div>
                  <div className="mt-3 p-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground text-center">
                      Seu plano permite até <strong>{questionsLimit}</strong> perguntas por quiz
                    </p>
                  </div>
                </div>

                {/* ✅ NOVO: Seletor de formato do quiz (exclusivo Modern) */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-base font-semibold">{t('createQuiz.quizFormat', 'Formato do Quiz')}</Label>
                  <Select
                    value={appearanceState.showResults ? 'results' : 'funnel'}
                    onValueChange={(val) => {
                      updateAppearance({ showResults: val === 'results' });
                      trackInteraction('quiz_format_changed');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="results">
                        🏆 {t('createQuiz.formatResults', 'Com Resultados — Quiz com tela de resultado')}
                      </SelectItem>
                      <SelectItem value="funnel">
                        🔄 {t('createQuiz.formatFunnel', 'Formato Funil — Sem resultados, foco em coleta')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {appearanceState.showResults
                      ? t('createQuiz.formatResultsHint', 'Os respondentes verão uma tela de resultado ao final.')
                      : t('createQuiz.formatFunnelHint', 'Sem tela de resultado. Ideal para funis de qualificação.')
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Aparência — hideShowResults (já configurado na Step 1) */}
          {step === 2 && !isExpressMode && (
            <AppearanceConfigStep
              title={title}
              description={description}
              template={template}
              onTitleChange={(v) => updateAppearance({ title: v })}
              onDescriptionChange={(v) => updateAppearance({ description: v })}
              onTemplateChange={(v) => updateAppearance({ template: v })}
              questionCount={questionCount}
              logoUrl={logoUrl}
              onLogoChange={(v) => updateAppearance({ logoUrl: v })}
              showLogo={showLogo}
              showTitle={showTitle}
              showDescription={showDescription}
              showQuestionNumber={showQuestionNumber}
              showResults={appearanceState.showResults}
              onShowLogoChange={(v) => updateAppearance({ showLogo: v })}
              onShowTitleChange={(v) => updateAppearance({ showTitle: v })}
              onShowDescriptionChange={(v) => updateAppearance({ showDescription: v })}
              onShowQuestionNumberChange={(v) => updateAppearance({ showQuestionNumber: v })}
              onShowResultsChange={(v) => updateAppearance({ showResults: v })}
              progressStyle={appearanceState.progressStyle}
              onProgressStyleChange={(v) => updateAppearance({ progressStyle: v })}
              hideShowResults
            />
          )}

          {/* STEP 3: Perguntas */}
          {(step === 3 || isExpressMode) && (
            <QuestionConfigStep
              questions={questions}
              questionCount={questionCount}
              isPublic={editorState.isPublic}
              onPublicChange={(v) => updateEditor({ isPublic: v })}
              quizTitle={title}
              quizDescription={description}
              quizId={quizId || undefined}
              onQuestionsUpdate={handleQuestionsUpdate}
              initialQuestionIndex={currentQuestionIndex}
              isExpressMode={isExpressMode}
              fireOnce={fireOnce}
              trackInteraction={trackInteraction}
            />
          )}

          {/* STEP 4: Coleta de Dados */}
          {step === 4 && !isExpressMode && (
            <>
              {!appearanceState.showResults && (
                <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    <strong>Coleta de dados desativada:</strong> Você optou pelo formato funil (sem resultados). 
                    As configurações abaixo só terão efeito se você reativar a exibição de resultados na Etapa 1.
                  </AlertDescription>
                </Alert>
              )}
              <VisitorFormConfigStep
                collectionTiming={collectionTiming as 'before' | 'after' | 'none'}
                onCollectionTimingChange={(v) => updateFormConfig({ collectionTiming: v })}
                collectName={collectName}
                onCollectNameChange={(v) => updateFormConfig({ collectName: v })}
                collectEmail={collectEmail}
                onCollectEmailChange={(v) => updateFormConfig({ collectEmail: v })}
                collectWhatsapp={collectWhatsapp}
                onCollectWhatsappChange={(v) => updateFormConfig({ collectWhatsapp: v })}
              />
            </>
          )}

          {/* STEP 5: Resultados */}
          {step === 5 && !isExpressMode && (
            <>
              {!appearanceState.showResults && (
                <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    <strong>Resultados desativados:</strong> Você optou pelo formato funil.
                    Para usar estas configurações, altere o formato na Etapa 1.
                  </AlertDescription>
                </Alert>
              )}
              <ResultsConfigStep
                quizId={quizId || undefined}
                deliveryTiming={deliveryTiming}
                onDeliveryTimingChange={(v) => updateFormConfig({ deliveryTiming: v })}
              />
            </>
          )}
        </div>
      </div>

      {/* ========== FOOTER NAV ========== */}
      {!isExpressMode && (
        <footer className="border-t bg-card px-4 py-3 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              if (step > 1) updateEditor({ step: step - 1 });
            }}
            disabled={step <= 1}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.previous', 'Anterior')}
          </Button>

          <div className="text-sm text-muted-foreground">
            {t('createQuiz.stepOf', 'Etapa {{current}} de {{total}}', { current: step, total: 5 })}
          </div>

          {step < 5 ? (
            <Button onClick={() => updateEditor({ step: step + 1 })}>
              {t('common.next', 'Próximo')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={isSaving}>
              <Rocket className="h-4 w-4 mr-1" />
              {t('createQuiz.publish', 'Publicar')}
            </Button>
          )}
        </footer>
      )}

      {/* Express publish button */}
      {isExpressMode && (
        <footer className="border-t bg-card px-4 py-3 flex justify-center shrink-0">
          <Button
            size="lg"
            onClick={handlePublish}
            disabled={isSaving}
            className="w-full max-w-md h-14 text-lg font-bold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('createQuiz.publishing', 'Publicando...')}
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                {t('express.publishButton', 'PUBLICAR MEU QUIZ')}
              </>
            )}
          </Button>
        </footer>
      )}

      {/* ========== PREVIEW DIALOG ========== */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('createQuiz.preview', 'Preview')}</DialogTitle>
            <DialogDescription>{t('createQuiz.previewDescription', 'Visualize como seu quiz ficará')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <UnifiedQuizPreview
              questions={questions}
              title={title}
              description={description}
              template={template}
              logoUrl={logoUrl}
              showLogo={showLogo}
              showTitle={showTitle}
              showDescription={showDescription}
              showQuestionNumber={showQuestionNumber}
              mode="fullscreen"
              formConfig={{
                collect_name: collectName,
                collect_email: collectEmail,
                collect_whatsapp: collectWhatsapp,
                collection_timing: collectionTiming as 'before' | 'after' | 'none',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default CreateQuizModern;
