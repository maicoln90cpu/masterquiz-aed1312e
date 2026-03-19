import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EditorLayout = 'classic' | 'modern';

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
      return data;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const editorLayout = ((data as Record<string, unknown>)?.editor_layout as EditorLayout) || 'classic';

  return {
    editorLayout,
    isModern: editorLayout === 'modern',
    isLoading,
  };
};

export const useUpdateEditorLayout = () => {
  const queryClient = useQueryClient();

  const updateEditorLayout = async (layout: EditorLayout) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ updated_at: new Date().toISOString() } as Record<string, unknown>)
      .not('id', 'is', null);

    // Use raw SQL-like approach since types haven't synced yet
    const { error: error2 } = await supabase.rpc('update_editor_layout' as never, { new_layout: layout } as never).throwOnError().then(() => ({ error: null })).catch((err) => ({ error: err }));
    
    // Fallback: direct update with type cast
    if (error2) {
      const { error: error3 } = await supabase
        .from('site_settings')
        .update({ editor_layout: layout } as never)
        .not('id', 'is', null);
      if (error3) throw error3;
    }

    queryClient.invalidateQueries({ queryKey: ['editor-layout'] });
  };

  return { updateEditorLayout };
};
