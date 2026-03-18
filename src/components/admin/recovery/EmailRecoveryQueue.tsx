import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Play, Trash2, Mail, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_recovery_contacts')
        .select('*, profiles(full_name), email_recovery_templates(name, subject)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setItems(data || []);
    } catch { toast.error('Erro ao carregar fila'); }
    finally { setLoading(false); }
  };

  const generateTargets = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-inactive-users-email');
      if (error) throw error;
      toast.success(`${data.queued || 0} emails enfileirados`);
      load();
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
      load();
    } catch {
      toast.error('Erro ao processar fila');
    } finally {
      setProcessing(false);
    }
  };

  const cancelPending = async () => {
    if (!confirm('Cancelar todos os emails pendentes?')) return;
    const { error } = await supabase.from('email_recovery_contacts').update({ status: 'cancelled' }).eq('status', 'pending');
    if (error) { toast.error('Erro'); return; }
    toast.success('Pendentes cancelados');
    load();
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const sentCount = items.filter(i => i.status === 'sent').length;
  const failedCount = items.filter(i => i.status === 'failed').length;

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

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
        <Button onClick={load} variant="ghost" size="icon"><RefreshCw className="h-4 w-4" /></Button>
        {pendingCount > 0 && (
          <Button onClick={cancelPending} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" /> Cancelar Pendentes
          </Button>
        )}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum email na fila</p>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Dias Inativo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.profiles?.full_name || '-'}</TableCell>
                  <TableCell className="text-sm">{item.email}</TableCell>
                  <TableCell><Badge variant="outline">{item.email_recovery_templates?.name || '-'}</Badge></TableCell>
                  <TableCell>{item.days_inactive_at_contact}d</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[item.status] || 'bg-gray-500'}>
                      {item.status}
                    </Badge>
                    {item.error_message && (
                      <span className="text-xs text-destructive block mt-1 max-w-[200px] truncate">{item.error_message}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.sent_at ? new Date(item.sent_at).toLocaleString('pt-BR') : new Date(item.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
