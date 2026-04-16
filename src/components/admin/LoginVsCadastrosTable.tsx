import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogIn, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DayRow {
  date: string;
  cadastros: number;
  logins: number;
  taxa: string;
}

function useLoginsVsCadastros() {
  return useQuery({
    queryKey: ['logins-vs-cadastros'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      // Fetch cadastros (profiles.created_at) and logins (login_events) in parallel
      const [profilesRes, loginsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', since)
          .is('deleted_at', null),
        supabase
          .from('login_events')
          .select('logged_in_at')
          .gte('logged_in_at', since),
      ]);

      // Group cadastros by day
      const cadastrosByDay: Record<string, number> = {};
      for (const p of profilesRes.data || []) {
        const day = new Date(p.created_at).toISOString().split('T')[0];
        cadastrosByDay[day] = (cadastrosByDay[day] || 0) + 1;
      }

      // Group logins by day
      const loginsByDay: Record<string, number> = {};
      for (const l of loginsRes.data || []) {
        const day = new Date(l.logged_in_at).toISOString().split('T')[0];
        loginsByDay[day] = (loginsByDay[day] || 0) + 1;
      }

      // Merge into unified rows for last 30 days
      const rows: DayRow[] = [];
      let totalCadastros = 0;
      let totalLogins = 0;

      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const cadastros = cadastrosByDay[dateStr] || 0;
        const logins = loginsByDay[dateStr] || 0;
        totalCadastros += cadastros;
        totalLogins += logins;

        // Only include days with any activity
        if (cadastros > 0 || logins > 0) {
          rows.push({
            date: dateStr,
            cadastros,
            logins,
            taxa: cadastros > 0 ? `${Math.round((logins / cadastros) * 100)}%` : logins > 0 ? '∞' : '—',
          });
        }
      }

      return {
        rows,
        totalCadastros,
        totalLogins,
        avgReturnRate: totalCadastros > 0 ? Math.round((totalLogins / totalCadastros) * 100) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function LoginVsCadastrosTable() {
  const { data, isLoading } = useLoginsVsCadastros();

  if (isLoading) return <Skeleton className="h-[350px] rounded-lg" />;

  if (!data || (data.totalCadastros === 0 && data.totalLogins === 0)) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Logins vs Cadastros</CardTitle>
          </div>
          <CardDescription>Ainda sem dados nos últimos 30 dias.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">Logins vs Cadastros — Últimos 30 dias</CardTitle>
        </div>
        <CardDescription>Compara quantos se cadastraram vs quantos voltaram a logar por dia</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-primary">{data.totalCadastros}</div>
            <div className="text-xs text-muted-foreground">Cadastros</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <LogIn className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{data.totalLogins}</div>
            <div className="text-xs text-muted-foreground">Logins</div>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{data.avgReturnRate}%</div>
            <div className="text-xs text-muted-foreground">Taxa Retorno</div>
          </div>
        </div>

        {/* Daily table */}
        <div className="max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs text-center">Cadastros</TableHead>
                <TableHead className="text-xs text-center">Logins</TableHead>
                <TableHead className="text-xs text-center">Taxa Retorno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="text-xs">
                    {new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge variant="secondary">{row.cadastros}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge variant="outline">{row.logins}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-center font-medium">{row.taxa}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
