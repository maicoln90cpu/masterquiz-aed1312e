import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Plus, X, Loader2, Sparkles } from "lucide-react";

export function BlogAutomationSettings() {
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

  const [form, setForm] = useState({
    is_active: false,
    auto_publish: false,
    cron_schedule: "weekly",
    ai_model: "gpt-4o",
    image_model: "google/gemini-2.5-flash-image",
    default_author: "MasterQuiz",
    categories_list: [] as string[],
    topics_pool: [] as string[],
  });

  const [newCategory, setNewCategory] = useState("");
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        is_active: settings.is_active ?? false,
        auto_publish: settings.auto_publish ?? false,
        cron_schedule: settings.cron_schedule || "weekly",
        ai_model: settings.ai_model || "gpt-4o",
        image_model: settings.image_model || "google/gemini-2.5-flash-image",
        default_author: settings.default_author || "MasterQuiz",
        categories_list: (settings.categories_list as string[]) || [],
        topics_pool: (settings.topics_pool as string[]) || [],
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        is_active: form.is_active,
        auto_publish: form.auto_publish,
        cron_schedule: form.cron_schedule,
        ai_model: form.ai_model,
        image_model: form.image_model,
        default_author: form.default_author,
        categories_list: form.categories_list as any,
        topics_pool: form.topics_pool as any,
      };

      if (settings?.id) {
        const { error } = await supabase.from("blog_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post");
      if (error) throw error;
      toast.success(`Artigo gerado: ${data?.title || "OK"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-generation-logs"] });
    } catch (err: any) {
      toast.error(`Erro na geração: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addItem = (field: "categories_list" | "topics_pool", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setForm((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    setter("");
  };

  const removeItem = (field: "categories_list" | "topics_pool", index: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      {/* Activation & Generate */}
      <Card>
        <CardHeader>
          <CardTitle>Gerador Automático de Blog</CardTitle>
          <CardDescription>Ative a geração automática de artigos por IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar geração automática</Label>
              <p className="text-xs text-muted-foreground">O cron será executado conforme a frequência abaixo</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Publicar automaticamente</Label>
              <p className="text-xs text-muted-foreground">Posts gerados serão publicados direto (sem revisão)</p>
            </div>
            <Switch checked={form.auto_publish} onCheckedChange={(v) => setForm((p) => ({ ...p, auto_publish: v }))} />
          </div>

          <Button onClick={handleManualGenerate} disabled={isGenerating} variant="outline" className="gap-2 w-full">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Gerando artigo..." : "Gerar Artigo Agora (manual)"}
          </Button>
        </CardContent>
      </Card>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={form.cron_schedule} onValueChange={(v) => setForm((p) => ({ ...p, cron_schedule: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_12h">A cada 12 horas</SelectItem>
                  <SelectItem value="every_24h">A cada 24 horas</SelectItem>
                  <SelectItem value="every_36h">A cada 36 horas</SelectItem>
                  <SelectItem value="every_48h">A cada 48 horas</SelectItem>
                  <SelectItem value="every_72h">A cada 72 horas</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo IA (Texto)</Label>
              <Select value={form.ai_model} onValueChange={(v) => setForm((p) => ({ ...p, ai_model: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modelo IA (Imagem)</Label>
              <Select value={form.image_model} onValueChange={(v) => setForm((p) => ({ ...p, image_model: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash-image">Nano Banana (Gemini Flash Image)</SelectItem>
                  <SelectItem value="google/gemini-3-pro-image-preview">Nano Banana Pro (Gemini 3 Pro)</SelectItem>
                  <SelectItem value="google/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Autor Padrão</Label>
              <Input value={form.default_author} onChange={(e) => setForm((p) => ({ ...p, default_author: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria..."
              onKeyDown={(e) => e.key === "Enter" && addItem("categories_list", newCategory, setNewCategory)}
            />
            <Button variant="outline" size="icon" onClick={() => addItem("categories_list", newCategory, setNewCategory)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.categories_list.map((cat, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {cat}
                <button type="button" onClick={() => removeItem("categories_list", i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Topics Pool */}
      <Card>
        <CardHeader>
          <CardTitle>Pool de Tópicos</CardTitle>
          <CardDescription>Tópicos que serão usados aleatoriamente na geração automática</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Novo tópico..."
              onKeyDown={(e) => e.key === "Enter" && addItem("topics_pool", newTopic, setNewTopic)}
            />
            <Button variant="outline" size="icon" onClick={() => addItem("topics_pool", newTopic, setNewTopic)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.topics_pool.map((topic, i) => (
              <Badge key={i} variant="outline" className="gap-1 pr-1">
                {topic}
                <button type="button" onClick={() => removeItem("topics_pool", i)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {!form.topics_pool.length && (
              <p className="text-xs text-muted-foreground">Nenhum tópico. O sistema escolherá automaticamente.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
