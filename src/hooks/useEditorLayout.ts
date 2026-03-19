import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EditorLayout = 'classic' | 'modern';

export const useEditorLayout = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['editor-layout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('editor_layout')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    editorLayout: (data?.editor_layout as EditorLayout) || 'classic',
    isModern: data?.editor_layout === 'modern',
    isLoading,
  };
};

export const useUpdateEditorLayout = () => {
  const queryClient = useQueryClient();

  const updateEditorLayout = async (layout: EditorLayout) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ editor_layout: layout, updated_at: new Date().toISOString() })
      .not('id', 'is', null);

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['editor-layout'] });
  };

  return { updateEditorLayout };
};
