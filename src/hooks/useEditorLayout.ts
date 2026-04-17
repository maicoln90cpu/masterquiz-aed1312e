import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EditorLayout = 'classic' | 'modern';

/**
 * Hook que retorna o layout ativo do editor de quizzes (`classic` ou `modern`).
 *
 * Usado pelo Thin Router em `CreateQuiz.tsx` para decidir qual variante carregar
 * via React.lazy. Cache de 1h via TanStack Query (config global do site, baixa volatilidade).
 *
 * @returns `{ editorLayout, isModern, isLoading }`
 *
 * @example
 * ```tsx
 * const { isModern } = useEditorLayout();
 * return isModern ? <CreateQuizModern /> : <CreateQuizClassic />;
 * ```
 */
export const useEditorLayout = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['editor-layout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      // Column exists in DB but types haven't synced yet
      return (data as Record<string, unknown>)?.editor_layout as string || 'classic';
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const editorLayout = (data as EditorLayout) || 'classic';

  return {
    editorLayout,
    isModern: editorLayout === 'modern',
    isLoading,
  };
};

export const useUpdateEditorLayout = () => {
  const queryClient = useQueryClient();

  const updateEditorLayout = async (layout: EditorLayout) => {
    // Column exists but types not synced — use type assertion
    const updatePayload = { editor_layout: layout, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from('site_settings')
      .update(updatePayload as never)
      .not('id', 'is', null);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['editor-layout'] });
  };

  return { updateEditorLayout };
};
