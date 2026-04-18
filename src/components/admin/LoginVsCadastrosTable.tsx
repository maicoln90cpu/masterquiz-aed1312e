import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogIn, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, type DataTableColumn } from "@/components/admin/system/DataTable";
import { useMemo } from "react";

interface DayRow {
  date: string;
  cadastros: number;
  logins: number;
  taxa_num: number; // numérica para sort
  taxa: string;     // formatada
}

function useLoginsVsCadastros() {
  return useQuery({
    queryKey: ['logins-vs-cadastros'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      const [dailyRes, loginsRes, totalRealRes] = await Promise.all([
        supabase.rpc('real_users_daily', { _days: 30 }),
        supabase.from('login_events').select('logged_in_at').gte('logged_in_at', since),
        supabase.rpc('count_real_users_since', { _since: since }),
      ]);

      const cadastrosByDay: Record<string, number> = {};
      for (const row of (dailyRes.data as Array<{ day: string; cadastros: number }> | null) || []) {
        cadastrosByDay[row.day] = row.cadastros;
      }

      const loginsByDay: Record<string, number> = {};
      for (const l of loginsRes.data || []) {
        const day = new Date(l.logged_in_at).toISOString().split('T')[0];
        loginsByDay[day] = (loginsByDay[day] || 0) + 1;
      }

      const rows: DayRow[] = [];
      let totalLogins = 0;
      const totalCadastros = Number(totalRealRes.data || 0);

      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const cadastros = cadastrosByDay[dateStr] || 0;
        const logins = loginsByDay[dateStr] || 0;
        totalLogins += logins;

        if (cadastros > 0 || logins > 0) {
          const taxa_num = cadastros > 0 ? Math.round((logins / cadastros) * 100) : (logins > 0 ? 9999 : 0);
          rows.push({
            date: dateStr,
            cadastros,
            logins,
            taxa_num,
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

  const columns: DataTableColumn<DayRow>[] = useMemo(() => [
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (r) => (
        <span className="text-xs">
          {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' })}
        </span>
      ),
    },
    {
      key: 'cadastros',
      label: 'Cadastros',
      sortable: true,
      align: 'center',
      render: (r) => <Badge variant="secondary">{r.cadastros}</Badge>,
    },
    {
      key: 'logins',
      label: 'Logins',
      sortable: true,
      align: 'center',
      render: (r) => <Badge variant="outline">{r.logins}</Badge>,
    },
    {
      key: 'taxa_num',
      label: 'Taxa Retorno',
      sortable: true,
      align: 'center',
      render: (r) => <span className="text-xs font-medium">{r.taxa}</span>,
    },
  ], []);

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
        <CardDescription>
          Cadastros = usuários reais (auth + perfil ativo). Compara quantos voltaram a logar por dia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <DataTable<DayRow>
          data={data.rows}
          columns={columns}
          defaultSortKey="date"
          defaultSortDirection="desc"
          pageSize={10}
          exportCsv="logins-vs-cadastros"
          emptyMessage="Sem registros no período."
          rowKey={(r) => r.date}
        />
      </CardContent>
    </Card>
  );
}
