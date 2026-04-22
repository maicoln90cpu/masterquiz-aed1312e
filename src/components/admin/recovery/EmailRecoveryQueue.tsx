import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { shouldRetryQuery, queryRetryDelay } from "@/lib/queryRetry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Play, Trash2, Mail, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/system/DataTable";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoading } from "@/components/ui/page-loading";
import { ErrorState } from "@/components/ui/error-state";

interface QueueItem {
  id: string;
  user_id: string;
  email: string;
  status: string;
  priority: number;
  days_inactive_at_contact: number;
  scheduled_at: string | null;
  sent_at: string | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
  email_recovery_templates?: { name: string; subject: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  sent: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
  opened: 'bg-blue-500',
  clicked: 'bg-purple-500',
};

export function EmailRecoveryQueue() {
  const qc = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const QUEUE_KEY = ["email-recovery-queue"];
  const {
    data: items = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<QueueItem[]>({
    queryKey: QUEUE_KEY,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
    queryFn: async () => {
      const { data, error: qErr } = await supabase
        .from('email_recovery_contacts')
        .select('*, profiles(full_name), email_recovery_templates(name, subject)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (qErr) throw qErr;
      return (data || []) as QueueItem[];
    },
  });

  const reload = () => qc.invalidateQueries({ queryKey: QUEUE_KEY });

  const generateTargets = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-inactive-users-email');
      if (error) throw error;
      toast.success(`${data.queued || 0} emails enfileirados`);
      reload();
    } catch (err) {
      toast.error('Erro ao gerar alvos');
    } finally {
      setGenerating(false);
    }
  };

  const processQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-recovery-queue');
      if (error) throw error;
      toast.success(`${data.processed || 0} emails enviados`);
      reload();
    } catch {
      toast.error('Erro ao processar fila');
    } finally {
      setProcessing(false);
    }
  };

  const cancelPending = async () => {
    if (!confirm('Cancelar todos os emails pendentes?')) return;
    // Optimistic update — marca pendentes como cancelados localmente
    const previous = qc.getQueryData<QueueItem[]>(QUEUE_KEY);
    qc.setQueryData<QueueItem[]>(QUEUE_KEY, (old) =>
      (old || []).map((it) => (it.status === 'pending' ? { ...it, status: 'cancelled' } : it)),
    );
    const { error: updErr } = await supabase
      .from('email_recovery_contacts')
      .update({ status: 'cancelled' })
      .eq('status', 'pending');
    if (updErr) {
      // Rollback
      if (previous) qc.setQueryData(QUEUE_KEY, previous);
      toast.error('Erro ao cancelar pendentes');
      return;
    }
    toast.success('Pendentes cancelados');
    reload();
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const sentCount = items.filter(i => i.status === 'sent').length;
  const failedCount = items.filter(i => i.status === 'failed').length;

  if (isLoading) return <PageLoading variant="skeleton" rows={5} />;
  if (isError) {
    return (
      <ErrorState
        title="Erro ao carregar fila de emails"
        message={(error as Error)?.message}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const columns: DataTableColumn<QueueItem>[] = [
    {
      key: 'profiles',
      label: 'Usuário',
      sortable: true,
      searchable: true,
      accessor: (item) => item.profiles?.full_name || '',
      render: (item) => <span className="font-medium">{item.profiles?.full_name || '-'}</span>,
    },
    { key: 'email', label: 'Email', sortable: true, searchable: true, className: 'text-sm' },
    {
      key: 'email_recovery_templates',
      label: 'Template',
      filterable: true,
      accessor: (item) => item.email_recovery_templates?.name || '-',
      render: (item) => <Badge variant="outline">{item.email_recovery_templates?.name || '-'}</Badge>,
    },
    {
      key: 'days_inactive_at_contact',
      label: 'Dias Inativo',
      sortable: true,
      align: 'center',
      render: (item) => `${item.days_inactive_at_contact}d`,
    },
    {
      key: 'status',
      label: 'Status',
      filterable: true,
      render: (item) => (
        <div>
          <Badge className={STATUS_COLORS[item.status] || 'bg-gray-500'}>{item.status}</Badge>
          {item.error_message && (
            <span className="text-xs text-destructive block mt-1 max-w-[200px] truncate">{item.error_message}</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Data',
      sortable: true,
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {item.sent_at ? new Date(item.sent_at).toLocaleString('pt-BR') : new Date(item.created_at).toLocaleString('pt-BR')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-green-500">{sentCount}</div>
          <p className="text-xs text-muted-foreground">Enviados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold text-red-500">{failedCount}</div>
          <p className="text-xs text-muted-foreground">Falhas</p>
        </CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={generateTargets} disabled={generating} variant="outline">
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
          Buscar Inativos
        </Button>
        <Button onClick={processQueue} disabled={processing || pendingCount === 0}>
          {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          Processar Fila ({pendingCount})
        </Button>
        <Button onClick={() => refetch()} variant="ghost" size="icon" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        {pendingCount > 0 && (
          <Button onClick={cancelPending} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" /> Cancelar Pendentes
          </Button>
        )}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState icon={Mail} title="Nenhum email na fila" description="Use 'Buscar Inativos' para enfileirar novos contatos." />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          defaultSortKey="created_at"
          defaultSortDirection="desc"
          searchPlaceholder="Buscar usuário ou email…"
          exportCsv="email-recovery-queue"
          rowKey={(item) => item.id}
        />
      )}
    </div>
  );
}
