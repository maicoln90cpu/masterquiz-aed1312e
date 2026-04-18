import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, Play, Trash2, Clock, Send, AlertCircle, XCircle, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/system/DataTable";

interface QueueItem {
  id: string;
  user_id: string;
  phone_number: string;
  status: string;
  priority: number;
  scheduled_at: string | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
  recovery_templates?: {
    name: string;
  };
}

interface ProcessingProgress {
  initialPending: number;
  currentPending: number;
  processed: number;
  lastPhone?: string;
  lastStatus?: 'success' | 'error';
  delayMin: number;
  delayMax: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  queued: 'bg-blue-500',
  sent: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-500',
};

export function RecoveryQueue() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cancelingSelected, setCancelingSelected] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    queued: 0,
    failed: 0,
    total_today: 0,
  });

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_contacts')
        .select(`
          id,
          user_id,
          phone_number,
          status,
          priority,
          scheduled_at,
          retry_count,
          error_message,
          created_at,
          recovery_templates:template_id (name)
        `)
        .in('status', ['pending', 'queued', 'failed'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(100);

      // Filter out permanently failed items (retry >= 3) from active queue
      const activeQueue = (data || []).filter(item => 
        !(item.status === 'failed' && (item.retry_count || 0) >= 3)
      );
      const permanentlyFailed = (data || []).filter(item => 
        item.status === 'failed' && (item.retry_count || 0) >= 3
      ).length;

      if (error) throw error;

      // Buscar nomes dos perfis separadamente (join direto falha sem FK formal)
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profiles) {
          profilesMap = Object.fromEntries(
            profiles.map(p => [p.id, p.full_name || ''])
          );
        }
      }

      const enrichedData = activeQueue.map(item => ({
        ...item,
        profiles: { full_name: profilesMap[item.user_id] || null },
      }));

      setQueue(enrichedData as any);
      setSelectedIds(new Set());

      // Calculate stats - separate retryable from permanent failures
      const pending = activeQueue.filter(q => q.status === 'pending').length;
      const queued = activeQueue.filter(q => q.status === 'queued').length;
      const retryableFailed = activeQueue.filter(q => q.status === 'failed').length;

      setStats({
        pending,
        queued,
        failed: retryableFailed,
        total_today: pending + queued,
      });
    } catch (error) {
      console.error('Error loading queue:', error);
      toast.error('Erro ao carregar fila');
    } finally {
      setLoading(false);
    }
  };

  // Start polling for progress updates
  const startPolling = (initialPending: number) => {
    // Load delay settings
    supabase
      .from('recovery_settings')
      .select('message_delay_seconds, delay_max_seconds')
      .single()
      .then(({ data: settings }) => {
        const delayMin = settings?.message_delay_seconds || 120;
        const delayMax = settings?.delay_max_seconds || 300;
        
        setProcessingProgress({
          initialPending,
          currentPending: initialPending,
          processed: 0,
          delayMin,
          delayMax,
        });
      });

    // Poll every 5 seconds
    pollingRef.current = setInterval(async () => {
      const { data, error } = await supabase
        .from('recovery_contacts')
        .select('id, phone_number, status')
        .in('status', ['pending', 'queued', 'failed']);

      if (!error && data) {
        const currentPending = data.filter(d => d.status === 'pending' || d.status === 'queued').length;
        const processed = (processingProgress?.initialPending || initialPending) - currentPending;
        
        // Find the last processed item
        const lastSent = data.find(d => d.status === 'sent' || d.status === 'failed');
        
        setProcessingProgress(prev => prev ? {
          ...prev,
          currentPending,
          processed: Math.max(processed, 0),
          lastPhone: lastSent?.phone_number,
          lastStatus: lastSent?.status === 'sent' ? 'success' : lastSent?.status === 'failed' ? 'error' : undefined,
        } : null);

        // Stop polling if all processed
        if (currentPending === 0) {
          stopPolling();
          setProcessing(false);
          toast.success('Processamento concluído!');
          loadQueue();
        }
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setProcessingProgress(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const processQueue = async () => {
    setProcessing(true);
    const initialPending = stats.pending + stats.queued;
    
    try {
      // Start polling for progress
      startPolling(initialPending);
      
      const { data, error } = await supabase.functions.invoke('process-recovery-queue', {
        body: { action: 'process_queue' }
      });

      if (error) throw error;

      toast.success(`Processamento iniciado! Aguarde enquanto as mensagens são enviadas.`);
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Erro ao processar fila');
      stopPolling();
      setProcessing(false);
    }
  };

  const cancelItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recovery_contacts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Item removido da fila');
      loadQueue();
    } catch (error) {
      console.error('Error canceling item:', error);
      toast.error('Erro ao cancelar item');
    }
  };

  const cancelSelectedItems = async () => {
    if (selectedIds.size === 0) return;
    
    setCancelingSelected(true);
    try {
      const { error } = await supabase
        .from('recovery_contacts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} itens cancelados`);
      setSelectedIds(new Set());
      loadQueue();
    } catch (error) {
      console.error('Error canceling selected items:', error);
      toast.error('Erro ao cancelar itens selecionados');
    } finally {
      setCancelingSelected(false);
    }
  };

  const retryFailed = async () => {
    try {
      // Only retry items that haven't exceeded max retries
      const { error } = await supabase
        .from('recovery_contacts')
        .update({ 
          status: 'pending',
          retry_count: 0,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'failed')
        .lt('retry_count', 3);

      if (error) throw error;

      toast.success('Itens com falha recolocados na fila (exceto falhas permanentes)');
      loadQueue();
    } catch (error) {
      console.error('Error retrying failed:', error);
      toast.error('Erro ao reprocessar falhas');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === queue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queue.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.queued}</p>
                <p className="text-sm text-muted-foreground">Na Fila</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_today}</p>
                <p className="text-sm text-muted-foreground">Total Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress Card */}
      {processing && processingProgress && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-lg">
                    Processando: {processingProgress.processed}/{processingProgress.initialPending}
                  </p>
                  {processingProgress.lastPhone && (
                    <Badge variant={processingProgress.lastStatus === 'success' ? 'default' : 'destructive'}>
                      {processingProgress.lastStatus === 'success' ? '✓' : '✗'} {processingProgress.lastPhone}
                    </Badge>
                  )}
                </div>
                
                <Progress 
                  value={processingProgress.initialPending > 0 
                    ? (processingProgress.processed / processingProgress.initialPending) * 100 
                    : 0
                  } 
                  className="h-2"
                />
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>
                    Delay anti-spam: {processingProgress.delayMin}-{processingProgress.delayMax}s entre envios
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  O sistema envia 1 mensagem por vez para evitar bloqueio. 
                  Restam aproximadamente {processingProgress.currentPending} mensagens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-medium">
              Processamento automático ativo (cron a cada 5 min)
            </p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            O sistema processa a fila automaticamente respeitando horários, limites diários/hora e delays anti-spam.
            Não é necessário manter esta aba aberta.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={processQueue} disabled={processing || stats.pending === 0}>
          {processing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Processar Agora (Manual)</>
          )}
        </Button>
        {stats.failed > 0 && (
          <Button variant="outline" onClick={retryFailed}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reprocessar Falhas ({stats.failed})
          </Button>
        )}
        <Button variant="outline" onClick={loadQueue} disabled={processing}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
        {selectedIds.size > 0 && (
          <Button 
            variant="destructive" 
            onClick={cancelSelectedItems}
            disabled={cancelingSelected}
          >
            {cancelingSelected ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelando...</>
            ) : (
              <><XCircle className="h-4 w-4 mr-2" /> Cancelar Selecionados ({selectedIds.size})</>
            )}
          </Button>
        )}
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Envio</CardTitle>
          <CardDescription>
            Mensagens aguardando envio ou com falha
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            data={queue}
            rowKey={(item) => item.id}
            defaultSortKey="priority"
            defaultSortDirection="asc"
            searchPlaceholder="Buscar por telefone ou nome…"
            emptyMessage="Nenhum item na fila"
            exportCsv="recovery-queue"
            columns={[
              {
                key: 'select',
                label: '',
                accessor: () => '',
                render: (item) => (
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                    aria-label={`Selecionar ${item.phone_number}`}
                  />
                ),
              },
              {
                key: 'full_name',
                label: 'Usuário',
                searchable: true,
                accessor: (i) => i.profiles?.full_name || '',
                render: (i) => <span className="font-medium">{i.profiles?.full_name || 'N/A'}</span>,
              },
              { key: 'phone_number', label: 'Telefone', sortable: true, searchable: true },
              {
                key: 'template',
                label: 'Template',
                filterable: true,
                accessor: (i) => i.recovery_templates?.name || 'N/A',
                render: (i) => i.recovery_templates?.name || 'N/A',
              },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                filterable: true,
                render: (item) => (
                  <>
                    <Badge className={STATUS_COLORS[item.status]}>{item.status}</Badge>
                    {item.error_message && (
                      <div className="mt-1 max-w-[250px]">
                        <p className="text-xs text-red-500 truncate" title={item.error_message}>
                          {item.error_message}
                        </p>
                      </div>
                    )}
                  </>
                ),
              },
              { key: 'priority', label: 'Prioridade', sortable: true, align: 'center' },
              { key: 'retry_count', label: 'Tentativas', sortable: true, align: 'center' },
              {
                key: 'scheduled_at',
                label: 'Agendado',
                sortable: true,
                render: (i) => i.scheduled_at ? new Date(i.scheduled_at).toLocaleString('pt-BR') : 'Imediato',
              },
            ]}
            actions={(item) => (
              <Button variant="ghost" size="icon" onClick={() => cancelItem(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
