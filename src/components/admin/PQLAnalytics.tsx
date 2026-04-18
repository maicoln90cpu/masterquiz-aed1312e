import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/admin/system/DataTable";

// Intenções possíveis
const INTENT_LABELS: Record<string, string> = {
  lead_capture_launch: "Captar leads p/ lançamento",
  vsl_conversion: "Melhorar conversão VSL",
  paid_traffic: "Rodar tráfego pago",
  offer_validation: "Validar oferta",
  educational: "Uso educacional",
  other: "Outro",
  none: "(sem intenção)",
};

type UserStage = "explorador" | "construtor" | "operador";

interface UserRow {
  id: string;
  profile: {
    user_stage: string | null;
    user_objectives: string[] | null;
  } | null;
  subscription: {
    plan_type: string;
  } | null;
  stats: {
    quiz_count: number;
    published_count: number;
    quizzes_with_leads: number;
    lead_count: number;
  };
}

interface IntentRow {
  intent: string;
  total: number;
  quizzes: number;
  published: number;
  withLeads: number;
  explorador: number;
  construtor: number;
  operador: number;
  pctExplConstr: number | null;
  pctConstrOper: number | null;
  free: number;
  paid: number;
  pctTrialPaid: number | null;
}

interface LeadImpactRow {
  label: string;
  total: number;
  free: number;
  paid: number;
  pctTrialPaid: number | null;
}

function pct(num: number, den: number): number | null {
  if (den === 0) return null;
  return Math.round((num / den) * 100);
}

function formatPct(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

export function PQLAnalytics() {
  const { data: users, isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const result = await supabase.functions.invoke("list-all-users");
      if (result.error) throw result.error;
      return result.data?.users || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { intentTable, leadImpactTable } = useMemo(() => {
    if (!users) return { intentTable: [], leadImpactTable: [] };

    // ── Tabela 1: Progressão por Intenção ──
    const intentMap = new Map<string, {
      total: number;
      quizzes: number;
      published: number;
      withLeads: number;
      stages: Record<UserStage, number>;
      free: number;
      paid: number;
    }>();

    const ensureIntent = (key: string) => {
      if (!intentMap.has(key)) {
        intentMap.set(key, {
          total: 0,
          quizzes: 0,
          published: 0,
          withLeads: 0,
          stages: { explorador: 0, construtor: 0, operador: 0 },
          free: 0,
          paid: 0,
        });
      }
      return intentMap.get(key)!;
    };

    // ── Tabela 2: Impacto do Lead de Teste ──
    let leadYes = { total: 0, free: 0, paid: 0 };
    let leadNo = { total: 0, free: 0, paid: 0 };

    for (const u of users) {
      const stage = (u.profile?.user_stage || "explorador") as UserStage;
      const planType = u.subscription?.plan_type || "free";
      const isPaid = planType !== "free";
      const hasLead = (u.stats?.lead_count || 0) > 0;
      const objectives = u.profile?.user_objectives;

      // Intenção
      const intentKey =
        objectives && objectives.length > 0 ? objectives[0] : "none";
      const bucket = ensureIntent(intentKey);
      bucket.total++;
      bucket.quizzes += u.stats?.quiz_count || 0;
      bucket.published += u.stats?.published_count || 0;
      bucket.withLeads += u.stats?.quizzes_with_leads || 0;
      if (stage in bucket.stages) bucket.stages[stage]++;
      if (isPaid) bucket.paid++;
      else bucket.free++;

      // Lead impact
      if (hasLead) {
        leadYes.total++;
        if (isPaid) leadYes.paid++;
        else leadYes.free++;
      } else {
        leadNo.total++;
        if (isPaid) leadNo.paid++;
        else leadNo.free++;
      }
    }

    const intentTable: IntentRow[] = Array.from(intentMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([intent, d]) => ({
        intent,
        total: d.total,
        quizzes: d.quizzes,
        published: d.published,
        withLeads: d.withLeads,
        explorador: d.stages.explorador,
        construtor: d.stages.construtor,
        operador: d.stages.operador,
        pctExplConstr: pct(
          d.stages.construtor + d.stages.operador,
          d.stages.explorador + d.stages.construtor + d.stages.operador
        ),
        pctConstrOper: pct(
          d.stages.operador,
          d.stages.construtor + d.stages.operador || 0
        ),
        free: d.free,
        paid: d.paid,
        pctTrialPaid: pct(d.paid, d.free + d.paid),
      }));

    const leadImpactTable: LeadImpactRow[] = [
      {
        label: "Sim",
        ...leadYes,
        pctTrialPaid: pct(leadYes.paid, leadYes.total),
      },
      {
        label: "Não",
        ...leadNo,
        pctTrialPaid: pct(leadNo.paid, leadNo.total),
      },
    ];

    return { intentTable, leadImpactTable };
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabela 1 — Progressão por Intenção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progressão por Intenção</CardTitle>
          <CardDescription>
            Distribuição de estágios e conversão Trial → Paid por intenção declarada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={intentTable}
            rowKey={(r) => r.intent}
            defaultSortKey="total"
            defaultSortDirection="desc"
            pageSize={25}
            searchPlaceholder="Buscar intenção…"
            emptyMessage="Nenhum dado disponível"
            exportCsv="pql-intent"
            columns={[
              {
                key: 'intent',
                label: 'Intenção',
                sortable: true,
                filterable: true,
                searchable: true,
                accessor: (r) => INTENT_LABELS[r.intent] || r.intent,
                render: (r) => (
                  <Badge variant="outline" className="font-normal">
                    {INTENT_LABELS[r.intent] || r.intent}
                  </Badge>
                ),
              },
              { key: 'total', label: 'Total', sortable: true, align: 'center', className: 'font-medium' },
              { key: 'quizzes', label: 'Quizzes', sortable: true, align: 'center' },
              { key: 'published', label: 'Publicados', sortable: true, align: 'center' },
              { key: 'withLeads', label: 'Com Leads', sortable: true, align: 'center' },
              { key: 'explorador', label: '🧊 Expl.', sortable: true, align: 'center' },
              { key: 'construtor', label: '🔥 Constr.', sortable: true, align: 'center' },
              { key: 'operador', label: '🚀 Oper.', sortable: true, align: 'center' },
              {
                key: 'pctExplConstr',
                label: '% Expl→Constr',
                sortable: true,
                align: 'center',
                render: (r) => formatPct(r.pctExplConstr),
              },
              {
                key: 'pctConstrOper',
                label: '% Constr→Oper',
                sortable: true,
                align: 'center',
                render: (r) => formatPct(r.pctConstrOper),
              },
              { key: 'free', label: 'Free', sortable: true, align: 'center' },
              { key: 'paid', label: 'Paid', sortable: true, align: 'center' },
              {
                key: 'pctTrialPaid',
                label: '% Trial→Paid',
                sortable: true,
                align: 'center',
                className: 'font-semibold',
                render: (r) => formatPct(r.pctTrialPaid),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Tabela 2 — Impacto do Lead de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Impacto do Lead de Teste</CardTitle>
          <CardDescription>
            Usuários que geraram leads convertem mais para plano pago?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={leadImpactTable}
            rowKey={(r) => r.label}
            pageSize={10}
            emptyMessage="Sem dados"
            columns={[
              {
                key: 'label',
                label: 'Gerou Lead de Teste?',
                render: (r) => (
                  <Badge variant={r.label === 'Sim' ? 'default' : 'secondary'}>{r.label}</Badge>
                ),
              },
              { key: 'total', label: 'Total', sortable: true, align: 'center', className: 'font-medium' },
              { key: 'free', label: 'Free', sortable: true, align: 'center' },
              { key: 'paid', label: 'Paid', sortable: true, align: 'center' },
              {
                key: 'pctTrialPaid',
                label: '% Trial → Paid',
                sortable: true,
                align: 'center',
                className: 'font-semibold',
                render: (r) => formatPct(r.pctTrialPaid),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Tabela 3 — Classic vs Modern (A/B) */}
      <ClassicVsModernComparison />
    </div>
  );
}

// ============================================
// Componente A/B Comparison
// ============================================

const AB_EVENTS = [
  { classic: 'first_quiz_created', modern: 'first_quiz_createdB', label: 'Primeiro Quiz Editado Manualmente' },
  { classic: 'quiz_first_published', modern: 'quiz_first_publishedB', label: 'Primeiro Quiz Publicado' },
];

function ClassicVsModernComparison() {
  const [period, setPeriod] = useState<string>("30d");

  const { data: abData, isLoading } = useQuery({
    queryKey: ["pql-ab-comparison", period],
    queryFn: async () => {
      const now = new Date();
      let since: string | null = null;
      if (period === "7d") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (period === "30d") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const allEventNames = AB_EVENTS.flatMap(e => [e.classic, e.modern]);
      
      let query = supabase
        .from("gtm_event_logs" as any)
        .select("event_name")
        .in("event_name", allEventNames);
      
      if (since) query = query.gte("created_at", since);

      const { data } = await query;
      const rows = (data || []) as any[];

      return AB_EVENTS.map(ev => {
        const classicCount = rows.filter(r => r.event_name === ev.classic).length;
        const modernCount = rows.filter(r => r.event_name === ev.modern).length;
        const delta = classicCount > 0 
          ? Math.round(((modernCount - classicCount) / classicCount) * 100) 
          : modernCount > 0 ? 100 : null;
        return { ...ev, classicCount, modernCount, delta };
      });
    },
    refetchInterval: 60000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Classic vs Modern (A/B)</CardTitle>
          <CardDescription>
            Comparação de eventos de criação entre os dois modos de editor
          </CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <DataTable
            data={abData || []}
            rowKey={(r) => r.classic}
            pageSize={10}
            emptyMessage="Nenhum dado disponível"
            columns={[
              { key: 'label', label: 'Evento', sortable: true, className: 'font-medium' },
              { key: 'classicCount', label: 'Classic (A)', sortable: true, align: 'center', className: 'font-semibold' },
              { key: 'modernCount', label: 'Modern (B)', sortable: true, align: 'center', className: 'font-semibold' },
              {
                key: 'delta',
                label: 'Δ%',
                sortable: true,
                align: 'center',
                render: (r) =>
                  r.delta === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge variant={r.delta >= 0 ? 'default' : 'destructive'}>
                      {r.delta >= 0 ? '+' : ''}{r.delta}%
                    </Badge>
                  ),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default PQLAnalytics;
