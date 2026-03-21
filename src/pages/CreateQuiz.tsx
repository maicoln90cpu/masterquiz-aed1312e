import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { useEditorLayout } from "@/hooks/useEditorLayout";

const CreateQuizModern = lazy(() => import("@/pages/CreateQuizModern"));
const CreateQuizClassic = lazy(() => import("@/pages/CreateQuizClassic"));

/**
 * CreateQuiz — Thin router that delegates to Classic or Modern editor.
 * 
 * CRITICAL: No heavy hooks here. useEditorLayout is the ONLY hook.
 * This prevents duplicate hook instances that caused the Modern freeze.
 */
const CreateQuiz = () => {
  const { isModern, isLoading } = useEditorLayout();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  const fallback = (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </main>
  );

  if (isModern) {
    return (
      <Suspense fallback={fallback}>
        <CreateQuizModern />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={fallback}>
      <CreateQuizClassic />
    </Suspense>
  );
};

export default CreateQuiz;
