import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Play, Pause, Square, Megaphone, Users, Send, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  status: string;
  is_automatic: boolean;
  total_targets: number;
  queued_count: number;
  sent_count: number;
  delivered_count: number;
  responded_count: number;
  reactivated_count: number;
  failed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500' },
  scheduled: { label: 'Agendada', color: 'bg-blue-500' },
  running: { label: 'Em Execução', color: 'bg-green-500' },
  paused: { label: 'Pausada', color: 'bg-yellow-500' },
  completed: { label: 'Concluída', color: 'bg-purple-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
};

export function RecoveryCampaigns() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    scheduled_at: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, templatesRes] = await Promise.all([
        supabase
          .from('recovery_campaigns')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('recovery_templates')
          .select('id, name')
          .eq('is_active', true)
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setCampaigns(campaignsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.template_id) {
      toast.error('Preencha nome e selecione um template');
      return;
    }

    try {
      const { error } = await supabase
        .from('recovery_campaigns')
        .insert({
          name: formData.name,
          description: formData.description || null,
          template_id: formData.template_id,
          scheduled_at: formData.scheduled_at || null,
          status: formData.scheduled_at ? 'scheduled' : 'draft',
        });

      if (error) throw error;

      toast.success('Campanha criada!');
      setDialogOpen(false);
      setFormData({ name: '', description: '', template_id: '', scheduled_at: '' });
      loadData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'running') {
        updates.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('recovery_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success(`Status atualizado para: ${STATUS_LABELS[newStatus]?.label}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const startCampaign = async (campaign: Campaign) => {
    try {
      // Buscar usuários inativos, passando o campaignId e templateId
      const { data, error } = await supabase.functions.invoke('check-inactive-users', {
        body: { 
          campaignId: campaign.id,
          templateId: campaign.template_id, // Passar template específico da campanha
          ignoreCooldown: false // Pode ser alterado para true em campanhas manuais se necessário
        }
      });

      if (error) throw error;

      const queuedCount = data?.queued || data?.targetCount || 0;
      const eligibleCount = data?.total_eligible || 0;

      if (queuedCount === 0) {
        toast.warning(
          eligibleCount > 0 
            ? `Nenhum usuário adicionado. ${eligibleCount} usuários elegíveis, mas já foram contatados recentemente (cooldown).`
            : 'Nenhum usuário inativo encontrado com os critérios atuais.',
          { duration: 5000 }
        );
      } else {
        toast.success(`Campanha iniciada! ${queuedCount} usuários na fila.`);
      }
      
      loadData();
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Erro ao iniciar campanha');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      // Primeiro, remover contatos vinculados à campanha
      await supabase
        .from('recovery_contacts')
        .delete()
        .eq('campaign_id', campaignId);

      // Depois, deletar a campanha
      const { error } = await supabase
        .from('recovery_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campanha excluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const getProgress = (campaign: Campaign) => {
    if (campaign.total_targets === 0) return 0;
    return Math.round((campaign.sent_count / campaign.total_targets) * 100);
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
          <h3 className="text-lg font-semibold">Campanhas de Recuperação</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie campanhas para reengajar clientes inativos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure uma campanha de recuperação de clientes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Recuperação Janeiro 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo da campanha..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template de Mensagem *</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(value) => setFormData({ ...formData, template_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled">Agendar Para (opcional)</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma campanha criada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira campanha para começar a recuperar clientes
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {campaign.name}
                      <Badge className={STATUS_LABELS[campaign.status]?.color}>
                        {STATUS_LABELS[campaign.status]?.label}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {campaign.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => startCampaign(campaign)}>
                        <Play className="h-4 w-4 mr-1" /> Iniciar
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(campaign.id, 'paused')}>
                        <Pause className="h-4 w-4 mr-1" /> Pausar
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(campaign.id, 'running')}>
                          <Play className="h-4 w-4 mr-1" /> Retomar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(campaign.id, 'cancelled')}>
                          <Square className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      </>
                    )}
                    {/* Botão de Deletar - disponível para draft, completed e cancelled */}
                    {['draft', 'completed', 'cancelled'].includes(campaign.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a campanha "{campaign.name}"?
                              Esta ação é irreversível e também excluirá todos os contatos vinculados a ela.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCampaign(campaign.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress */}
                {campaign.total_targets > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{campaign.sent_count} / {campaign.total_targets}</span>
                    </div>
                    <Progress value={getProgress(campaign)} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center p-2 bg-muted rounded">
                    <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{campaign.total_targets}</p>
                    <p className="text-xs text-muted-foreground">Alvos</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Send className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">{campaign.sent_count}</p>
                    <p className="text-xs text-muted-foreground">Enviadas</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{campaign.delivered_count}</p>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Megaphone className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-lg font-bold">{campaign.responded_count}</p>
                    <p className="text-xs text-muted-foreground">Responderam</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Users className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                    <p className="text-lg font-bold">{campaign.reactivated_count}</p>
                    <p className="text-xs text-muted-foreground">Reativados</p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Users className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <p className="text-lg font-bold">{campaign.failed_count}</p>
                    <p className="text-xs text-muted-foreground">Falhas</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span>Criada: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}</span>
                  {campaign.started_at && (
                    <span>Iniciada: {new Date(campaign.started_at).toLocaleDateString('pt-BR')}</span>
                  )}
                  {campaign.completed_at && (
                    <span>Concluída: {new Date(campaign.completed_at).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
