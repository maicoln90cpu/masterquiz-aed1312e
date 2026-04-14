import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Timer, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Histórico de Trials</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  const stats = {
    total: logs?.length || 0,
    active: logs?.filter(l => l.status === 'active').length || 0,
    expired: logs?.filter(l => l.status === 'expired').length || 0,
    cancelled: logs?.filter(l => l.status === 'cancelled').length || 0,
    converted: logs?.filter(l => l.status === 'converted').length || 0,
  };

  const conversionRate = stats.total > 0
    ? ((stats.converted / Math.max(1, stats.expired + stats.converted + stats.cancelled)) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expirados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Conversão</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs table */}
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano Trial</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => {
                    const cfg = statusConfig[log.status] || statusConfig.active;
                    const daysLeft = log.status === 'active'
                      ? Math.max(0, Math.ceil((new Date(log.trial_end_date).getTime() - Date.now()) / (1000*60*60*24)))
                      : null;

                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium">{log.user_email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <span>{planLabels[log.original_plan_type] || log.original_plan_type}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{planLabels[log.trial_plan_type] || log.trial_plan_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.trial_days}d</span>
                          {daysLeft !== null && (
                            <span className="text-xs text-muted-foreground ml-1">({daysLeft}d restam)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {new Date(log.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {new Date(log.trial_end_date).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
