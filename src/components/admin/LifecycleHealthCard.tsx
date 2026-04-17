import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Activity, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  trigger_name: string;
  table_name: string;
  function_name: string;
  is_active: boolean;
  emails_enqueued_24h: number;
  whatsapp_enqueued_24h: number;
  emails_enqueued_7d: number;
  whatsapp_enqueued_7d: number;
};

// Rótulos amigáveis por trigger
// Nota: Welcome unificado em 1 trigger (Etapa 5.D) — cobre INSERT + UPDATE de whatsapp.
const LABELS: Record<string, { label: string; tag: string }> = {
  trg_profiles_welcome_message: { label: "Boas-vindas (cadastro + WhatsApp tardio)", tag: "T1+T2+T7" },
  trg_profiles_auto_company_slug: { label: "Slug automático no cadastro", tag: "T8" },
  trg_quizzes_first_quiz_message: { label: "WhatsApp ao publicar 1º quiz", tag: "T4" },
  trg_quizzes_first_quiz_tutorial: { label: "Tutorial por email (3 dias após 1º quiz)", tag: "T3" },
  trg_quiz_responses_lead_milestone: { label: "Marcos de leads (10/50/100/500)", tag: "T5" },
  trg_profiles_upgrade_nudge: { label: "Upgrade nudge ao atingir 100% do limite", tag: "T6" },
  trg_quiz_responses_limit_warning: { label: "Aviso 80% do limite (proativo)", tag: "Etapa 5" },
};

export const LifecycleHealthCard = () => {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from("v_lifecycle_health")
        .select("*");
      if (!error) setRows(data as Row[]);
      setLoading(false);
    })();
  }, []);

  const totalEmails24h = rows?.[0]?.emails_enqueued_24h ?? 0;
  const totalWa24h = rows?.[0]?.whatsapp_enqueued_24h ?? 0;
  const totalEmails7d = rows?.[0]?.emails_enqueued_7d ?? 0;
  const totalWa7d = rows?.[0]?.whatsapp_enqueued_7d ?? 0;
  const allActive = rows?.every((r) => r.is_active) ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Saúde do Ciclo de Vida</CardTitle>
              <CardDescription>
                7 triggers automáticos que disparam emails e WhatsApp em momentos-chave do usuário
              </CardDescription>
            </div>
          </div>
          {!loading && (
            <Badge variant={allActive ? "default" : "destructive"}>
              {allActive ? "Todos ativos" : "Atenção"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Resumo agregado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-3 w-3" /> Emails 24h
                </div>
                <div className="text-2xl font-bold">{totalEmails24h}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MessageSquare className="h-3 w-3" /> WhatsApp 24h
                </div>
                <div className="text-2xl font-bold">{totalWa24h}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail className="h-3 w-3" /> Emails 7d
                </div>
                <div className="text-2xl font-bold">{totalEmails7d}</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MessageSquare className="h-3 w-3" /> WhatsApp 7d
                </div>
                <div className="text-2xl font-bold">{totalWa7d}</div>
              </div>
            </div>

            {/* Lista de triggers */}
            <div className="divide-y rounded-lg border">
              {rows?.map((row) => {
                const meta = LABELS[row.trigger_name] ?? {
                  label: row.trigger_name,
                  tag: "—",
                };
                return (
                  <div
                    key={row.trigger_name}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {row.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{meta.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {row.table_name} · {row.function_name}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">{meta.tag}</Badge>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Os números globais contam tudo que entrou nas filas <code>email_recovery_contacts</code> e{" "}
              <code>recovery_contacts</code> — incluindo disparos de cron e campanhas manuais.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
