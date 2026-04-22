import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FormFieldA11y } from "@/components/ui/form-field-a11y";

interface InstitutionalDomain {
  id: string;
  domain: string;
  reason: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export const InstitutionalDomainsPanel = () => {
  const qc = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [newReason, setNewReason] = useState("institutional");
  const [newNotes, setNewNotes] = useState("");

  const { data: domains, isLoading } = useQuery({
    queryKey: ["institutional-email-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institutional_email_domains")
        .select("*")
        .order("domain", { ascending: true });
      if (error) throw error;
      return data as InstitutionalDomain[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const clean = newDomain.trim().toLowerCase().replace(/^@/, "");
      if (!clean) throw new Error("Informe um domínio");
      const { error } = await supabase.from("institutional_email_domains").insert({
        domain: clean,
        reason: newReason || "institutional",
        notes: newNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domínio adicionado");
      setNewDomain(""); setNewNotes(""); setNewReason("institutional");
      qc.invalidateQueries({ queryKey: ["institutional-email-domains"] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao adicionar"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("institutional_email_domains")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    // Optimistic update — UI responde instantaneamente
    onMutate: async ({ id, is_active }) => {
      await qc.cancelQueries({ queryKey: ["institutional-email-domains"] });
      const previous = qc.getQueryData<InstitutionalDomain[]>(["institutional-email-domains"]);
      qc.setQueryData<InstitutionalDomain[]>(["institutional-email-domains"], (old) =>
        (old || []).map((d) => (d.id === id ? { ...d, is_active } : d)),
      );
      return { previous };
    },
    onError: (e: any, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["institutional-email-domains"], ctx.previous);
      toast.error(e?.message || "Falha ao atualizar");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["institutional-email-domains"] }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institutional_email_domains").delete().eq("id", id);
      if (error) throw error;
    },
    // Optimistic remove
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["institutional-email-domains"] });
      const previous = qc.getQueryData<InstitutionalDomain[]>(["institutional-email-domains"]);
      qc.setQueryData<InstitutionalDomain[]>(["institutional-email-domains"], (old) =>
        (old || []).filter((d) => d.id !== id),
      );
      return { previous };
    },
    onSuccess: () => toast.success("Domínio removido"),
    onError: (e: any, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(["institutional-email-domains"], ctx.previous);
      toast.error(e?.message || "Falha ao remover");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["institutional-email-domains"] }),
  });

  const activeCount = domains?.filter((d) => d.is_active).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <CardTitle>Domínios bloqueados como lead</CardTitle>
          </div>
          <Badge variant="secondary">{activeCount} ativos</Badge>
        </div>
        <CardDescription>
          Emails desses domínios não são extraídos como lead automaticamente (ex.: .gov.br, .edu.br).
          O usuário ainda pode preencher um formulário explícito com esses emails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form de novo domínio */}
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto] items-end p-3 rounded-md border bg-muted/30">
          <FormFieldA11y label="Domínio" required hint="Sem o '@' inicial">
            {(p) => (
              <Input
                {...p}
                placeholder="ex: gov.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            )}
          </FormFieldA11y>
          <FormFieldA11y label="Motivo">
            {(p) => (
              <Input
                {...p}
                placeholder="institutional"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            )}
          </FormFieldA11y>
          <FormFieldA11y label="Notas (opcional)">
            {(p) => (
              <Input
                {...p}
                placeholder="Descrição"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            )}
          </FormFieldA11y>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !newDomain.trim()}
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> Adicionar</>
            )}
          </Button>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !domains?.length ? (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nenhum domínio cadastrado.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="hidden md:table-cell">Notas</TableHead>
                  <TableHead className="w-24 text-center">Ativo</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-sm">@{d.domain}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{d.reason}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {d.notes || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={d.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: d.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remover @${d.domain}?`)) removeMutation.mutate(d.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          ℹ️ A lista é cacheada por 5 minutos no cliente. Mudanças refletem no próximo carregamento de quiz público.
        </p>
      </CardContent>
    </Card>
  );
};

export default InstitutionalDomainsPanel;
