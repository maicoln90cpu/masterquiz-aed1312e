import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Ban, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/system/DataTable";

interface BlacklistItem {
  id: string;
  user_id: string | null;
  phone_number: string;
  reason: string;
  notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

const REASONS = [
  { value: 'opt_out', label: 'Optou por não receber' },
  { value: 'invalid_number', label: 'Número inválido' },
  { value: 'blocked', label: 'Bloqueou o número' },
  { value: 'spam_report', label: 'Reportou como spam' },
  { value: 'request', label: 'Solicitação do usuário' },
  { value: 'other', label: 'Outro' },
];

export function RecoveryBlacklist() {
  const [loading, setLoading] = useState(true);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    phone_number: '',
    reason: 'opt_out',
    notes: '',
  });

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names separately if needed
      const itemsWithProfiles: BlacklistItem[] = (data || []).map(item => ({
        ...item,
        profiles: undefined
      }));
      setBlacklist(itemsWithProfiles);
    } catch (error) {
      console.error('Error loading blacklist:', error);
      toast.error('Erro ao carregar blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.phone_number) {
      toast.error('Informe o número de telefone');
      return;
    }

    // Validar formato do telefone
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phone_number.replace(/\D/g, ''))) {
      toast.error('Formato de telefone inválido');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('recovery_blacklist')
        .insert({
          phone_number: formData.phone_number,
          reason: formData.reason,
          notes: formData.notes || null,
          added_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este número já está na blacklist');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Número adicionado à blacklist');
      setDialogOpen(false);
      setFormData({ phone_number: '', reason: 'opt_out', notes: '' });
      loadBlacklist();
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      toast.error('Erro ao adicionar à blacklist');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este número da blacklist?')) return;

    try {
      const { error } = await supabase
        .from('recovery_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Número removido da blacklist');
      loadBlacklist();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error('Erro ao remover da blacklist');
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Blacklist de Números
          </h3>
          <p className="text-sm text-muted-foreground">
            Números que não devem receber mensagens de recuperação
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Número
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Blacklist</DialogTitle>
              <DialogDescription>
                Este número não receberá mais mensagens de recuperação
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+5511999999999"
                />
                <p className="text-xs text-muted-foreground">
                  Formato internacional com código do país
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdd}>
                Adicionar à Blacklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning */}
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                Atenção: A blacklist é permanente
              </p>
              <p className="text-sm text-muted-foreground">
                Números na blacklist nunca receberão mensagens de recuperação, mesmo em novas campanhas.
                Remova o número se o cliente solicitar receber comunicações novamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Números Bloqueados</CardTitle>
          <CardDescription>
            {blacklist.length} números na blacklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={blacklist}
            rowKey={(r) => r.id}
            defaultSortKey="created_at"
            defaultSortDirection="desc"
            searchPlaceholder="Buscar por número ou nome…"
            emptyMessage="Nenhum número na blacklist"
            exportCsv="blacklist"
            columns={[
              { key: 'phone_number', label: 'Telefone', sortable: true, searchable: true, className: 'font-mono' },
              {
                key: 'full_name',
                label: 'Usuário Associado',
                searchable: true,
                accessor: (r) => r.profiles?.full_name || '',
                render: (r) => r.profiles?.full_name || <span className="text-muted-foreground">-</span>,
              },
              {
                key: 'reason',
                label: 'Motivo',
                sortable: true,
                filterable: true,
                accessor: (r) => REASONS.find(x => x.value === r.reason)?.label || r.reason,
                render: (r) => (
                  <Badge variant="outline">
                    {REASONS.find(x => x.value === r.reason)?.label || r.reason}
                  </Badge>
                ),
              },
              {
                key: 'notes',
                label: 'Observações',
                render: (r) => <span className="max-w-[200px] truncate inline-block" title={r.notes || ''}>{r.notes || '-'}</span>,
              },
              { key: 'created_at', label: 'Data', sortable: true, format: 'date' },
            ]}
            actions={(r) => (
              <Button variant="ghost" size="icon" onClick={() => handleRemove(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
