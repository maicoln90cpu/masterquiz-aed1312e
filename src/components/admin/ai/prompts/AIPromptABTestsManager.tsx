import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { FlaskConical, Plus, StopCircle, Trophy } from "lucide-react";

const MODES = [
  { key: "form", label: "Formulário" },
  { key: "pdf", label: "PDF Comercial" },
  { key: "educational", label: "Educacional" },
  { key: "pdf_educational", label: "PDF Educacional" },
  { key: "pdf_traffic", label: "PDF Tráfego" },
];

interface ABTest {
  id: string;
  mode: string;
  name: string;
  variant_a_id: string;
  variant_b_id: string;
  traffic_split_b: number;
  is_active: boolean;
  hypothesis: string | null;
  created_at: string;
  ended_at: string | null;
}

interface PromptVersion {
  id: string;
  mode: string;
  version_label: string;
  status: string;
}

export const AIPromptABTestsManager = () => {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ mode: string; name: string; variant_a_id: string; variant_b_id: string; traffic_split_b: number; hypothesis: string }>({
    mode: "form", name: "", variant_a_id: "", variant_b_id: "", traffic_split_b: 50, hypothesis: "",
  });

  const { data: tests = [] } = useQuery({
    queryKey: ["ai-prompt-ab-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompt_ab_tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ABTest[];
    },
  });

  const { data: allVersions = [] } = useQuery({
    queryKey: ["ai-prompt-versions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_prompt_versions")
        .select("id, mode, version_label, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromptVersion[];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["ai-prompt-ab-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_quiz_generations")
        .select("ab_test_id, ab_variant, id");
      if (error) throw error;
      return data as { ab_test_id: string | null; ab_variant: string | null; id: string }[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.variant_a_id || !form.variant_b_id || form.variant_a_id === form.variant_b_id) {
        throw new Error("Selecione duas variantes diferentes");
      }
      const { error } = await supabase.from("ai_prompt_ab_tests").insert({
        mode: form.mode,
        name: form.name,
        variant_a_id: form.variant_a_id,
        variant_b_id: form.variant_b_id,
        traffic_split_b: form.traffic_split_b,
        hypothesis: form.hypothesis || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Teste A/B criado e ativo");
      qc.invalidateQueries({ queryKey: ["ai-prompt-ab-tests"] });
      setCreating(false);
      setForm({ mode: "form", name: "", variant_a_id: "", variant_b_id: "", traffic_split_b: 50, hypothesis: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stopMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_prompt_ab_tests")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Teste finalizado");
      qc.invalidateQueries({ queryKey: ["ai-prompt-ab-tests"] });
    },
  });

  const versionsForMode = allVersions.filter((v) => v.mode === form.mode);
  const versionLabel = (id: string) => allVersions.find((v) => v.id === id)?.version_label ?? "?";

  const countsForTest = (testId: string) => {
    const rows = results.filter((r) => r.ab_test_id === testId);
    return {
      a: rows.filter((r) => r.ab_variant === "A").length,
      b: rows.filter((r) => r.ab_variant === "B").length,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Testes A/B entre Prompts
            </CardTitle>
            <CardDescription>
              Compare duas versões em produção dividindo o tráfego. Apenas 1 teste ativo por modo.
            </CardDescription>
          </div>
          <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Novo teste</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Variantes</TableHead>
              <TableHead className="text-center">Split (B%)</TableHead>
              <TableHead className="text-center">Gerações A / B</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum teste A/B. Crie o primeiro quando tiver 2+ versões.</TableCell></TableRow>
            )}
            {tests.map((t) => {
              const c = countsForTest(t.id);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{MODES.find((m) => m.key === t.mode)?.label ?? t.mode}</Badge></TableCell>
                  <TableCell className="text-sm">{versionLabel(t.variant_a_id)} ↔ {versionLabel(t.variant_b_id)}</TableCell>
                  <TableCell className="text-center">{t.traffic_split_b}%</TableCell>
                  <TableCell className="text-center font-mono text-sm">{c.a} / {c.b}</TableCell>
                  <TableCell>
                    {t.is_active
                      ? <Badge className="bg-success/10 text-success border-success/30">Em curso</Badge>
                      : <Badge variant="outline"><Trophy className="h-3 w-3 mr-1" /> Finalizado</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.is_active && (
                      <Button size="sm" variant="ghost" onClick={() => stopMutation.mutate(t.id)}>
                        <StopCircle className="h-4 w-4 mr-1" /> Encerrar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo teste A/B</DialogTitle>
            <DialogDescription>Selecione duas versões do mesmo modo. O sorteio é por geração.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome interno</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: v1 vs v2 - tom direto" />
            </div>
            <div>
              <Label>Modo</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v, variant_a_id: "", variant_b_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Variante A (controle)</Label>
                <Select value={form.variant_a_id} onValueChange={(v) => setForm({ ...form, variant_a_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {versionsForMode.map((v) => <SelectItem key={v.id} value={v.id}>{v.version_label} ({v.status})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variante B (challenger)</Label>
                <Select value={form.variant_b_id} onValueChange={(v) => setForm({ ...form, variant_b_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {versionsForMode.map((v) => <SelectItem key={v.id} value={v.id}>{v.version_label} ({v.status})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tráfego para variante B: <strong>{form.traffic_split_b}%</strong></Label>
              <Slider
                value={[form.traffic_split_b]}
                onValueChange={([v]) => setForm({ ...form, traffic_split_b: v })}
                min={1} max={99} step={1}
              />
            </div>
            <div>
              <Label>Hipótese (o que esperamos)</Label>
              <Textarea value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} rows={2} placeholder="Ex: B deve gerar quizzes com nota média 0.5 acima de A" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.variant_a_id || !form.variant_b_id || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Iniciar teste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};