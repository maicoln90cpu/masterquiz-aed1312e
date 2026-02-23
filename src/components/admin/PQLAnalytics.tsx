import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
    lead_count: number;
  };
}

interface IntentRow {
  intent: string;
  total: number;
  quizzes: number;
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
      stages: Record<UserStage, number>;
      free: number;
      paid: number;
    }>();

    const ensureIntent = (key: string) => {
      if (!intentMap.has(key)) {
        intentMap.set(key, {
          total: 0,
          quizzes: 0,
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intenção</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Quizzes</TableHead>
                <TableHead className="text-center">🧊 Expl.</TableHead>
                <TableHead className="text-center">🔥 Constr.</TableHead>
                <TableHead className="text-center">🚀 Oper.</TableHead>
                <TableHead className="text-center">% Expl→Constr</TableHead>
                <TableHead className="text-center">% Constr→Oper</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Paid</TableHead>
                <TableHead className="text-center">% Trial→Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intentTable.map((row) => (
                <TableRow key={row.intent}>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {INTENT_LABELS[row.intent] || row.intent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.total}</TableCell>
                  <TableCell className="text-center">{row.quizzes}</TableCell>
                  <TableCell className="text-center">{row.explorador}</TableCell>
                  <TableCell className="text-center">{row.construtor}</TableCell>
                  <TableCell className="text-center">{row.operador}</TableCell>
                  <TableCell className="text-center">{formatPct(row.pctExplConstr)}</TableCell>
                  <TableCell className="text-center">{formatPct(row.pctConstrOper)}</TableCell>
                  <TableCell className="text-center">{row.free}</TableCell>
                  <TableCell className="text-center">{row.paid}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {formatPct(row.pctTrialPaid)}
                  </TableCell>
                </TableRow>
              ))}
              {intentTable.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gerou Lead de Teste?</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Paid</TableHead>
                <TableHead className="text-center">% Trial → Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadImpactTable.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>
                    <Badge variant={row.label === "Sim" ? "default" : "secondary"}>
                      {row.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{row.total}</TableCell>
                  <TableCell className="text-center">{row.free}</TableCell>
                  <TableCell className="text-center">{row.paid}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {formatPct(row.pctTrialPaid)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default PQLAnalytics;
