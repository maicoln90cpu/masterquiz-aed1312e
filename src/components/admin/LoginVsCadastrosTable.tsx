import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogIn, TrendingUp, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, type DataTableColumn } from "@/components/admin/system/DataTable";
import { useMemo, useState } from "react";

// Períodos suportados pelo seletor (mesmo padrão do PerformancePanel).
type PeriodDays = 7 | 15 | 30;
const PERIOD_OPTIONS: { label: string; value: PeriodDays }[] = [
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
];

interface DayRow {
  date: string;
  cadastros: number;
  perfilOn: number;
  pctIcp: string;
  logins: number;
  taxa_num: number; // numérica para sort
  taxa: string;     // formatada
}

function useLoginsVsCadastros(period: PeriodDays) {
  return useQuery({
    queryKey: ['logins-vs-cadastros', period],
    queryFn: async () => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - period);
      const since = sinceDate.toISOString();

      const [dailyRes, loginsRes, totalRealRes] = await Promise.all([
        supabase.rpc('real_users_daily', { _days: period }),
        supabase.from('login_events').select('logged_in_at').gte('logged_in_at', since),
        supabase.rpc('count_real_users_since', { _since: since }),
      ]);

      const cadastrosByDay: Record<string, number> = {};
      const perfilOnByDay: Record<string, number> = {};
      for (const row of (dailyRes.data as Array<{ day: string; cadastros: number; perfil_on: number }> | null) || []) {
        cadastrosByDay[row.day] = row.cadastros;
        perfilOnByDay[row.day] = row.perfil_on || 0;
      }

      const loginsByDay: Record<string, number> = {};
      for (const l of loginsRes.data || []) {
        const day = new Date(l.logged_in_at).toISOString().split('T')[0];
        loginsByDay[day] = (loginsByDay[day] || 0) + 1;
      }

      const rows: DayRow[] = [];
      let totalLogins = 0;
      let totalPerfilOn = 0;
      const totalCadastros = Number(totalRealRes.data || 0);

      for (let i = 0; i < period; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const cadastros = cadastrosByDay[dateStr] || 0;
        const perfilOn = perfilOnByDay[dateStr] || 0;
        const logins = loginsByDay[dateStr] || 0;
        totalLogins += logins;
        totalPerfilOn += perfilOn;

        if (cadastros > 0 || logins > 0) {
          const taxa_num = cadastros > 0 ? Math.round((logins / cadastros) * 100) : (logins > 0 ? 9999 : 0);
          rows.push({
            date: dateStr,
            cadastros,
            perfilOn,
            pctIcp: cadastros > 0 ? `${Math.round((perfilOn / cadastros) * 100)}%` : '—',
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
        totalPerfilOn,
        pctIcpTotal: totalCadastros > 0 ? Math.round((totalPerfilOn / totalCadastros) * 100) : 0,
        avgReturnRate: totalCadastros > 0 ? Math.round((totalLogins / totalCadastros) * 100) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function LoginVsCadastrosTable() {
  // Período selecionado (default 30 dias — mantém comportamento original).
  const [period, setPeriod] = useState<PeriodDays>(30);
  const { data, isLoading } = useLoginsVsCadastros(period);

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
      key: 'perfilOn',
      label: 'PerfilON',
      sortable: true,
      align: 'center',
      render: (r) => (
        <div className="flex flex-col items-center gap-0.5">
          <Badge variant="default" className="bg-primary/15 text-primary hover:bg-primary/20">{r.perfilOn}</Badge>
          <span className="text-[10px] text-muted-foreground">{r.pctIcp}</span>
        </div>
      ),
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
          <CardDescription>Ainda sem dados nos últimos {period} dias.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Logins vs Cadastros — Últimos {period} dias</CardTitle>
          </div>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={period === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <CardDescription>
          Cadastros = usuários reais (auth + perfil ativo). PerfilON = cadastros classificados como ICP comercial (objetivo ≠ educacional).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-primary">{data.totalCadastros}</div>
            <div className="text-xs text-muted-foreground">Cadastros</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
            <Target className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
            <div className="text-2xl font-bold text-emerald-600">{data.totalPerfilOn}</div>
            <div className="text-xs text-muted-foreground">PerfilON ({data.pctIcpTotal}%)</div>
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
