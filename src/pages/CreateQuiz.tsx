import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save, Copy, ExternalLink, Menu, Blocks, Loader2, RotateCcw, Play, PanelRightClose, PanelRight, Eye, ListChecks, AlertTriangle, Rocket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { startQuizCreationTour } from "@/components/quiz/QuizCreationTour";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { createBlock } from "@/types/blocks";
import { ExpressProgressBar } from "@/components/quiz/ExpressProgressBar";
import { ExpressCelebration } from "@/components/quiz/ExpressCelebration";

// ✅ HOOKS CUSTOMIZADOS EXTRAÍDOS
import { useQuizState } from "@/hooks/useQuizState";
import { useQuizPersistence } from "@/hooks/useQuizPersistence";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { useQuizTemplateSelection } from "@/hooks/useQuizTemplateSelection";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useEditorInteractionTracker } from "@/hooks/useEditorInteractionTracker";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { useEditorLayout } from "@/hooks/useEditorLayout";
import { lazy, Suspense } from "react";

const CreateQuizModern = lazy(() => import("@/pages/CreateQuizModern"));
import { useProfile } from "@/hooks/useProfile";

const CreateQuiz = () => {
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

  // ✅ Interaction tracker for PQL v2 — tracks real user edits
  const { hasInteracted, trackInteraction } = useEditorInteractionTracker(searchParams.get('id'));

  // ✅ Idempotent GTM event firing (1x per quizId per event)
  const firedEventsRef = useRef(new Set<string>());
  const fireOnce = useCallback((event: string, data: Record<string, unknown> = {}) => {
    const quizId = searchParams.get('id');
    const key = `${event}_${quizId}`;
    if (firedEventsRef.current.has(key)) return;
    firedEventsRef.current.add(key);
    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...data });
    console.log(`🎯 [GTM] Event fired (once): ${event}`);
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
    initializeEmptyQuestions, // ✅ Extraído para inicializar perguntas no Step 1
  } = useQuizState({ 
    isEditMode, 
    questionsLimit: 10 
  });

  // ✅ Hook de persistência
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

  // ✅ Carregar limite de perguntas
  useEffect(() => {
    const loadLimit = async () => {
      const limit = await getQuestionsPerQuizLimit();
      updateEditor({ questionsLimit: limit });
    };
    loadLimit();
  }, [getQuestionsPerQuizLimit, updateEditor]);

  // ✅ Tour guiado
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('quiz_tour_completed');
    if (!hasSeenTour && !isExpressMode && !uiState.showTemplateSelector && questions.length > 0) {
      const timer = setTimeout(() => {
        startQuizCreationTour(t);
        localStorage.setItem('quiz_tour_completed', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [uiState.showTemplateSelector, questions.length, t, isExpressMode]);

  // ✅ Carregar quiz existente (suporta ?id= para edição e modo express)
  useEffect(() => {
    const editQuizId = searchParams.get('id');
    if (editQuizId) {
      loadExistingQuiz(editQuizId);
      // Express mode: force step 3 after loading + fire express_started
      if (isExpressMode) {
        updateEditor({ step: 3 });
        updateUI({ showTemplateSelector: false });
        fireOnce('express_started', { quiz_id: editQuizId });
      }
    }
  }, [searchParams, loadExistingQuiz, isExpressMode, updateEditor, updateUI, fireOnce]);

  // ✅ Limpar localStorage quando não é modo edição
  useEffect(() => {
    const checkAndClearStorage = async () => {
      const editQuizId = searchParams.get('id');
      if (!editQuizId) {
        await clearLocalStorage();
      }
    };
    checkAndClearStorage();
  }, [searchParams, clearLocalStorage]);

  // ✅ EditorAbandoned: detectar saída do editor sem publicar
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && editorState.quizId && hasInteracted) {
        // Só disparar se quiz NÃO foi publicado
        const quizStatus = editorState.quizId ? 'draft' : null;
        if (quizStatus) {
          const w = window as Window & { dataLayer?: Record<string, unknown>[] };
          w.dataLayer = w.dataLayer || [];
          w.dataLayer.push({
            event: 'EditorAbandoned',
            quiz_id: editorState.quizId,
            questions_count: questions.length,
            had_title: !!appearanceState.title?.trim(),
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [editorState.quizId, appearanceState.title, hasInteracted, questions.length]);

  // ✅ Handler para reset
  const handleReset = useCallback(async () => {
    await clearLocalStorage();
    clearAndStartFresh();
    updateUI({ resetDialogOpen: false });
  }, [clearLocalStorage, clearAndStartFresh, updateUI]);

  // ✅ Handler para publicar (com suporte a express celebration)
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

  // ✅ Compute quiz URL for express celebration
  const expressQuizUrl = useMemo(() => {
    if (!editorState.quizSlug) return '';
    return profile?.company_slug
      ? `${window.location.origin}/${profile.company_slug}/${editorState.quizSlug}`
      : `${window.location.origin}/quiz/${editorState.quizSlug}`;
  }, [editorState.quizSlug, profile?.company_slug]);

  // ============================================
  // RENDERS CONDICIONAIS
  // ============================================

  // Express Celebration Screen
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

  // Template Selector (apenas se NÃO for modo edição)
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
  // RENDER PRINCIPAL
  // ============================================
  
  const { step, currentQuestionIndex, questionCount, questionsLimit, quizId, quizSlug } = editorState;
  const { title, description, template, logoUrl, showLogo, showTitle, showDescription, showQuestionNumber } = appearanceState;
  const { collectionTiming, collectName, collectEmail, collectWhatsapp, deliveryTiming } = formConfigState;
  const { isSaving, showInteractivePreview, showInlinePreview, shareDialogOpen, deleteDialogOpen, questionToDelete, resetDialogOpen } = uiState;

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <main className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Express Progress Bar */}
      {isExpressMode && <ExpressProgressBar currentStep={1} />}

      {/* Header */}
      <header className={cn(
        "sticky z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        isExpressMode ? "top-0" : "top-0"
      )}>
        <div className="w-full max-w-full px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{t('createQuiz.back')}</span>
              </Button>
              <h1 className="text-base sm:text-xl font-bold hidden sm:block truncate">
                {isExpressMode ? t('express.editTitle', 'Revise seu quiz') : t('createQuiz.title')}
              </h1>
            </div>
            
            {/* Controls - hidden in express mode except preview */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!isExpressMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUI({ resetDialogOpen: true })}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    title={t('createQuiz.clearAndStartFresh', 'Limpar e começar do zero')}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">{t('createQuiz.reset', 'Reset')}</span>
                  </Button>

                  <Button
                    variant={showInlinePreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateUI({ showInlinePreview: !showInlinePreview })}
                    className="hidden xl:flex flex-shrink-0"
                    title={showInlinePreview ? "Ocultar preview" : "Mostrar preview"}
                  >
                    {showInlinePreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                  </Button>
                  
                  <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                  
                  <UndoRedoControls
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    undoCount={undoCount}
                    redoCount={redoCount}
                    size="sm"
                    variant="ghost"
                  />
                  
                  <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
                  
                  <AutoSaveIndicator
                    status={!isOnline ? 'offline' : autoSaveStatus}
                    lastSavedAt={lastSavedToSupabase}
                    hasQuizId={!!quizId}
                    compact
                  />
                </>
              )}

              {/* Save button — always visible */}
              {!isExpressMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveDraftToSupabase()}
                  disabled={isSavingDraft || questions.length === 0}
                  className="flex-shrink-0"
                  title={t('createQuiz.saveDraft', 'Salvar rascunho')}
                >
                  {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="hidden md:inline ml-1">{t('createQuiz.save', 'Salvar')}</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => updateUI({ showInteractivePreview: true })}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white flex-shrink-0"
                title={t('createQuiz.testQuiz', 'Testar quiz')}
                disabled={questions.length === 0}
              >
                <Play className="h-4 w-4" />
                <span className="hidden md:inline ml-1">{t('createQuiz.preview', 'Preview')}</span>
              </Button>

              {!isExpressMode && <LanguageSwitch />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex w-full max-w-full overflow-hidden h-[calc(100vh-5rem)] min-h-0">
        
        {/* Sidebar - Questions List (Desktop) */}
        <aside id="questions-sidebar" className={cn(
          "hidden lg:flex w-56 xl:w-64 border-r bg-card flex-col fixed left-0 overflow-y-auto z-30",
          isExpressMode ? "top-[8.5rem] h-[calc(100vh-8.5rem)]" : "top-20 h-[calc(100vh-5rem)]"
        )}>
            <QuestionsList
              questions={questions}
              currentStep={step}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionClick={handleQuestionClick}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onUpdateQuestion={updateQuestion}
              questionsPerQuizLimit={questionsLimit}
            />
          </aside>

        {/* Sidebar - Questions List (Mobile Drawer) */}
        <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="lg:hidden fixed bottom-[5.5rem] left-2 sm:left-4 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl border-2"
                title="Lista de perguntas"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <QuestionsList
                questions={questions}
                currentStep={step}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionClick={handleQuestionClick}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onUpdateQuestion={updateQuestion}
                questionsPerQuizLimit={questionsLimit}
              />
            </SheetContent>
          </Sheet>

        {/* Block Palette (Step 3 only, hidden in express) */}
        {step === 3 && !isExpressMode && (
          <>
            <aside 
              id="block-palette" 
              className="hidden xl:flex w-[280px] border-r bg-card flex-col fixed top-20 left-[calc(theme(spacing.72)+1px)] h-[calc(100vh-5rem)] overflow-y-auto z-30"
            >
              <CompactBlockPalette
                onAddBlock={(type) => {
                  const currentQuestion = questions[currentQuestionIndex];
                  const newBlock = createBlock(type, currentQuestion.blocks?.length || 0);
                  const updatedBlocks = [...(currentQuestion.blocks || []), newBlock];
                  updateCurrentQuestionBlocks(updatedBlocks);
                  toast.success(t('createQuiz.blockAdded', { blockType: type }));
                }}
                onAddTemplate={(newBlocks) => {
                  const currentQuestion = questions[currentQuestionIndex];
                  const baseOrder = currentQuestion.blocks?.length || 0;
                  const reorderedBlocks = newBlocks.map((block, index) => ({
                    ...block,
                    order: baseOrder + index
                  }));
                  const updatedBlocks = [...(currentQuestion.blocks || []), ...reorderedBlocks];
                  updateCurrentQuestionBlocks(updatedBlocks);
                  toast.success(t('createQuiz.blockTemplates.blockAdded'));
                }}
                currentBlockOrder={questions[currentQuestionIndex]?.blocks?.length || 0}
              />
            </aside>
            
            {/* Block Palette Drawer (Mobile/Tablet) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="default" 
                  size="icon" 
                  className="xl:hidden fixed bottom-[5.5rem] right-2 sm:right-4 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-xl"
                  title="Adicionar blocos"
                >
                  <Blocks className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] p-0 md:h-[60vh]">
                <CompactBlockPalette
                  onAddBlock={(type) => {
                    const currentQuestion = questions[currentQuestionIndex];
                    const newBlock = createBlock(type, currentQuestion.blocks?.length || 0);
                    const updatedBlocks = [...(currentQuestion.blocks || []), newBlock];
                    updateCurrentQuestionBlocks(updatedBlocks);
                    toast.success(t('createQuiz.blockAdded', { blockType: type }));
                  }}
                  onAddTemplate={(newBlocks) => {
                    const currentQuestion = questions[currentQuestionIndex];
                    const baseOrder = currentQuestion.blocks?.length || 0;
                    const reorderedBlocks = newBlocks.map((block, index) => ({
                      ...block,
                      order: baseOrder + index
                    }));
                    const updatedBlocks = [...(currentQuestion.blocks || []), ...reorderedBlocks];
                    updateCurrentQuestionBlocks(updatedBlocks);
                    toast.success(t('createQuiz.blockTemplates.blockAdded'));
                  }}
                  currentBlockOrder={questions[currentQuestionIndex]?.blocks?.length || 0}
                />
              </SheetContent>
            </Sheet>
          </>
        )}

        {/* Main Editor Area */}
        <ResizablePanelGroup 
          direction="horizontal" 
          className={cn(
            "flex-1 h-full min-w-0", 
            "lg:ml-[224px] xl:ml-[256px]",
            step === 3 && !isExpressMode && "xl:ml-[calc(256px+280px)]",
            showInlinePreview && !isExpressMode && "xl:mr-[380px]"
          )}
        >
          <ResizablePanel defaultSize={100} minSize={40} className="h-full">
            <div className="w-full h-[calc(100vh-5rem)] overflow-y-auto quiz-editor-mobile-scope">
              <div className="w-full max-w-full 2xl:max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                
                {/* Sticky Header - simplified in express */}
                {!isExpressMode && (
                <div className="sticky top-0 z-20 space-y-3 bg-background pt-4 pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 shadow-sm border-b border-border/40">
                  <FloatingTutorial currentStep={step} />
                  
                  <QuizProgressIndicator
                    title={title}
                    description={description}
                    questions={questions}
                    template={template}
                    collectName={collectName}
                    collectEmail={collectEmail}
                    collectWhatsapp={collectWhatsapp}
                    currentStep={step}
                    quizId={quizId}
                    compact
                  />
                  
                  {step === 3 && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <QuickAddToolbar
                        onAddBlock={(type) => {
                          const currentQuestion = questions[currentQuestionIndex];
                          const newBlock = createBlock(type, currentQuestion.blocks?.length || 0);
                          const updatedBlocks = [...(currentQuestion.blocks || []), newBlock];
                          updateCurrentQuestionBlocks(updatedBlocks);
                          toast.success(t('createQuiz.blockAdded', { blockType: type }));
                        }}
                        disabled={questions.length === 0}
                        className="flex-shrink-0"
                      />
                      
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white shadow-md min-w-[120px] px-5"
                          onClick={saveDraftToSupabase}
                          disabled={isSavingDraft || !quizId}
                        >
                          <Save className={`h-3.5 w-3.5 ${isSavingDraft ? 'animate-spin' : ''}`} />
                          <span className="hidden xs:inline text-sm font-medium">
                            {isSavingDraft ? 'Salvando...' : 'Salvar'}
                          </span>
                        </Button>
                        <AutoSaveIndicator
                          status={!isOnline ? 'offline' : autoSaveStatus}
                          lastSavedAt={lastSavedToSupabase}
                          hasQuizId={!!quizId}
                          compact
                        />
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Step Content */}
                {step === 1 && !isExpressMode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{t('createQuiz.step1.title')}</CardTitle>
                      <CardDescription>{t('createQuiz.step1.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-4">
                          <p className="text-6xl font-bold text-primary">{questionCount}</p>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="question-count-input" className="text-sm text-muted-foreground">
                              {t('createQuiz.step1.questionQuantity')}
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
                        <p className="text-muted-foreground mt-4">{t('createQuiz.step1.adjustSlider')}</p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium">{t('createQuiz.step1.questionQuantity')}</Label>
                        <Slider
                          value={[questionCount]}
                          onValueChange={(value) => updateEditor({ questionCount: value[0] })}
                          min={1}
                          max={questionsLimit}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>1 {t('common.question')}</span>
                          <span>{questionsLimit} {t('common.questions')}</span>
                        </div>
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground text-center">
                            Seu plano permite até <strong>{questionsLimit}</strong> perguntas por quiz
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                  />
                )}

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

                {step === 4 && !isExpressMode && (
                  <>
                    {!appearanceState.showResults && (
                      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-sm">
                          <strong>Coleta de dados desativada:</strong> Na etapa 2 (Aparência), você optou por não exibir a tela de resultados. 
                          Como o formulário de coleta é exibido junto ao resultado, ele também não será mostrado ao respondente. 
                          As configurações abaixo só terão efeito se você reativar a exibição de resultados.
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

                {step === 5 && !isExpressMode && (
                  <>
                    {!appearanceState.showResults && (
                      <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-sm">
                          <strong>Resultados desativados:</strong> Na etapa 2 (Aparência), você optou por não exibir a tela de resultados. 
                          As configurações de resultado abaixo não serão exibidas ao respondente. 
                          Para usar estas configurações, reative "Exibir tela de resultados" na etapa 2.
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

                {/* Navigation */}
                {isExpressMode ? (
                  <div className="flex flex-col items-center gap-4 pt-6 pb-8">
                    <Button
                      size="xl"
                      onClick={handlePublish}
                      disabled={isSaving}
                      className="w-full max-w-md h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
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
                    <button
                      onClick={() => {
                        // Switch to full editor mode by removing express param
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('mode');
                        navigate(`/create-quiz?${newParams.toString()}`, { replace: true });
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                    >
                      {t('express.advancedMode', 'Modo avançado →')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => updateEditor({ step: Math.max(1, step - 1) })}
                      disabled={step === 1}
                      className="w-full sm:w-auto"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('common.previous')}
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {step < totalSteps ? (
                        <Button
                          onClick={() => {
                            try {
                              if (step === 1 && questions.length === 0) {
                                const emptyQuestions = initializeEmptyQuestions(questionCount);
                                setQuestions(emptyQuestions);
                              }
                              updateEditor({ step: step + 1 });
                            } catch (error) {
                              console.error('[CreateQuiz] Erro na transição de step:', error);
                              toast.error('Erro ao avançar. Tente novamente.');
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          {t('common.next')}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePublish}
                          disabled={isSaving}
                          className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('createQuiz.publishing')}
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {t('createQuiz.publishQuiz')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Inline Preview (Desktop XL) */}
        {showInlinePreview && !isExpressMode && (
          <aside className="hidden xl:flex w-[380px] border-l bg-muted/20 flex-col fixed top-20 right-0 h-[calc(100vh-5rem)] overflow-hidden z-30">
            <div className="p-4 border-b bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">
                  {uiState.rightPanelMode === 'preview' 
                    ? t('createQuiz.livePreview', 'Preview ao Vivo')
                    : t('createQuiz.quizSteps', 'Etapas do Quiz')}
                </h3>
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={uiState.rightPanelMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateUI({ rightPanelMode: 'preview' })}
                  className="flex-1 h-7 text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Preview
                </Button>
                <Button
                  variant={uiState.rightPanelMode === 'steps' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => updateUI({ rightPanelMode: 'steps' })}
                  className="flex-1 h-7 text-xs"
                >
                  <ListChecks className="h-3.5 w-3.5 mr-1" />
                  {t('createQuiz.steps', 'Etapas')}
                </Button>
              </div>
              {uiState.rightPanelMode === 'preview' && (
                <p className="text-xs text-muted-foreground mt-2">{t('createQuiz.previewDescription', 'Visualize as alterações em tempo real')}</p>
              )}
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              {uiState.rightPanelMode === 'preview' ? (
                <UnifiedQuizPreview
                  questions={questions}
                  template={template}
                  title={title}
                  description={description}
                  logoUrl={logoUrl}
                  showLogo={showLogo}
                  showTitle={showTitle}
                  showDescription={showDescription}
                  showQuestionNumber={showQuestionNumber}
                  formConfig={{ collect_name: collectName, collect_email: collectEmail, collect_whatsapp: collectWhatsapp, collection_timing: collectionTiming as 'none' | 'before' | 'after' | 'both' }}
                  mode="inline"
                  externalQuestionIndex={editorState.currentQuestionIndex}
                />
              ) : (
                <div className="space-y-3">
                  {[
                    { number: 1, title: t('createQuiz.step1.title', 'Quantidade de Perguntas'), icon: '🔢' },
                    { number: 2, title: t('createQuiz.step3.title', 'Aparência do Quiz'), icon: '🎨' },
                    { number: 3, title: t('createQuiz.step2.title', 'Configuração das Perguntas'), icon: '❓' },
                    { number: 4, title: t('createQuiz.step4.title', 'Formulário de Coleta'), icon: '📝' },
                    { number: 5, title: t('createQuiz.step5.title', 'Configuração de Resultados'), icon: '🏆' },
                  ].map((s) => (
                    <button
                      key={s.number}
                      onClick={() => updateEditor({ step: s.number })}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                        step === s.number
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold",
                            step === s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {s.number}
                          </span>
                          <span className={cn(
                            "font-medium text-sm",
                            step === s.number ? "text-primary" : "text-foreground"
                          )}>
                            {s.title}
                          </span>
                        </div>
                        {step > s.number && (
                          <span className="text-xs text-green-600 dark:text-green-400 ml-7">✓ Concluído</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open) updateUI({ deleteDialogOpen: false, questionToDelete: null }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('createQuiz.deleteQuestion')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('createQuiz.deleteQuestionConfirm', { number: (questionToDelete || 0) + 1 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteQuestion(questionToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={(open) => updateUI({ resetDialogOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('createQuiz.resetConfirmTitle', 'Limpar e começar do zero?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('createQuiz.resetConfirmDescription', 'Isso irá apagar todo o progresso atual. Esta ação não pode ser desfeita.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('createQuiz.confirmReset', 'Sim, limpar tudo')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Interactive Preview Dialog */}
      <Dialog open={showInteractivePreview} onOpenChange={(open) => updateUI({ showInteractivePreview: open })}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{t('createQuiz.interactivePreview', 'Preview Interativo')}</DialogTitle>
            <DialogDescription>
              {t('createQuiz.interactivePreviewDescription', 'Teste seu quiz como os respondentes verão')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <UnifiedQuizPreview
              questions={questions}
              template={template}
              title={title}
              description={description}
              logoUrl={logoUrl}
              showLogo={showLogo}
              showTitle={showTitle}
              showDescription={showDescription}
              showQuestionNumber={showQuestionNumber}
              formConfig={{ collect_name: collectName, collect_email: collectEmail, collect_whatsapp: collectWhatsapp, collection_timing: collectionTiming as 'none' | 'before' | 'after' | 'both' }}
              mode="fullscreen"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen && !isExpressMode} onOpenChange={(open) => updateUI({ shareDialogOpen: open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">🎉 {t('createQuiz.quizPublished')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('createQuiz.shareYourQuiz')}
            </DialogDescription>
          </DialogHeader>
          {(() => {
            // ✅ Padronizado: sempre usar company_slug quando disponível
            const quizPublicUrl = profile?.company_slug 
              ? `${window.location.origin}/${profile.company_slug}/${quizSlug}`
              : `${window.location.origin}/quiz/${quizSlug}`;
            
            return (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <QRCodeSVG 
                    value={quizPublicUrl}
                    size={150}
                    level="H"
                    includeMargin
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={quizPublicUrl}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(quizPublicUrl);
                      toast.success(t('createQuiz.linkCopied'));
                      pushGTMEvent('QuizShared', { method: 'link', quiz_id: quizId });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(quizPublicUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('createQuiz.openQuiz')}
                  </Button>
                  <Button
                    onClick={() => {
                      updateUI({ shareDialogOpen: false });
                      queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
                      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                      navigate('/meus-quizzes');
                    }}
                    className="w-full"
                  >
                    {t('createQuiz.goToDashboard')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default CreateQuiz;
