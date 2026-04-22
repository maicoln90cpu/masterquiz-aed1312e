import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Info, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTable, type DataTableColumn } from "@/components/admin/system/DataTable";
import { PageLoading } from "@/components/ui/page-loading";
import { EmptyState } from "@/components/ui/empty-state";
import { Mail } from "lucide-react";

interface WebhookLog {
  id: string;
  created_at: string;
  email: string | null;
  evento: string | null;
  produto: string | null;
  status: string | null;
  provider: string | null;
  error_message: string | null;
  status_code: number | null;
}

export default function PaymentWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [statusFilter, providerFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('webhook_logs')
        .select('id, created_at, email, evento, produto, status, provider, error_message, status_code')
        .eq('provider', 'kiwify')
        .order('created_at', { ascending: false })
        .limit(500);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      logger.error('Error loading webhook logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  const getEventBadge = (evento: string | null) => {
    const eventColors: Record<string, string> = {
      'order_paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'subscription_created': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'subscription_renewed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'subscription_cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'refund_requested': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'chargeback': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    const colorClass = eventColors[evento || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    return <Badge className={colorClass}>{evento || 'N/A'}</Badge>;
  };

  const getProviderBadge = (provider: string | null) => {
    if (provider === 'kiwify') {
      return <Badge variant="outline" className="border-green-500 text-green-600">🥝 Kiwify</Badge>;
    }
    return <Badge variant="outline">{provider || 'N/A'}</Badge>;
  };

  const columns: DataTableColumn<WebhookLog>[] = [
    {
      key: 'created_at',
      label: 'Data/Hora',
      sortable: true,
      className: 'w-44',
      render: (log) => (
        <span className="text-xs">
          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
        </span>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      filterable: true,
      render: (log) => getProviderBadge(log.provider),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      searchable: true,
      render: (log) => <span className="text-sm">{log.email || '-'}</span>,
    },
    {
      key: 'evento',
      label: 'Evento',
      filterable: true,
      searchable: true,
      render: (log) => getEventBadge(log.evento),
    },
    {
      key: 'produto',
      label: 'Produto',
      searchable: true,
      className: 'max-w-[200px]',
      render: (log) => (
        <span className="text-sm truncate block">{log.produto || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      filterable: true,
      align: 'center',
      className: 'w-28',
      render: (log) => (
        <div className="space-y-1">
          {getStatusBadge(log.status)}
          {log.error_message && (
            <p className="text-[10px] text-destructive max-w-[180px] truncate" title={log.error_message}>
              {log.error_message}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Logs globais de webhooks de pagamento recebidos (Kiwify).
          Estes logs não estão vinculados a usuários específicos.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Provider:</span>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="kiwify">Kiwify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <PageLoading variant="skeleton" rows={6} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum log de webhook de pagamento encontrado"
          description="Logs de Kiwify aparecerão aqui assim que forem recebidos."
        />
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          defaultSortKey="created_at"
          defaultSortDirection="desc"
          searchPlaceholder="Buscar email, evento ou produto…"
          exportCsv="payment-webhook-logs"
          rowKey={(log) => log.id}
        />
      )}
    </div>
  );
}
