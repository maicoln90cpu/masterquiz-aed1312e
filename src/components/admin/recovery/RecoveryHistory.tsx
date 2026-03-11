import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Search, Eye, CheckCircle, XCircle, Clock, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  user_id: string;
  phone_number: string;
  message_sent: string | null;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  response_at: string | null;
  response_text: string | null;
  error_message: string | null;
  days_inactive_at_contact: number | null;
  reactivated: boolean;
  reactivated_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
  recovery_templates?: {
    name: string;
  };
  recovery_campaigns?: {
    name: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-gray-500', icon: Clock },
  queued: { label: 'Na Fila', color: 'bg-blue-500', icon: Clock },
  sent: { label: 'Enviada', color: 'bg-blue-500', icon: MessageSquare },
  delivered: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle },
  read: { label: 'Lida', color: 'bg-emerald-500', icon: Eye },
  responded: { label: 'Respondida', color: 'bg-purple-500', icon: MessageSquare },
  failed: { label: 'Falhou', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'Cancelada', color: 'bg-gray-400', icon: XCircle },
};

export function RecoveryHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadHistory();
  }, [page, statusFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recovery_contacts')
        .select(`
          id,
          user_id,
          phone_number,
          message_sent,
          status,
          sent_at,
          delivered_at,
          read_at,
          response_at,
          response_text,
          error_message,
          days_inactive_at_contact,
          reactivated,
          reactivated_at,
          created_at,
          recovery_templates:template_id (name),
          recovery_campaigns:campaign_id (name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (statusFilter !== 'all' && statusFilter !== '') {
        const validStatuses = ['pending', 'queued', 'sent', 'delivered', 'read', 'responded', 'failed', 'cancelled'] as const;
        if (validStatuses.includes(statusFilter as any)) {
          query = query.eq('status', statusFilter as any);
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch profiles separately to avoid FK join issues
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

      const enrichedData = (data || []).map(item => ({
        ...item,
        profiles: { full_name: profilesMap[item.user_id] || null },
      }));

      setHistory(enrichedData as HistoryItem[]);
      setTotalCount(count || 0);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.phone_number.toLowerCase().includes(query) ||
      item.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map(item => item.id)));
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

  const deleteSelectedItems = async () => {
    if (selectedIds.size === 0) return;
    
    setDeletingSelected(true);
    try {
      const { error } = await supabase
        .from('recovery_contacts')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} registros excluídos`);
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      loadHistory();
    } catch (error) {
      console.error('Error deleting selected items:', error);
      toast.error('Erro ao excluir registros');
    } finally {
      setDeletingSelected(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && history.length === 0) {
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
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadHistory}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
        {selectedIds.size > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir Selecionados ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Contatos</CardTitle>
          <CardDescription>
            {totalCount} contatos registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredHistory.length > 0 && selectedIds.size === filteredHistory.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dias Inativo</TableHead>
                <TableHead>Reativou</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhum contato encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                        aria-label={`Selecionar ${item.phone_number}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.profiles?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>{item.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.recovery_templates?.name || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.recovery_campaigns?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_CONFIG[item.status]?.color}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.days_inactive_at_contact || '-'}</TableCell>
                    <TableCell>
                      {item.reactivated ? (
                        <Badge className="bg-green-500">Sim</Badge>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contato</DialogTitle>
            <DialogDescription>
              {selectedItem?.profiles?.full_name} - {selectedItem?.phone_number}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="font-medium">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado:</span>
                    <span>{new Date(selectedItem.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedItem.sent_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enviado:</span>
                      <span>{new Date(selectedItem.sent_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedItem.delivered_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entregue:</span>
                      <span>{new Date(selectedItem.delivered_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedItem.read_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lido:</span>
                      <span>{new Date(selectedItem.read_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedItem.response_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Respondeu:</span>
                      <span>{new Date(selectedItem.response_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedItem.reactivated_at && (
                    <div className="flex justify-between text-green-600">
                      <span>Reativou:</span>
                      <span>{new Date(selectedItem.reactivated_at).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Sent */}
              {selectedItem.message_sent && (
                <div className="space-y-2">
                  <h4 className="font-medium">Mensagem Enviada</h4>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {selectedItem.message_sent}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response */}
              {selectedItem.response_text && (
                <div className="space-y-2">
                  <h4 className="font-medium">Resposta do Cliente</h4>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {selectedItem.response_text}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedItem.error_message && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Erro</h4>
                  <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-600">{selectedItem.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registros selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {selectedIds.size} registro(s) do histórico.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSelected}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelectedItems}
              disabled={deletingSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSelected ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Excluindo...</>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
