import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, LayoutDashboard, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyData {
  date: string;
  create_ai: number;
  dashboard: number;
  total: number;
  ai_pct: number;
}

function usePostExpressConversion() {
  return useQuery({
    queryKey: ['post-express-conversion'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('gtm_event_logs')
        .select('metadata, created_at')
        .eq('event_name', 'post_express_choice')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate by day
      const byDay: Record<string, { create_ai: number; dashboard: number }> = {};
      let totalAI = 0;
      let totalDash = 0;

      for (const row of data || []) {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        if (!byDay[date]) byDay[date] = { create_ai: 0, dashboard: 0 };

        const choice = (row.metadata as Record<string, string>)?.choice;
        if (choice === 'create_ai') {
          byDay[date].create_ai++;
          totalAI++;
        } else if (choice === 'dashboard') {
          byDay[date].dashboard++;
          totalDash++;
        }
      }

      const daily: DailyData[] = Object.entries(byDay)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, counts]) => {
          const total = counts.create_ai + counts.dashboard;
          return {
            date,
            ...counts,
            total,
            ai_pct: total > 0 ? Math.round((counts.create_ai / total) * 100) : 0,
          };
        });

      const grandTotal = totalAI + totalDash;

      return {
        daily,
        totalAI,
        totalDash,
        grandTotal,
        aiPct: grandTotal > 0 ? Math.round((totalAI / grandTotal) * 100) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function PostExpressConversionCard() {
  const { data, isLoading } = usePostExpressConversion();

  if (isLoading) return <Skeleton className="h-[300px] rounded-lg" />;

  if (!data || data.grandTotal === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Conversão Pós-Express</CardTitle>
          </div>
          <CardDescription>Ainda sem dados. Os eventos serão registrados conforme novos usuários completam o fluxo Express.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">Conversão Pós-Express</CardTitle>
        </div>
        <CardDescription>O que os usuários escolhem após publicar o quiz Express</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-primary">{data.aiPct}%</div>
            <div className="text-xs text-muted-foreground">Criar com IA</div>
            <div className="text-xs font-medium">{data.totalAI} users</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <LayoutDashboard className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{100 - data.aiPct}%</div>
            <div className="text-xs text-muted-foreground">Dashboard</div>
            <div className="text-xs font-medium">{data.totalDash} users</div>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <div className="text-2xl font-bold">{data.grandTotal}</div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xs font-medium">últimos 30d</div>
          </div>
        </div>

        {/* Daily table */}
        {data.daily.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs text-center">IA</TableHead>
                  <TableHead className="text-xs text-center">Dashboard</TableHead>
                  <TableHead className="text-xs text-center">% IA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="text-xs">{new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge variant="secondary" className="text-xs">{row.create_ai}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">{row.dashboard}</TableCell>
                    <TableCell className="text-xs text-center font-medium">
                      {row.ai_pct}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
