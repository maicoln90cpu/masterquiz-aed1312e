import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CheckCircle2, Archive, Eye, Copy, GitCompare, Star, TrendingUp } from "lucide-react";
import { logger } from "@/lib/logger";

const MODES = [
  { key: "form", label: "Formulário" },
  { key: "pdf", label: "PDF Comercial" },
  { key: "educational", label: "Educacional" },
  { key: "pdf_educational", label: "PDF Educacional" },
  { key: "pdf_traffic", label: "PDF Tráfego" },
] as const;

type PromptMode = typeof MODES[number]["key"];

interface PromptVersion {
  id: string;
  mode: PromptMode;
  version_label: string;
  status: "draft" | "active" | "archived";
  change_notes: string | null;
  system_prompt: string;
  user_prompt_template: string;
  created_at: string;
  activated_at: string | null;
  archived_at: string | null;
}

interface VersionPerformance {
  version_id: string;
  total_generations: number;
  total_feedbacks: number;
  avg_rating: number | null;
  pct_would_use_as_is: number | null;
  avg_cost_usd: number | null;
}

const statusBadge = (status: string) => {
  if (status === "active") return <Badge className="bg-green-500/10 text-green-700 border-green-500/30">Ativa</Badge>;
  if (status === "draft") return <Badge variant="secondary">Rascunho</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Arquivada</Badge>;
};

export const AIPromptVersionsManager = () => {
  const qc = useQueryClient();
  const [activeMode, setActiveMode] = useState<PromptMode>("form");
  const [editing, setEditing] = useState<Partial<PromptVersion> | null>(null);
  const [previewing, setPreviewing] = useState<PromptVersion | null>(null);
  const [diffSelection, setDiffSelection] = useState<string[]>([]);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["ai-prompt-versions", activeMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompt_versions")
        .select("*")
        .eq("mode", activeMode)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromptVersion[];
    },
  });

  const { data: performance = [] } = useQuery({
    queryKey: ["ai-prompt-performance", activeMode],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_prompt_version_performance")
        .select("*")
        .eq("mode", activeMode);
      if (error) {
        logger.warn("perf view fetch failed", error);
        return [] as VersionPerformance[];
      }
      return data as VersionPerformance[];
    },
  });

  const perfByVersion = new Map(performance.map((p) => [p.version_id, p]));

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<PromptVersion>) => {
      if (payload.id) {
        const { error } = await supabase
          .from("ai_prompt_versions")
          .update({
            version_label: payload.version_label,
            change_notes: payload.change_notes,
            system_prompt: payload.system_prompt,
            user_prompt_template: payload.user_prompt_template,
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_prompt_versions").insert({
          mode: activeMode,
          version_label: payload.version_label!,
          status: "draft",
          change_notes: payload.change_notes ?? null,
          system_prompt: payload.system_prompt!,
          user_prompt_template: payload.user_prompt_template!,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Versão salva");
      qc.invalidateQueries({ queryKey: ["ai-prompt-versions"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(`Erro ao salvar: ${e.message}`),
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prompt_versions")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Versão ativada — anterior arquivada automaticamente");
      qc.invalidateQueries({ queryKey: ["ai-prompt-versions"] });
    },
    onError: (e: any) => toast.error(`Erro ao ativar: ${e.message}`),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prompt_versions")
        .update({ status: "archived" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Versão arquivada");
      qc.invalidateQueries({ queryKey: ["ai-prompt-versions"] });
    },
  });

  const handleDuplicate = (v: PromptVersion) => {
    const nextLabel = `${v.version_label}-copy`;
    setEditing({
      mode: v.mode,
      version_label: nextLabel,
      change_notes: `Duplicada de ${v.version_label}`,
      system_prompt: v.system_prompt,
      user_prompt_template: v.user_prompt_template,
    });
  };

  const toggleDiff = (id: string) => {
    setDiffSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const diffPair = diffSelection.length === 2
    ? [versions.find((v) => v.id === diffSelection[0]), versions.find((v) => v.id === diffSelection[1])]
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Editor de Prompts com Versionamento
        </CardTitle>
        <CardDescription>
          Crie e ative versões dos prompts da IA por modo. A versão marcada como ativa é usada em todas as gerações novas.
          Cruze com o feedback dos usuários (Onda 2) para decidir qual versão escalar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeMode} onValueChange={(v) => { setActiveMode(v as PromptMode); setDiffSelection([]); }}>
          <TabsList className="grid grid-cols-5 w-full">
            {MODES.map((m) => <TabsTrigger key={m.key} value={m.key}>{m.label}</TabsTrigger>)}
          </TabsList>

          {MODES.map((m) => (
            <TabsContent key={m.key} value={m.key} className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {versions.length} versão(ões) — selecione 2 para comparar lado a lado
                </p>
                <Button onClick={() => setEditing({ version_label: "", system_prompt: "", user_prompt_template: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Nova versão
                </Button>
              </div>

              {diffPair && diffPair[0] && diffPair[1] && (
                <Card className="border-primary/30">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompare className="h-4 w-4" /> Comparar: {diffPair[0].version_label} ↔ {diffPair[1].version_label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {diffPair.map((v) => v && (
                      <div key={v.id} className="space-y-2">
                        <div className="font-semibold text-sm">{v.version_label} {statusBadge(v.status)}</div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">SYSTEM</div>
                          <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">{v.system_prompt}</pre>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">USER</div>
                          <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">{v.user_prompt_template}</pre>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Diff</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-center">Gerações</TableHead>
                    <TableHead className="text-center">Nota média</TableHead>
                    <TableHead className="text-center">% Usaria</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
                  {!isLoading && versions.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma versão. Crie a primeira.</TableCell></TableRow>
                  )}
                  {versions.map((v) => {
                    const perf = perfByVersion.get(v.id);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={diffSelection.includes(v.id)}
                            onChange={() => toggleDiff(v.id)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{v.version_label}</TableCell>
                        <TableCell>{statusBadge(v.status)}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{v.change_notes ?? "—"}</TableCell>
                        <TableCell className="text-center">{perf?.total_generations ?? 0}</TableCell>
                        <TableCell className="text-center">
                          {perf?.avg_rating ? <span className="font-semibold">{perf.avg_rating}⭐</span> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {perf?.pct_would_use_as_is != null ? `${perf.pct_would_use_as_is}%` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(v.created_at), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewing(v)} title="Ver"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(v)} title="Editar"><GitCompare className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(v)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                          {v.status !== "active" && (
                            <Button variant="ghost" size="icon" onClick={() => activateMutation.mutate(v.id)} title="Ativar">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {v.status === "draft" && (
                            <Button variant="ghost" size="icon" onClick={() => archiveMutation.mutate(v.id)} title="Arquivar">
                              <Archive className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      {/* Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar versão" : "Nova versão"}</DialogTitle>
            <DialogDescription>
              Modo: <strong>{MODES.find((m) => m.key === activeMode)?.label}</strong>. Salvar cria como rascunho — ative depois para usar em produção.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Rótulo da versão (ex: v2, v2.1, experimento-cta-curto)</Label>
                <Input
                  value={editing.version_label ?? ""}
                  onChange={(e) => setEditing({ ...editing, version_label: e.target.value })}
                  placeholder="v2"
                />
              </div>
              <div>
                <Label>Notas de mudança (o que mudou e por quê)</Label>
                <Textarea
                  value={editing.change_notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, change_notes: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>System prompt</Label>
                <Textarea
                  value={editing.system_prompt ?? ""}
                  onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>User prompt (template — use {`{variável}`})</Label>
                <Textarea
                  value={editing.user_prompt_template ?? ""}
                  onChange={(e) => setEditing({ ...editing, user_prompt_template: e.target.value })}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={!editing?.version_label || !editing?.system_prompt || !editing?.user_prompt_template || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar como rascunho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewing?.version_label} {previewing && statusBadge(previewing.status)}</DialogTitle>
            <DialogDescription>{previewing?.change_notes}</DialogDescription>
          </DialogHeader>
          {previewing && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">SYSTEM</Label>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{previewing.system_prompt}</pre>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">USER</Label>
                <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{previewing.user_prompt_template}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};