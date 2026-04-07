import { useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, CheckCircle, HelpCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Definições de tooltips para cada feature
const FEATURE_TOOLTIPS: Record<string, string> = {
  allow_facebook_pixel: "Permite que usuários configurem o Facebook Pixel em seus quizzes para rastreamento de conversões e remarketing.",
  allow_gtm: "Permite integração com Google Tag Manager para gerenciamento avançado de tags e analytics.",
  allow_export_pdf: "Permite exportar relatórios de respostas e leads em formato PDF.",
  allow_webhook: "Permite configurar webhooks para enviar dados de leads para sistemas externos (CRMs, automações).",
  allow_quiz_sharing: "Permite compartilhar quizzes com outros usuários ou duplicar quizzes existentes.",
  allow_white_label: "Remove a marca MasterQuiz dos quizzes públicos, permitindo marca própria.",
  allow_custom_domain: "Permite usar domínio próprio para os quizzes (ex: quiz.seusite.com).",
  allow_video_upload: "Permite fazer upload de vídeos para usar em perguntas e resultados.",
  allow_ai_generation: "Permite gerar quizzes automaticamente usando inteligência artificial.",
  allow_heatmap: "Visualização de heatmap mostrando quais respostas são mais escolhidas em cada pergunta.",
  allow_ab_testing: "Permite criar variantes do quiz para testar diferentes versões e otimizar conversões.",
  allow_quiz_branching: "Permite criar perguntas condicionais que aparecem baseado em respostas anteriores.",
  allow_advanced_analytics: "Acesso a métricas avançadas como funil de conversão, tempo médio e análise por período.",
};

type PlanType = "free" | "paid" | "partner" | "premium";

interface Plan {
  id: string;
  plan_name: string;
  plan_type: PlanType;
  price_monthly: number;
  price_monthly_mode_b?: number | null;
  quiz_limit: number;
  response_limit: number;
  lead_limit: number;
  features: any;
  is_active: boolean;
  is_popular?: boolean;
  display_order: number;
  allow_facebook_pixel: boolean;
  allow_gtm: boolean;
  allow_export_pdf: boolean;
  allow_webhook: boolean;
  allow_quiz_sharing: boolean;
  allow_white_label: boolean;
  allow_custom_domain: boolean;
  allow_video_upload?: boolean;
  video_storage_limit_mb?: number;
  allow_ai_generation?: boolean;
  ai_generations_per_month?: number;
  allowed_templates: string[];
  kiwify_checkout_url?: string;
  kiwify_checkout_url_mode_b?: string | null;
  // Analytics Avançado
  allow_heatmap?: boolean;
  allow_ab_testing?: boolean;
  allow_quiz_branching?: boolean;
  allow_advanced_analytics?: boolean;
}

// ✅ Memoized PlanCard component para evitar re-renders desnecessários
const PlanCard = memo(({ plan, onEdit, onDelete }: { 
  plan: Plan; 
  onEdit: (plan: Plan) => void; 
  onDelete: (id: string) => void;
}) => (
  <Card key={plan.id}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
          
          {/* Limites principais */}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">💰</span>
              <span className="font-medium">R$ {plan.price_monthly}/mês</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">📝</span>
              <span>{plan.quiz_limit === -1 ? '∞' : plan.quiz_limit} quizzes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">📊</span>
              <span>{plan.response_limit === -1 ? '∞' : plan.response_limit.toLocaleString('pt-BR')} respostas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">👥</span>
              <span>{plan.lead_limit === -1 ? '∞' : plan.lead_limit.toLocaleString('pt-BR')} leads</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">❓</span>
              <span>{(plan as any).questions_per_quiz_limit || 10} perguntas/quiz</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">🎨</span>
              <span>{plan.allowed_templates?.length || 0} templates</span>
            </div>
            {plan.allow_video_upload && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">💾</span>
                <span>{plan.video_storage_limit_mb || 0} MB mídia</span>
              </div>
            )}
            {plan.allow_ai_generation && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">🤖</span>
                <span>{plan.ai_generations_per_month || 0} gerações IA/mês</span>
              </div>
            )}
          </div>

          {/* Features (lista) */}
          {Array.isArray(plan.features) && plan.features.length > 0 && (
            <div className="mt-2 space-y-1">
              {plan.features.map((feature: string, idx: number) => (
                <p key={idx} className="text-xs text-muted-foreground">✓ {feature}</p>
              ))}
            </div>
          )}
          
          {/* Badges de recursos */}
          <div className="mt-3 flex gap-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded ${plan.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>
              {plan.is_active ? '✅ Ativo' : '⏸️ Inativo'}
            </span>
            {plan.is_popular && (
              <span className="text-xs px-2 py-0.5 rounded bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 dark:from-yellow-900 dark:to-orange-900 dark:text-orange-100 font-bold">
                ⭐ Popular
              </span>
            )}
            {plan.allow_ai_generation && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                🤖 IA
              </span>
            )}
            {plan.allow_custom_domain && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">
                🌐 Custom Domain
              </span>
            )}
            {plan.allow_export_pdf && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                📄 PDF
              </span>
            )}
            {plan.allow_webhook && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                🔗 Webhook
              </span>
            )}
            {plan.allow_quiz_sharing && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                🔄 Compartilhar
              </span>
            )}
            {plan.allow_facebook_pixel && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                📊 Pixel
              </span>
            )}
            {plan.allow_gtm && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                🏷️ GTM
              </span>
            )}
            {plan.allow_white_label && (
              <span className="text-xs px-2 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100">
                ✨ White Label
              </span>
            )}
            {plan.allow_video_upload && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                🎥 Vídeo
              </span>
            )}
            {plan.allow_heatmap && (
              <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                📊 Heatmap
              </span>
            )}
            {plan.allow_ab_testing && (
              <span className="text-xs px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100">
                🔬 A/B Test
              </span>
            )}
            {plan.allow_quiz_branching && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                🔀 Branching
              </span>
            )}
            {plan.allow_advanced_analytics && (
              <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100">
                📈 Analytics+
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button size="sm" variant="outline" onClick={() => onEdit(plan)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(plan.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
));

PlanCard.displayName = 'PlanCard';

export default function PlanManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<{
    plan_name: string;
    plan_type: PlanType;
    price_monthly: number;
    price_monthly_mode_b: number | null;
    quiz_limit: number;
    response_limit: number;
    lead_limit: number;
    questions_per_quiz_limit: number;
    features: string;
    is_active: boolean;
    is_popular: boolean;
    display_order: number;
    allow_facebook_pixel: boolean;
    allow_gtm: boolean;
    allow_export_pdf: boolean;
    allow_webhook: boolean;
    allow_quiz_sharing: boolean;
    allow_white_label: boolean;
    allow_custom_domain: boolean;
    allow_video_upload: boolean;
    video_storage_limit_mb: number;
    allow_ai_generation: boolean;
    ai_generations_per_month: number;
    allowed_templates: string[];
    kiwify_checkout_url: string;
    kiwify_checkout_url_mode_b: string;
    // Analytics Avançado
    allow_heatmap: boolean;
    allow_ab_testing: boolean;
    allow_quiz_branching: boolean;
    allow_advanced_analytics: boolean;
  }>({
    plan_name: "",
    plan_type: "free" as PlanType,
    price_monthly: 0,
    price_monthly_mode_b: null,
    quiz_limit: 3,
    response_limit: 100,
    lead_limit: 1000,
    questions_per_quiz_limit: 10,
    features: "",
    is_active: true,
    is_popular: false,
    display_order: 0,
    allow_facebook_pixel: false,
    allow_gtm: false,
    allow_export_pdf: false,
    allow_webhook: false,
    allow_quiz_sharing: false,
    allow_white_label: false,
    allow_custom_domain: false,
    allow_video_upload: false,
    video_storage_limit_mb: 0,
    allow_ai_generation: false,
    ai_generations_per_month: 0,
    allowed_templates: ["moderno"],
    kiwify_checkout_url: "",
    kiwify_checkout_url_mode_b: "",
    // Analytics Avançado
    allow_heatmap: false,
    allow_ab_testing: false,
    allow_quiz_branching: false,
    allow_advanced_analytics: false,
  });

  // ✅ Cache com React Query (5 minutos)
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      
      return (data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        plan_type: plan.plan_type as PlanType
      })) || []) as Plan[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: pelo menos 1 plano ativo deve existir
    if (editingPlan && editingPlan.is_active && !formData.is_active) {
      const otherActivePlans = plans.filter(p => p.is_active && p.id !== editingPlan.id);
      if (otherActivePlans.length === 0) {
        toast.error("Não é possível desativar. Pelo menos 1 plano ativo deve existir!");
        return;
      }
    }
    
    // 🎯 Mapear plan_type baseado no nome do plano
    let actualPlanType: 'free' | 'paid' | 'partner' | 'premium' = formData.plan_type;
    
    if (formData.plan_type !== 'free') {
      const nameLower = formData.plan_name.toLowerCase();
      
      if (nameLower.includes('partner')) {
        actualPlanType = 'partner';
      } else if (nameLower.includes('premium')) {
        actualPlanType = 'premium';
      } else {
        actualPlanType = 'paid'; // Fallback genérico para plano Pro
      }
    }
    
    const planData = {
      ...formData,
      plan_type: actualPlanType as any, // Salva o tipo específico
      features: formData.features.split("\n").filter((f) => f.trim()),
      allowed_templates: formData.allowed_templates,
    };

    try {
      if (editingPlan) {
        console.log('📤 Atualizando plano:', editingPlan.id, planData);
        
        const { data, error } = await supabase
          .from("subscription_plans")
          .update(planData)
          .eq("id", editingPlan.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao atualizar plano:', error);
          toast.error(`Erro ao atualizar: ${error.message}`);
          return;
        }
        
        console.log('✅ Plano atualizado com sucesso:', data);
        toast.success("Plano atualizado!");
      } else {
        const { data, error } = await supabase
          .from("subscription_plans")
          .insert(planData)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro ao criar plano:', error);
          toast.error(`Erro ao criar: ${error.message}`);
          return;
        }
        
        console.log('✅ Plano criado com sucesso:', data);
        toast.success("Plano criado!");
      }
      
      setIsDialogOpen(false);
      resetForm();
      
      // ✅ Invalidar e refetch para forçar reload imediato
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      await queryClient.refetchQueries({ queryKey: ['subscription-plans'] });
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error("Erro ao salvar plano");
    }
  };

  const handleDelete = async (id: string) => {
    // Validação: pelo menos 1 plano ativo deve existir
    const activePlans = plans.filter(p => p.is_active && p.id !== id);
    if (activePlans.length === 0) {
      toast.error("Não é possível excluir. Pelo menos 1 plano ativo deve existir!");
      return;
    }

    if (!confirm("Deseja excluir este plano?")) return;
    
    await supabase.from("subscription_plans").delete().eq("id", id);
    toast.success("Plano excluído!");
    
    // ✅ Invalidar cache
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
  };

  const handleInvalidateCache = async () => {
    try {
      // Invalidar TODOS os caches relacionados a planos
      await queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      await queryClient.invalidateQueries({ queryKey: ['landing-plans'] });
      
      toast.success('✅ Cache invalidado! Atualizando página...', {
        duration: 2000,
      });
      
      // Aguardar para usuário ver o toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
      toast.error('❌ Erro ao invalidar cache. Tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      plan_type: "free",
      price_monthly: 0,
      quiz_limit: 3,
      response_limit: 100,
      lead_limit: 1000,
      questions_per_quiz_limit: 10,
      features: "",
      is_active: true,
      is_popular: false,
      display_order: 0,
      allow_facebook_pixel: false,
      allow_gtm: false,
      allow_export_pdf: false,
      allow_webhook: false,
      allow_quiz_sharing: false,
      allow_white_label: false,
      allow_custom_domain: false,
      allow_video_upload: false,
      video_storage_limit_mb: 0,
      allow_ai_generation: false,
      ai_generations_per_month: 0,
      allowed_templates: ["moderno"],
      kiwify_checkout_url: "",
      // Analytics Avançado
      allow_heatmap: false,
      allow_ab_testing: false,
      allow_quiz_branching: false,
      allow_advanced_analytics: false,
    });
    setEditingPlan(null);
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    const featuresArray = Array.isArray(plan.features) ? plan.features : [];
    
    // 🎯 Converter plan_type específico para "paid" ou "free" na UI
    const displayPlanType = plan.plan_type === 'free' ? 'free' : 'paid';
    
    setFormData({
      plan_name: plan.plan_name,
      plan_type: displayPlanType as PlanType,
      price_monthly: plan.price_monthly,
      quiz_limit: plan.quiz_limit,
      response_limit: plan.response_limit,
      lead_limit: plan.lead_limit || 1000,
      questions_per_quiz_limit: (plan as any).questions_per_quiz_limit || 10,
      features: featuresArray.join("\n"),
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      display_order: plan.display_order,
      allow_facebook_pixel: plan.allow_facebook_pixel || false,
      allow_gtm: plan.allow_gtm || false,
      allow_export_pdf: plan.allow_export_pdf || false,
      allow_webhook: plan.allow_webhook || false,
      allow_quiz_sharing: plan.allow_quiz_sharing || false,
      allow_white_label: plan.allow_white_label || false,
      allow_custom_domain: plan.allow_custom_domain || false,
      allow_video_upload: (plan as any).allow_video_upload || false,
      video_storage_limit_mb: (plan as any).video_storage_limit_mb || 0,
      allow_ai_generation: (plan as any).allow_ai_generation || false,
      ai_generations_per_month: (plan as any).ai_generations_per_month || 0,
      allowed_templates: plan.allowed_templates || ['moderno'],
      kiwify_checkout_url: (plan as any).kiwify_checkout_url || "",
      // Analytics Avançado
      allow_heatmap: plan.allow_heatmap || false,
      allow_ab_testing: plan.allow_ab_testing || false,
      allow_quiz_branching: plan.allow_quiz_branching || false,
      allow_advanced_analytics: plan.allow_advanced_analytics || false,
    });
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Planos</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInvalidateCache}>
            Atualizar Landing Page
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan 
                    ? "Edite as configurações e limites do plano de assinatura" 
                    : "Configure as informações e limites para criar um novo plano"}
                </DialogDescription>
              </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.plan_type}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      plan_type: value as PlanType,
                      price_monthly: value === 'free' ? 0 : formData.price_monthly
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {formData.plan_type === 'paid' && (
                  <>
                    <div className="space-y-2">
                      <Label>Preço/Mês (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_monthly}
                        onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-3">
                      <Label>URL de Checkout Kiwify</Label>
                      <Input
                        value={formData.kiwify_checkout_url}
                        onChange={(e) => setFormData({ ...formData, kiwify_checkout_url: e.target.value })}
                        placeholder="https://pay.kiwify.com.br/xxxxx"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Cole aqui a URL de checkout da Kiwify para este plano
                      </p>
                    </div>
                  </>
                )}
                
                {formData.plan_type === 'free' && (
                  <div className="space-y-2 col-span-3">
                    <p className="text-sm text-muted-foreground">Planos gratuitos não possuem preço</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite de Quizzes</Label>
                  <Input
                    type="number"
                    value={formData.quiz_limit}
                    onChange={(e) => setFormData({ ...formData, quiz_limit: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
              <Label>Limite de Respostas</Label>
              <Input
                type="number"
                value={formData.response_limit}
                onChange={(e) => setFormData({ ...formData, response_limit: parseInt(e.target.value) })}
                required
              />
            </div>

              <div className="space-y-2">
              <Label>Limite de Leads</Label>
              <Input
                type="number"
                value={formData.lead_limit}
                onChange={(e) => setFormData({ ...formData, lead_limit: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use -1 para ilimitado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Perguntas por Quiz</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.questions_per_quiz_limit}
                onChange={(e) => setFormData({ ...formData, questions_per_quiz_limit: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Limite de perguntas permitido em cada quiz
              </p>
            </div>
              </div>

              <div className="space-y-2">
                <Label>Features (uma por linha)</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={6}
                  placeholder="3 quizzes ativos&#10;100 respostas/mês&#10;Templates básicos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Plano Ativo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label htmlFor="is_popular">Marcar como Mais Popular</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4">Controle de Recursos</h3>
                
                <TooltipProvider>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_facebook_pixel}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_facebook_pixel: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Facebook Pixel
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_facebook_pixel}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_gtm}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_gtm: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Google Tag Manager
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_gtm}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_export_pdf}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_export_pdf: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Exportar Relatórios em PDF
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_export_pdf}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_webhook}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_webhook: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Webhook Personalizado
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_webhook}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_quiz_sharing}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_quiz_sharing: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Compartilhamento de Quiz
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_quiz_sharing}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_white_label}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_white_label: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir White Label (Remover Branding)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_white_label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_custom_domain}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_custom_domain: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir URL Personalizada (Domínio Próprio)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_custom_domain}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_video_upload}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_video_upload: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        Permitir Upload de Vídeos
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_video_upload}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-storage">Limite de Storage de Vídeo (MB)</Label>
                      <Input
                        id="video-storage"
                        type="number"
                        min={0}
                        placeholder="Ex: 1024 (1GB)"
                        value={formData.video_storage_limit_mb}
                        onChange={(e) => 
                          setFormData({ ...formData, video_storage_limit_mb: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Sugestões: Free=0MB, Pro=1024MB (1GB), Premium=10240MB (10GB)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t">
                      <Switch
                        checked={formData.allow_ai_generation}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_ai_generation: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        🤖 Permitir Geração de Quiz por IA
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_ai_generation}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-generations">Gerações de IA por Mês (0 = ilimitado)</Label>
                      <Input
                        id="ai-generations"
                        type="number"
                        min={0}
                        placeholder="Ex: 10"
                        value={formData.ai_generations_per_month}
                        onChange={(e) => 
                          setFormData({ ...formData, ai_generations_per_month: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>

                    {/* Modelo e Prompt agora são configurados globalmente na aba "IA Settings" */}
                    
                    <div className="space-y-2">
                      <Label>Templates Permitidos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['moderno', 'colorido', 'profissional', 'criativo', 'elegante', 'vibrante', 'minimalista', 'escuro'].map((template) => (
                          <div key={template} className="flex items-center space-x-2">
                            <Checkbox
                              checked={formData.allowed_templates.includes(template)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({ 
                                    ...formData, 
                                    allowed_templates: [...formData.allowed_templates, template] 
                                  });
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    allowed_templates: formData.allowed_templates.filter(t => t !== template) 
                                  });
                                }
                              }}
                            />
                            <Label className="capitalize cursor-pointer">{template}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* Seção Analytics Avançado */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  📈 Analytics Avançado (Partner+)
                </h3>
                
                <TooltipProvider>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_heatmap}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_heatmap: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        📊 Permitir Heatmap de Respostas
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_heatmap}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_ab_testing}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_ab_testing: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        🔬 Permitir Testes A/B
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_ab_testing}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_quiz_branching}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_quiz_branching: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        🔀 Permitir Perguntas Condicionais (Branching)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_quiz_branching}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allow_advanced_analytics}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_advanced_analytics: checked })
                        }
                      />
                      <Label className="flex items-center gap-1.5">
                        📈 Permitir Analytics Avançado
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{FEATURE_TOOLTIPS.allow_advanced_analytics}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold">Preview do Card</span>
                </div>
                <Card className={formData.is_active ? "border-primary" : "opacity-60"}>
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-xl">{formData.plan_name || "Nome do Plano"}</CardTitle>
                    <div className="mt-3">
                      <span className="text-3xl font-bold">
                        {formData.price_monthly === 0 ? 'GRÁTIS' : `R$ ${formData.price_monthly.toFixed(2)}`}
                      </span>
                      {formData.price_monthly > 0 && (
                        <span className="text-muted-foreground text-sm">/mês</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {formData.features.split("\n").filter(f => f.trim()).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? "Atualizar" : "Criar"} Plano
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onEdit={openEditDialog} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
