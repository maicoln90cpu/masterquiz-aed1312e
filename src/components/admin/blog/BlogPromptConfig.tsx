import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Info, Plus, Trash2, Image, Palette, Eye, EyeOff } from "lucide-react";

const AVAILABLE_VARIABLES = [
  "{{topic}}", "{{categories}}", "{{author}}", "{{keywords}}", "{{base_url}}",
];

interface ImagePrompt {
  id: string;
  name: string;
  prompt_template: string;
  style_description: string | null;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

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

  const { data: imagePrompts, isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["blog-image-prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_image_prompts" as any)
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as ImagePrompt[];
    },
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptTemplate, setNewPromptTemplate] = useState("");
  const [newPromptDescription, setNewPromptDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState("");

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

  const togglePromptMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("blog_image_prompts" as any)
        .update({ is_active, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-image-prompts"] });
      toast.success("Prompt atualizado!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_image_prompts" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-image-prompts"] });
      toast.success("Prompt removido!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const addPromptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("blog_image_prompts" as any)
        .insert({
          name: newPromptName,
          prompt_template: newPromptTemplate,
          style_description: newPromptDescription || null,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-image-prompts"] });
      setNewPromptName("");
      setNewPromptTemplate("");
      setNewPromptDescription("");
      setShowAddForm(false);
      toast.success("Prompt adicionado!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, prompt_template }: { id: string; prompt_template: string }) => {
      const { error } = await supabase
        .from("blog_image_prompts" as any)
        .update({ prompt_template, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-image-prompts"] });
      setEditingId(null);
      toast.success("Prompt atualizado!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const activeCount = imagePrompts?.filter(p => p.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Image Prompt Rotation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Rotação de Prompts de Imagem ({activeCount} ativos)
          </CardTitle>
          <CardDescription>
            O sistema seleciona aleatoriamente um dos prompts ativos, nunca repetindo o último usado. Isso garante variedade visual nas imagens geradas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPrompts ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {imagePrompts?.map((prompt) => (
                <Card key={prompt.id} className={`border ${prompt.is_active ? 'border-primary/30 bg-primary/5' : 'border-muted opacity-60'}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={prompt.is_active}
                          onCheckedChange={(checked) => togglePromptMutation.mutate({ id: prompt.id, is_active: checked })}
                        />
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            {prompt.name}
                            {prompt.is_active ? (
                              <Badge variant="default" className="text-xs"><Eye className="h-3 w-3 mr-1" />Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs"><EyeOff className="h-3 w-3 mr-1" />Inativo</Badge>
                            )}
                          </h4>
                          {prompt.style_description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{prompt.style_description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Usado {prompt.usage_count}x
                          {prompt.last_used_at && ` · Último: ${new Date(prompt.last_used_at).toLocaleDateString('pt-BR')}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            if (confirm("Remover este prompt de imagem?")) {
                              deletePromptMutation.mutate(prompt.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {editingId === prompt.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editTemplate}
                          onChange={(e) => setEditTemplate(e.target.value)}
                          rows={8}
                          className="font-mono text-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updatePromptMutation.mutate({ id: prompt.id, prompt_template: editTemplate })}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-xs font-mono text-muted-foreground bg-muted/50 rounded p-2 cursor-pointer hover:bg-muted/80 max-h-24 overflow-hidden"
                        onClick={() => {
                          setEditingId(prompt.id);
                          setEditTemplate(prompt.prompt_template);
                        }}
                      >
                        {prompt.prompt_template.substring(0, 200)}...
                        <span className="text-primary ml-1">(clique para editar)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add new prompt */}
              {showAddForm ? (
                <Card className="border-dashed border-2">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome do Estilo</Label>
                        <Input
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          placeholder="Ex: Neon Futurista"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Descrição Curta</Label>
                        <Input
                          value={newPromptDescription}
                          onChange={(e) => setNewPromptDescription(e.target.value)}
                          placeholder="Ex: Cena futurista com neons"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Prompt Template (use {"{{topic}}"} para o tópico)</Label>
                      <Textarea
                        value={newPromptTemplate}
                        onChange={(e) => setNewPromptTemplate(e.target.value)}
                        rows={6}
                        className="font-mono text-xs"
                        placeholder="Generate an image: ..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addPromptMutation.mutate()}
                        disabled={!newPromptName || !newPromptTemplate || addPromptMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Novo Estilo de Imagem
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* System Prompt */}
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

      {/* Fallback Image Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt de Imagem Fallback</CardTitle>
          <CardDescription>
            Usado apenas quando não há prompts de rotação ativos na lista acima.
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
