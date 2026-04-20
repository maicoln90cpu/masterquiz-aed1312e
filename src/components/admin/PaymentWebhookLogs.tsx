import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const LOGS_PER_PAGE = 15;

export default function PaymentWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [currentPage, statusFilter, providerFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('webhook_logs')
        .select('id, created_at, email, evento, produto, status, provider, error_message, status_code', { count: 'exact' })
        .eq('provider', 'kiwify')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      const offset = (currentPage - 1) * LOGS_PER_PAGE;
      query = query.range(offset, offset + LOGS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
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

  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE);

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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum log de webhook de pagamento encontrado.
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Data/Hora</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <>
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <TableCell className="text-xs">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getProviderBadge(log.provider)}</TableCell>
                      <TableCell className="text-sm">{log.email || '-'}</TableCell>
                      <TableCell>{getEventBadge(log.evento)}</TableCell>
                      <TableCell className="text-sm max-w-32 truncate">{log.produto || '-'}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                    {expandedLog === log.id && log.error_message && (
                      <TableRow key={`${log.id}-details`}>
                        <TableCell colSpan={6} className="bg-red-50 dark:bg-red-950/20">
                          <div className="text-xs">
                            <strong className="text-red-600">Erro:</strong>
                            <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-800 dark:text-red-200 whitespace-pre-wrap">
                              {log.error_message}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * LOGS_PER_PAGE) + 1} - {Math.min(currentPage * LOGS_PER_PAGE, totalCount)} de {totalCount} logs
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
