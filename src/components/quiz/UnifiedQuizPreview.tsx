import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { RotateCcw, X, Play } from 'lucide-react';
import type { EditorQuestion } from '@/types/quiz';
import { useQuizPreviewState } from '@/hooks/useQuizPreviewState';
import type { QuizResult, FormConfig } from '@/hooks/useQuizPreviewState';
import {
  PreviewDeviceSwitcher,
  PreviewIntroScreen,
  PreviewFormScreen,
  PreviewResultScreen,
  PreviewNavigation,
  PreviewQuizContent
} from './preview';

export interface UnifiedQuizPreviewProps {
  // Quiz data
  title: string;
  description: string;
  template: string;
  logoUrl?: string;
  showLogo?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showQuestionNumber?: boolean;
  questions: EditorQuestion[];
  results?: QuizResult[];
  formConfig: FormConfig;
  
  // Display mode
  mode: 'inline' | 'fullscreen' | 'embedded';
  showDeviceFrame?: boolean;
  showIntroScreen?: boolean;
  showFormScreen?: boolean;
  showResultScreen?: boolean;
  
  // External control
  externalQuestionIndex?: number;
  
  // Callbacks
  onClose?: () => void;
}

// Device styling constants
const deviceStyles = {
  mobile: 'max-w-[375px]',
  tablet: 'max-w-[500px]',
  desktop: 'max-w-full'
};

const frameStyles = {
  mobile: 'rounded-[2.5rem] border-[12px] border-gray-800 dark:border-gray-700',
  tablet: 'rounded-[1.5rem] border-[8px] border-gray-800 dark:border-gray-700',
  desktop: 'rounded-lg border border-border'
};

const deviceWidths = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px'
};

export const UnifiedQuizPreview = ({
  title,
  description,
  template,
  logoUrl,
  showLogo = true,
  showTitle = true,
  showDescription = true,
  showQuestionNumber = true,
  questions,
  results = [],
  formConfig,
  mode,
  showDeviceFrame = true,
  showIntroScreen = false,
  showFormScreen = true,
  showResultScreen = true,
  externalQuestionIndex,
  onClose
}: UnifiedQuizPreviewProps) => {
  const { t } = useTranslation();

  const {
    deviceMode,
    setDeviceMode,
    currentStep,
    currentQuestionIndex,
    setInternalQuestionIndex,
    selectedAnswers,
    formData,
    setFormData,
    totalScore,
    visibleQuestions,
    currentQuestion,
    progress,
    sortedBlocks,
    questionBlock,
    isAnswered,
    getQuestionData,
    getFinalResult,
    handleAnswerSelect,
    handleNext,
    handlePrevious,
    handleStartQuiz,
    handleFormSubmit,
    handleRestart
  } = useQuizPreviewState({
    questions,
    showIntroScreen,
    showFormScreen,
    showResultScreen,
    formConfig,
    results,
    externalQuestionIndex
  });

  const nextButtonText = questionBlock?.nextButtonText || t('preview.next', 'Próxima');

  // Helper for answer selection with translation
  const onAnswerSelect = (value: string, isMultiple: boolean) => {
    handleAnswerSelect(value, isMultiple, t, handleNext);
  };

  // Render main quiz step content
  const renderQuizStep = () => (
    <div className="space-y-4">
      {/* Header - only for inline mode */}
      {(showLogo || showTitle || showDescription) && mode === 'inline' && (
        <div className="text-center mb-4">
          {showLogo && logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-10 mx-auto mb-3" />
          )}
          {showTitle && (
            <h2 className="text-lg font-bold mb-1">{title || t('createQuiz.newQuiz', 'Título do Quiz')}</h2>
          )}
          {showDescription && description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>
      )}

      {/* Progress */}
      {visibleQuestions.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            {showQuestionNumber && (
              <span>{t('preview.question', 'Pergunta')} {currentQuestionIndex + 1} {t('preview.of', 'de')} {visibleQuestions.length}</span>
            )}
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Question Content */}
      <PreviewQuizContent
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        sortedBlocks={sortedBlocks}
        questionData={currentQuestion ? getQuestionData(currentQuestion, t) : { questionText: '', answerFormat: 'single_choice', options: [] }}
        selectedAnswers={selectedAnswers}
        visibleQuestionsLength={visibleQuestions.length}
        onAnswerSelect={onAnswerSelect}
        onNavigateNext={() => setInternalQuestionIndex(currentQuestionIndex + 1)}
        onNavigateToQuestion={setInternalQuestionIndex}
      />

      {/* Navigation */}
      {visibleQuestions.length > 0 && (
        <PreviewNavigation
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={visibleQuestions.length}
          isAnswered={isAnswered}
          nextButtonText={nextButtonText}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  );

  // Main content router
  const renderMainContent = () => {
    if (showIntroScreen && currentStep === 'intro') {
      return (
        <PreviewIntroScreen
          title={title}
          description={description}
          template={template}
          logoUrl={logoUrl}
          showLogo={showLogo}
          showTitle={showTitle}
          showDescription={showDescription}
          questionsCount={visibleQuestions.length}
          onStart={handleStartQuiz}
        />
      );
    }

    if (currentStep === 'form') {
      return (
        <PreviewFormScreen
          formConfig={formConfig}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleFormSubmit}
        />
      );
    }

    if (currentStep === 'result' && showResultScreen) {
      return (
        <PreviewResultScreen
          result={getFinalResult(t)}
          totalScore={totalScore}
          onRestart={handleRestart}
          onClose={onClose}
        />
      );
    }

    return renderQuizStep();
  };

  // FULLSCREEN MODE
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              <Play className="h-3 w-3 mr-1" />
              {t('preview.testMode', 'Modo Teste')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {t('preview.noDataSaved', 'Nenhum dado será salvo')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {showDeviceFrame && (
              <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
                <PreviewDeviceSwitcher deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('preview.restart', 'Reiniciar')}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div 
            className={cn(`w-full transition-all duration-300 quiz-template-${template || 'moderno'}`)}
            style={{ maxWidth: showDeviceFrame ? (deviceMode === 'desktop' ? '800px' : deviceWidths[deviceMode]) : '800px' }}
          >
            <Card className="p-6 md:p-8">
              {renderMainContent()}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // INLINE MODE (sidebar preview)
  if (mode === 'inline') {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Device Mode Selector */}
        {showDeviceFrame && (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <PreviewDeviceSwitcher deviceMode={deviceMode} onDeviceModeChange={setDeviceMode} />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentQuestionIndex + 1}/{visibleQuestions.length || 1}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
                className="h-8 w-8 p-0"
                title={t('preview.restart', 'Reiniciar preview')}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 flex justify-center">
            {/* Device Frame */}
            <div 
              className={cn(
                "w-full bg-background transition-all duration-300",
                showDeviceFrame && deviceStyles[deviceMode],
                showDeviceFrame && deviceMode !== 'desktop' && frameStyles[deviceMode]
              )}
            >
              {/* Phone Notch */}
              {showDeviceFrame && deviceMode === 'mobile' && (
                <div className="h-6 bg-gray-800 dark:bg-gray-700 rounded-t-[1.5rem] flex items-center justify-center">
                  <div className="w-20 h-4 bg-gray-900 dark:bg-gray-800 rounded-full" />
                </div>
              )}
              
              {/* Quiz Content */}
              <div 
                className={cn(
                  `quiz-template-${template || 'moderno'} bg-background overflow-hidden`,
                  showDeviceFrame && deviceMode === 'mobile' && 'rounded-b-[1.5rem]',
                  showDeviceFrame && deviceMode === 'tablet' && 'rounded-b-xl'
                )}
              >
                <div className="p-4">
                  {renderMainContent()}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // EMBEDDED MODE (simple, no frame)
  return (
    <div className={`space-y-4 quiz-template-${template || 'moderno'}`}>
      {renderMainContent()}
    </div>
  );
};
