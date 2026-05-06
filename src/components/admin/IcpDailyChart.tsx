import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type PeriodDays = 7 | 15 | 30;
const PERIOD_OPTIONS: { label: string; value: PeriodDays }[] = [
  { label: "7 dias", value: 7 },
  { label: "15 dias", value: 15 },
  { label: "30 dias", value: 30 },
];

interface Row {
  day: string;
  perfil_on: number;
  perfil_off: number;
}

export function IcpDailyChart() {
  const [period, setPeriod] = useState<PeriodDays>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["icp-daily-breakdown", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("icp_daily_breakdown", { _days: period });
      if (error) throw error;
      return (data || []) as Row[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    return (data || []).map(r => ({
      date: new Date(r.day + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      PerfilON: r.perfil_on,
      PerfilOFF: r.perfil_off,
    }));
  }, [data]);

  const totals = useMemo(() => {
    const on = (data || []).reduce((s, r) => s + r.perfil_on, 0);
    const off = (data || []).reduce((s, r) => s + r.perfil_off, 0);
    const total = on + off;
    return { on, off, total, pctOn: total > 0 ? Math.round((on / total) * 100) : 0 };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Evolução PerfilON × PerfilOFF</CardTitle>
          </div>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={period === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Cadastros classificados como ICP comercial (ON) vs educacional/sem objetivo (OFF) por dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-[300px]" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <div className="text-2xl font-bold text-primary">{totals.on}</div>
                <div className="text-xs text-muted-foreground">PerfilON</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <div className="text-2xl font-bold text-muted-foreground">{totals.off}</div>
                <div className="text-xs text-muted-foreground">PerfilOFF</div>
              </div>
              <div className="text-center p-3 rounded-lg border">
                <div className="text-2xl font-bold">{totals.pctOn}%</div>
                <div className="text-xs text-muted-foreground">% ICP no período</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="PerfilON" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="PerfilOFF" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
