import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/admin/system/DataTable";
import { useMemo } from "react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  expired: { label: "Expirado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  converted: { label: "Convertido", variant: "outline" },
};

const planLabels: Record<string, string> = {
  free: "Free",
  paid: "Pro",
  partner: "Partner",
  premium: "Premium",
};

interface TrialLog {
  id: string;
  user_email: string | null;
  original_plan_type: string;
  trial_plan_type: string;
  trial_days: number;
  trial_end_date: string;
  created_at: string;
  status: string;
}

export const TrialLogsViewer = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['trial-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as TrialLog[];
    },
  });

  const stats = useMemo(() => ({
    total: logs?.length || 0,
    active: logs?.filter(l => l.status === 'active').length || 0,
    expired: logs?.filter(l => l.status === 'expired').length || 0,
    cancelled: logs?.filter(l => l.status === 'cancelled').length || 0,
    converted: logs?.filter(l => l.status === 'converted').length || 0,
  }), [logs]);

  const conversionRate = stats.total > 0
    ? ((stats.converted / Math.max(1, stats.expired + stats.converted + stats.cancelled)) * 100).toFixed(1)
    : '0';

  const columns: DataTableColumn<TrialLog>[] = useMemo(() => [
    {
      key: 'user_email',
      label: 'Usuário',
      sortable: true,
      searchable: true,
      render: (l) => <span className="text-sm font-medium">{l.user_email || 'N/A'}</span>,
    },
    {
      key: 'trial_plan_type',
      label: 'Plano Trial',
      sortable: true,
      filterable: true,
      render: (l) => (
        <div className="flex items-center gap-1 text-sm">
          <span>{planLabels[l.original_plan_type] || l.original_plan_type}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{planLabels[l.trial_plan_type] || l.trial_plan_type}</span>
        </div>
      ),
    },
    {
      key: 'trial_days',
      label: 'Duração',
      sortable: true,
      align: 'center',
      render: (l) => {
        const daysLeft = l.status === 'active'
          ? Math.max(0, Math.ceil((new Date(l.trial_end_date).getTime() - Date.now()) / (1000*60*60*24)))
          : null;
        return (
          <span className="text-sm">
            {l.trial_days}d
            {daysLeft !== null && (
              <span className="text-xs text-muted-foreground ml-1">({daysLeft}d restam)</span>
            )}
          </span>
        );
      },
    },
    { key: 'created_at', label: 'Início', sortable: true, format: 'date' },
    { key: 'trial_end_date', label: 'Expira', sortable: true, format: 'date' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      align: 'center',
      render: (l) => {
        const cfg = statusConfig[l.status] || statusConfig.active;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
  ], []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Histórico de Trials</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-primary">{stats.active}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p><p className="text-xs text-muted-foreground">Expirados</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold text-destructive">{stats.cancelled}</p><p className="text-xs text-muted-foreground">Cancelados</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-bold">{conversionRate}%</p><p className="text-xs text-muted-foreground">Conversão</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Histórico de Trials
          </CardTitle>
          <CardDescription>
            Todos os planos temporários concedidos, com status e conversão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum trial registrado ainda. Ative um trial na aba de Usuários.
            </p>
          ) : (
            <DataTable<TrialLog>
              data={logs}
              columns={columns}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
              pageSize={15}
              searchPlaceholder="Buscar por email…"
              exportCsv="trial-logs"
              rowKey={(l) => l.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
