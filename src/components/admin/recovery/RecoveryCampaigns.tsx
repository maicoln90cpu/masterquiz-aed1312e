import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Plus, Play, Pause, Square, Megaphone, Users, Send, CheckCircle, Trash2, ChevronDown, Filter, Pencil, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CampaignRecipientsPanel } from "./CampaignRecipientsPanel";

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
  target_criteria: unknown;
}

interface Template {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
}

interface TargetCriteria {
  no_leads: boolean;
  no_quizzes: boolean;
  plans: string[];
  stages: string[];
  objectives: string[];
  min_inactive_days: number | null;
  direct_campaign: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Geral',
  welcome: 'Boas-vindas',
  first_quiz: 'Primeiro Quiz',
  reengagement: 'Reengajamento',
  upgrade: 'Upgrade',
  educational: 'Educacional',
  feedback: 'Feedback',
  reminder: 'Lembrete',
  special_offer: 'Oferta Especial',
  final_contact: 'Contato Final',
  check_in: 'Check-in',
  activation_reminder: 'Ativação',
  first_contact: 'Primeiro Contato',
};

const STAGE_OPTIONS = [
  { value: 'explorador', label: 'Explorador' },
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'construtor', label: 'Construtor' },
  { value: 'operador', label: 'Operador' },
];

const OBJECTIVE_OPTIONS = [
  { value: 'educational', label: 'Educacional' },
  { value: 'lead_capture_launch', label: 'Captura de Leads' },
  { value: 'offer_validation', label: 'Validação de Oferta' },
  { value: 'paid_traffic', label: 'Tráfego Pago' },
  { value: 'vsl_conversion', label: 'Conversão VSL' },
];

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

const INACTIVITY_OPTIONS = [
  { value: 7, label: '7+ dias' },
  { value: 15, label: '15+ dias' },
  { value: 30, label: '30+ dias' },
  { value: 60, label: '60+ dias' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500' },
  scheduled: { label: 'Agendada', color: 'bg-blue-500' },
  running: { label: 'Em Execução', color: 'bg-green-500' },
  paused: { label: 'Pausada', color: 'bg-yellow-500' },
  completed: { label: 'Concluída', color: 'bg-purple-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
};

const defaultCriteria: TargetCriteria = {
  no_leads: false,
  no_quizzes: false,
  plans: [],
  stages: [],
  objectives: [],
  min_inactive_days: null,
  direct_campaign: false,
};

export function RecoveryCampaigns() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editFiltersOpen, setEditFiltersOpen] = useState(false);
  const [refreshingCampaign, setRefreshingCampaign] = useState<string | null>(null);
  const [cooldownEnabled, setCooldownEnabled] = useState(true);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [savingCooldown, setSavingCooldown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_id: '',
    scheduled_at: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    scheduled_at: '',
  });
  const [criteria, setCriteria] = useState<TargetCriteria>({ ...defaultCriteria });
  const [editCriteria, setEditCriteria] = useState<TargetCriteria>({ ...defaultCriteria });

  useEffect(() => {
    loadData();
    loadCooldownSettings();
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
          .select('id, name, category, is_active')
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      const rawCampaigns = campaignsRes.data || [];

      // Fetch dynamic counters for each campaign from recovery_contacts
      const campaignIds = rawCampaigns.map(c => c.id);
      if (campaignIds.length > 0) {
        const { data: contacts } = await supabase
          .from('recovery_contacts')
          .select('campaign_id, status')
          .in('campaign_id', campaignIds);

        if (contacts) {
          const counters: Record<string, Record<string, number>> = {};
          for (const c of contacts) {
            if (!c.campaign_id) continue;
            if (!counters[c.campaign_id]) counters[c.campaign_id] = {};
            counters[c.campaign_id][c.status] = (counters[c.campaign_id][c.status] || 0) + 1;
          }

          for (const campaign of rawCampaigns) {
            const c = counters[campaign.id] || {};
            const realSent = (c.sent || 0) + (c.delivered || 0) + (c.read || 0) + (c.responded || 0);
            const realFailed = c.failed || 0;
            const realQueued = (c.pending || 0) + (c.queued || 0);
            const realTotal = Object.values(c).reduce((a, b) => a + b, 0);

            campaign.sent_count = realSent;
            campaign.delivered_count = (c.delivered || 0) + (c.read || 0) + (c.responded || 0);
            campaign.responded_count = c.responded || 0;
            campaign.failed_count = realFailed;
            // Use DB values as fallback when real contacts are fewer (due to deduplication)
            campaign.queued_count = Math.max(realQueued, campaign.queued_count || 0);
            campaign.total_targets = Math.max(realTotal, campaign.total_targets || 0);
          }
        }
      }

      // Fetch global stats per template_id (all campaigns combined)
      const uniqueTemplateIds = [...new Set(rawCampaigns.map(c => c.template_id).filter(Boolean))] as string[];
      const templateGlobalStats: Record<string, Record<string, number>> = {};
      
      if (uniqueTemplateIds.length > 0) {
        const { data: globalContacts } = await supabase
          .from('recovery_contacts')
          .select('template_id, status')
          .in('template_id', uniqueTemplateIds);

        if (globalContacts) {
          for (const gc of globalContacts) {
            if (!gc.template_id) continue;
            if (!templateGlobalStats[gc.template_id]) templateGlobalStats[gc.template_id] = {};
            templateGlobalStats[gc.template_id][gc.status] = (templateGlobalStats[gc.template_id][gc.status] || 0) + 1;
          }
        }
      }

      // Attach global template stats to campaigns
      for (const campaign of rawCampaigns) {
        const gs = campaign.template_id ? templateGlobalStats[campaign.template_id] : null;
        if (gs) {
          (campaign as any).globalSent = (gs.sent || 0) + (gs.delivered || 0) + (gs.read || 0) + (gs.responded || 0);
          (campaign as any).globalDelivered = (gs.delivered || 0) + (gs.read || 0) + (gs.responded || 0);
          (campaign as any).globalTotal = Object.values(gs).reduce((a, b) => a + b, 0);
        }
      }

      setCampaigns(rawCampaigns);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const loadCooldownSettings = async () => {
    try {
      const { data } = await supabase
        .from('recovery_settings')
        .select('user_cooldown_days')
        .limit(1)
        .maybeSingle();
      if (data) {
        const days = data.user_cooldown_days ?? 7;
        setCooldownDays(days);
        setCooldownEnabled(days > 0);
      }
    } catch (error) {
      console.error('Error loading cooldown:', error);
    }
  };

  const saveCooldownSettings = async (enabled: boolean, days: number) => {
    setSavingCooldown(true);
    try {
      const { error } = await supabase
        .from('recovery_settings')
        .update({ 
          user_cooldown_days: enabled ? days : 0,
          updated_at: new Date().toISOString() 
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // update all rows
      if (error) throw error;
      toast.success(enabled ? `Cooldown definido para ${days} dias` : 'Cooldown desativado');
    } catch (error) {
      console.error('Error saving cooldown:', error);
      toast.error('Erro ao salvar cooldown');
    } finally {
      setSavingCooldown(false);
    }
  };

  const refreshCampaignTargets = async (campaign: Campaign) => {
    setRefreshingCampaign(campaign.id);
    try {
      const tc = (campaign.target_criteria || {}) as Record<string, unknown>;
      const { data, error } = await supabase.functions.invoke('check-inactive-users', {
        body: {
          campaignId: campaign.id,
          templateId: campaign.template_id,
          ignoreCooldown: true,
          directCampaign: !!tc.direct_campaign,
          targetCriteria: tc,
          isAutoRegeneration: true,
        }
      });
      if (error) throw error;
      const newCount = data?.queued || 0;
      toast.success(newCount > 0 
        ? `${newCount} novos alvos adicionados à campanha!` 
        : 'Nenhum novo alvo encontrado com os critérios atuais.');
      loadData();
    } catch (error) {
      console.error('Error refreshing campaign:', error);
      toast.error('Erro ao atualizar alvos');
    } finally {
      setRefreshingCampaign(null);
    }
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (criteria.no_leads) count++;
    if (criteria.no_quizzes) count++;
    count += criteria.plans.length;
    count += criteria.stages.length;
    count += criteria.objectives.length;
    if (criteria.min_inactive_days) count++;
    return count;
  };

  // Agrupar templates por categoria
  const templatesByCategory = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const handleCreate = async () => {
    if (!formData.name || !formData.template_id) {
      toast.error('Preencha nome e selecione um template');
      return;
    }

    const tc: Record<string, unknown> = {};
    if (criteria.no_leads) tc.no_leads = true;
    if (criteria.no_quizzes) tc.no_quizzes = true;
    if (criteria.plans.length > 0) tc.plans = criteria.plans;
    if (criteria.stages.length > 0) tc.stages = criteria.stages;
    if (criteria.objectives.length > 0) tc.objectives = criteria.objectives;
    if (criteria.min_inactive_days) tc.min_inactive_days = criteria.min_inactive_days;
    if (criteria.direct_campaign) tc.direct_campaign = true;
    const targetCriteriaJson = Object.keys(tc).length > 0 ? JSON.parse(JSON.stringify(tc)) : {};

    try {
      const { error } = await supabase
        .from('recovery_campaigns')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          template_id: formData.template_id,
          scheduled_at: formData.scheduled_at || null,
          status: (formData.scheduled_at ? 'scheduled' : 'draft') as 'scheduled' | 'draft',
          target_criteria: targetCriteriaJson,
        }]);

      if (error) throw error;

      toast.success('Campanha criada!');
      setDialogOpen(false);
      setFormData({ name: '', description: '', template_id: '', scheduled_at: '' });
      setCriteria({ ...defaultCriteria });
      setFiltersOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const updates: Record<string, unknown> = {
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
      const tc = (campaign.target_criteria || {}) as Record<string, unknown>;
      const isDirectCampaign = !!tc.direct_campaign;
      const hasExistingContacts = (campaign.queued_count || 0) > 0 || (campaign.sent_count || 0) > 0;
      const { data, error } = await supabase.functions.invoke('check-inactive-users', {
        body: { 
          campaignId: campaign.id,
          templateId: campaign.template_id,
          ignoreCooldown: isDirectCampaign || hasExistingContacts,
          directCampaign: isDirectCampaign,
          targetCriteria: tc,
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
      await supabase
        .from('recovery_contacts')
        .delete()
        .eq('campaign_id', campaignId);

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

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditFormData({
      name: campaign.name,
      description: campaign.description || '',
      scheduled_at: campaign.scheduled_at ? campaign.scheduled_at.slice(0, 16) : '',
    });
    const tc = (campaign.target_criteria || {}) as Record<string, unknown>;
    setEditCriteria({
      no_leads: !!tc.no_leads,
      no_quizzes: !!tc.no_quizzes,
      plans: Array.isArray(tc.plans) ? tc.plans : [],
      stages: Array.isArray(tc.stages) ? tc.stages : [],
      objectives: Array.isArray(tc.objectives) ? tc.objectives : [],
      min_inactive_days: typeof tc.min_inactive_days === 'number' ? tc.min_inactive_days : null,
      direct_campaign: !!tc.direct_campaign,
    });
    setEditFiltersOpen(false);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingCampaign || !editFormData.name) {
      toast.error('Preencha o nome da campanha');
      return;
    }

    const tc: Record<string, unknown> = {};
    if (editCriteria.no_leads) tc.no_leads = true;
    if (editCriteria.no_quizzes) tc.no_quizzes = true;
    if (editCriteria.plans.length > 0) tc.plans = editCriteria.plans;
    if (editCriteria.stages.length > 0) tc.stages = editCriteria.stages;
    if (editCriteria.objectives.length > 0) tc.objectives = editCriteria.objectives;
    if (editCriteria.min_inactive_days) tc.min_inactive_days = editCriteria.min_inactive_days;
    if (editCriteria.direct_campaign) tc.direct_campaign = true;

    try {
      const { error } = await supabase
        .from('recovery_campaigns')
        .update({
          name: editFormData.name,
          description: editFormData.description || null,
          scheduled_at: editFormData.scheduled_at || null,
          target_criteria: JSON.parse(JSON.stringify(tc)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCampaign.id);

      if (error) throw error;

      toast.success('Campanha atualizada!');
      setEditDialogOpen(false);
      setEditingCampaign(null);
      loadData();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Erro ao atualizar campanha');
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

  const activeFiltersCount = getActiveFiltersCount();

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
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setCriteria({ ...defaultCriteria });
            setFiltersOpen(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    {Object.entries(templatesByCategory).map(([category, tpls]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{CATEGORY_LABELS[category] || category}</SelectLabel>
                        {tpls.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                            {!template.is_active && ' (inativo)'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros de Audiência */}
              <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtros de Audiência
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  {/* Atividade */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Atividade</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={criteria.no_leads}
                          onCheckedChange={(checked) => setCriteria({ ...criteria, no_leads: !!checked })}
                        />
                        Sem leads (0 leads)
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={criteria.no_quizzes}
                          onCheckedChange={(checked) => setCriteria({ ...criteria, no_quizzes: !!checked })}
                        />
                        Sem quiz publicado
                      </label>
                    </div>
                  </div>

                  {/* Plano */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Plano</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLAN_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={criteria.plans.includes(opt.value)}
                            onCheckedChange={() => setCriteria({ ...criteria, plans: toggleArrayItem(criteria.plans, opt.value) })}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Estágio */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Estágio do Usuário</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {STAGE_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={criteria.stages.includes(opt.value)}
                            onCheckedChange={() => setCriteria({ ...criteria, stages: toggleArrayItem(criteria.stages, opt.value) })}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Objetivo */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Objetivo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {OBJECTIVE_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={criteria.objectives.includes(opt.value)}
                            onCheckedChange={() => setCriteria({ ...criteria, objectives: toggleArrayItem(criteria.objectives, opt.value) })}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Inatividade */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Dias de Inatividade</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {INACTIVITY_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={criteria.min_inactive_days === opt.value}
                            onCheckedChange={(checked) => setCriteria({ ...criteria, min_inactive_days: checked ? opt.value : null })}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Disparo Direto */}
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                  <Checkbox
                    checked={criteria.direct_campaign}
                    onCheckedChange={(checked) => setCriteria({ ...criteria, direct_campaign: !!checked })}
                  />
                  🚀 Campanha de disparo direto
                </label>
                <p className="text-xs text-muted-foreground pl-6">
                  Ignora cooldown global e permite reenviar mesmo template. Ideal para campanhas sazonais/promocionais.
                  Mantém: blacklist, horário e limite diário.
                </p>
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

      {/* Cooldown Global */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Cooldown Entre Contatos
          </CardTitle>
          <CardDescription className="text-xs">
            Intervalo mínimo entre contatos ao mesmo usuário. Quando desativado, o único controle é a UNIQUE constraint (1 template por usuário).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={cooldownEnabled}
                onCheckedChange={(checked) => {
                  setCooldownEnabled(checked);
                  saveCooldownSettings(checked, cooldownDays);
                }}
                disabled={savingCooldown}
              />
              <Label className="text-sm">{cooldownEnabled ? 'Ativo' : 'Desativado'}</Label>
            </div>
            {cooldownEnabled && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={cooldownDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 7;
                    setCooldownDays(val);
                  }}
                  onBlur={() => saveCooldownSettings(cooldownEnabled, cooldownDays)}
                  className="w-20 h-8"
                  disabled={savingCooldown}
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            )}
            {savingCooldown && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </CardContent>
      </Card>

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
                    {['running', 'paused'].includes(campaign.status) && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => refreshCampaignTargets(campaign)} 
                        disabled={refreshingCampaign === campaign.id}
                        title="Buscar novos alvos agora"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${refreshingCampaign === campaign.id ? 'animate-spin' : ''}`} /> 
                        {refreshingCampaign === campaign.id ? 'Buscando...' : 'Atualizar Alvos'}
                      </Button>
                    )}
                    {['running', 'paused', 'draft'].includes(campaign.status) && (
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(campaign)} title="Editar campanha">
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                    )}
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
                {/* Campaign Rules */}
                {campaign.target_criteria && Object.keys(campaign.target_criteria as Record<string, unknown>).length > 0 && (
                  <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Regras da Campanha</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(() => {
                        const tc = campaign.target_criteria as Record<string, unknown>;
                        const tags: string[] = [];
                        if (tc.direct_campaign) tags.push('🚀 Disparo Direto');
                        if (tc.no_leads) tags.push('Sem leads');
                        if (tc.no_quizzes) tags.push('Sem quiz');
                        if (Array.isArray(tc.plans) && tc.plans.length > 0) tags.push(`Planos: ${(tc.plans as string[]).join(', ')}`);
                        if (Array.isArray(tc.stages) && tc.stages.length > 0) tags.push(`Estágios: ${(tc.stages as string[]).join(', ')}`);
                        if (Array.isArray(tc.objectives) && tc.objectives.length > 0) tags.push(`Objetivos: ${(tc.objectives as string[]).join(', ')}`);
                        if (tc.min_inactive_days) tags.push(`${tc.min_inactive_days}+ dias inativos`);
                        return tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Template name */}
                {campaign.template_id && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    📝 Template: <span className="font-medium text-foreground">
                      {templates.find(t => t.id === campaign.template_id)?.name || 'N/A'}
                    </span>
                  </div>
                )}

                {campaign.total_targets > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{campaign.sent_count} / {campaign.total_targets}</span>
                    </div>
                    <Progress value={getProgress(campaign)} className="h-2" />
                  </div>
                )}

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
                    {(campaign as any).globalSent > campaign.sent_count && (
                      <p className="text-[10px] text-blue-500 mt-0.5">{(campaign as any).globalSent} total template</p>
                    )}
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-lg font-bold">{campaign.delivered_count}</p>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                    {(campaign as any).globalDelivered > campaign.delivered_count && (
                      <p className="text-[10px] text-green-500 mt-0.5">{(campaign as any).globalDelivered} total template</p>
                    )}
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

                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span>Criada: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}</span>
                  {campaign.started_at && (
                    <span>Iniciada: {new Date(campaign.started_at).toLocaleDateString('pt-BR')}</span>
                  )}
                  {campaign.completed_at && (
                    <span>Concluída: {new Date(campaign.completed_at).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>

                <CampaignRecipientsPanel
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  templateId={campaign.template_id}
                  status={campaign.status}
                  isAutomatic={campaign.is_automatic}
                  onChanged={loadData}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingCampaign(null);
          setEditFiltersOpen(false);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Altere os dados da campanha (template não pode ser alterado)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Campanha *</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Template (read-only) */}
            {editingCampaign?.template_id && (
              <div className="space-y-2">
                <Label>Template (não editável)</Label>
                <div className="p-2 rounded border bg-muted text-sm text-muted-foreground">
                  📝 {templates.find(t => t.id === editingCampaign.template_id)?.name || 'N/A'}
                </div>
              </div>
            )}

            {/* Audience Filters */}
            <Collapsible open={editFiltersOpen} onOpenChange={setEditFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" type="button">
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros de Audiência
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${editFiltersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Atividade</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={editCriteria.no_leads} onCheckedChange={(c) => setEditCriteria({ ...editCriteria, no_leads: !!c })} />
                      Sem leads (0 leads)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={editCriteria.no_quizzes} onCheckedChange={(c) => setEditCriteria({ ...editCriteria, no_quizzes: !!c })} />
                      Sem quiz publicado
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Plano</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAN_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={editCriteria.plans.includes(opt.value)} onCheckedChange={() => setEditCriteria({ ...editCriteria, plans: toggleArrayItem(editCriteria.plans, opt.value) })} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Estágio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGE_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={editCriteria.stages.includes(opt.value)} onCheckedChange={() => setEditCriteria({ ...editCriteria, stages: toggleArrayItem(editCriteria.stages, opt.value) })} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Objetivo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {OBJECTIVE_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={editCriteria.objectives.includes(opt.value)} onCheckedChange={() => setEditCriteria({ ...editCriteria, objectives: toggleArrayItem(editCriteria.objectives, opt.value) })} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Dias de Inatividade</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {INACTIVITY_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={editCriteria.min_inactive_days === opt.value} onCheckedChange={(c) => setEditCriteria({ ...editCriteria, min_inactive_days: c ? opt.value : null })} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <Label>Agendar Para (opcional)</Label>
              <Input
                type="datetime-local"
                value={editFormData.scheduled_at}
                onChange={(e) => setEditFormData({ ...editFormData, scheduled_at: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
