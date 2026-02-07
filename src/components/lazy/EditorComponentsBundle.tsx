// ✅ FASE 8: Lazy loaded editor components para reduzir bundle inicial
import { lazy, Suspense, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// =============================================
// LAZY IMPORTS - Componentes pesados do editor
// =============================================

// Block Editor (580+ linhas, carrega todos os blocks)
export const LazyBlockEditor = lazy(() => 
  import("@/components/quiz/blocks/BlockEditor").then(mod => ({ default: mod.BlockEditor }))
);

// Unified Quiz Preview (grande com animações)
export const LazyUnifiedQuizPreview = lazy(() => 
  import("@/components/quiz/UnifiedQuizPreview").then(mod => ({ default: mod.UnifiedQuizPreview }))
);

// AI Quiz Generator (usa API externa)
export const LazyAIQuizGenerator = lazy(() => 
  import("@/components/quiz/AIQuizGenerator").then(mod => ({ default: mod.AIQuizGenerator }))
);

// Rich Text Editor (usa react-quill - pesado)
export const LazyRichTextEditor = lazy(() => 
  import("@/components/quiz/blocks/RichTextEditor").then(mod => ({ default: mod.RichTextEditor }))
);

// Template Selector (lista grande de templates)
export const LazyQuizTemplateSelector = lazy(() => 
  import("@/components/quiz/QuizTemplateSelector").then(mod => ({ default: mod.QuizTemplateSelector }))
);

// Calculator Editor (lógica complexa)
export const LazyCalculatorEditor = lazy(() => 
  import("@/components/quiz/CalculatorEditor").then(mod => ({ default: mod.CalculatorEditor }))
);

// =============================================
// SKELETONS - Fallbacks bonitos
// =============================================

export const BlockEditorSkeleton = memo(() => (
  <div className="space-y-4 p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 flex-1" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    ))}
  </div>
));
BlockEditorSkeleton.displayName = 'BlockEditorSkeleton';

export const PreviewSkeleton = memo(() => (
  <div className="flex flex-col items-center justify-center h-full p-4">
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="space-y-3 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  </div>
));
PreviewSkeleton.displayName = 'PreviewSkeleton';

export const AIGeneratorSkeleton = memo(() => (
  <div className="p-4 space-y-4 animate-pulse">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-24 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
));
AIGeneratorSkeleton.displayName = 'AIGeneratorSkeleton';

export const TemplateSelectorSkeleton = memo(() => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
));
TemplateSelectorSkeleton.displayName = 'TemplateSelectorSkeleton';

// =============================================
// WRAPPER COMPONENTS - Com Suspense embutido
// =============================================

interface BlockEditorWrapperProps {
  blocks: any[];
  onChange: (blocks: any[]) => void;
  questionType?: string;
  onChangeQuestionType?: (type: string) => void;
  questionOptions?: any[];
  onChangeQuestionOptions?: (options: any[]) => void;
  questionsLimit?: number;
  currentQuestionCount?: number;
  showBlockCountWarning?: boolean;
}

export const BlockEditorWrapper = memo(({ ...props }: BlockEditorWrapperProps) => (
  <Suspense fallback={<BlockEditorSkeleton />}>
    <LazyBlockEditor {...props} />
  </Suspense>
));
BlockEditorWrapper.displayName = 'BlockEditorWrapper';

interface UnifiedQuizPreviewWrapperProps {
  mode: 'fullscreen' | 'inline' | 'embedded';
  questions: any[];
  results?: any[];
  title: string;
  description: string;
  showTitle?: boolean;
  showDescription?: boolean;
  showLogo?: boolean;
  logoUrl?: string | null;
  showQuestionNumber?: boolean;
  formConfig: any;
  template: string;
  onClose?: () => void;
  showDeviceFrame?: boolean;
  showIntroScreen?: boolean;
  showFormScreen?: boolean;
  showResultScreen?: boolean;
  externalQuestionIndex?: number;
}

export const UnifiedQuizPreviewWrapper = memo(({ ...props }: UnifiedQuizPreviewWrapperProps) => (
  <Suspense fallback={<PreviewSkeleton />}>
    <LazyUnifiedQuizPreview {...props} />
  </Suspense>
));
UnifiedQuizPreviewWrapper.displayName = 'UnifiedQuizPreviewWrapper';

interface AIQuizGeneratorWrapperProps {
  onQuizGenerated: (quiz: any) => void;
  onBack: () => void;
  existingQuestions?: any[];
}

export const AIQuizGeneratorWrapper = memo(({ ...props }: AIQuizGeneratorWrapperProps) => (
  <Suspense fallback={<AIGeneratorSkeleton />}>
    <LazyAIQuizGenerator {...props} />
  </Suspense>
));
AIQuizGeneratorWrapper.displayName = 'AIQuizGeneratorWrapper';

interface QuizTemplateSelectorWrapperProps {
  onSelectTemplate: (template: any) => void;
  onCreateFromScratch: () => void;
  onUseAI?: () => void;
  isLoading?: boolean;
}

export const QuizTemplateSelectorWrapper = memo(({ ...props }: QuizTemplateSelectorWrapperProps) => (
  <Suspense fallback={<TemplateSelectorSkeleton />}>
    <LazyQuizTemplateSelector {...props} />
  </Suspense>
));
QuizTemplateSelectorWrapper.displayName = 'QuizTemplateSelectorWrapper';

// =============================================
// LOADING INDICATOR - Para transições
// =============================================

export const EditorLoadingIndicator = memo(() => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
));
EditorLoadingIndicator.displayName = 'EditorLoadingIndicator';
