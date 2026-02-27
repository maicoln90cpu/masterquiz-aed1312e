import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";

const AVAILABLE_VARIABLES = [
  "{{topic}}", "{{categories}}", "{{author}}", "{{keywords}}", "{{base_url}}",
];

export function BlogPromptConfig() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["blog-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  useEffect(() => {
    if (settings) {
      setSystemPrompt(settings.system_prompt || "");
      setImagePrompt(settings.image_prompt_template || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings?.id) {
        const { error } = await supabase
          .from("blog_settings")
          .update({ system_prompt: systemPrompt, image_prompt_template: imagePrompt })
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blog_settings")
          .insert({ system_prompt: systemPrompt, image_prompt_template: imagePrompt });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-settings"] });
      toast.success("Prompts salvos!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            System Prompt (Geração de Artigos)
          </CardTitle>
          <CardDescription>
            Este prompt é enviado ao modelo de IA para gerar artigos. Use variáveis dinâmicas para personalização.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Variáveis disponíveis:</span>
            {AVAILABLE_VARIABLES.map((v) => (
              <Badge key={v} variant="outline" className="text-xs cursor-pointer" onClick={() => {
                setSystemPrompt((prev) => prev + " " + v);
              }}>
                {v}
              </Badge>
            ))}
          </div>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={12}
            placeholder="Você é um redator especializado em marketing digital e quizzes interativos..."
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompt de Imagem (Gemini)</CardTitle>
          <CardDescription>
            Template para geração de imagens destaque via Google Gemini. Foco em ultrarrealismo visual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            rows={6}
            placeholder="Create a ultra-realistic, professional hero image for a blog article about {{topic}}..."
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Prompts"}
        </Button>
      </div>
    </div>
  );
}
