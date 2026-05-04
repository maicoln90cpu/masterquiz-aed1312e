import { logger } from '@/lib/logger';
import { useState, useEffect, lazy, Suspense } from "react";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, Calendar, Download, Plus, Settings, TrendingUp, Users, CheckCircle, ChevronLeft, ChevronRight, Trash2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useResourceLimits } from "@/hooks/useResourceLimits";
import { PlanLimitBlockedBanner } from "@/components/ui/PlanLimitBlockedBanner";
import { FirstLeadUpgradeBanner } from "@/components/FirstLeadUpgradeBanner";
import { CRMEmptyState } from '@/components/crm/CRMEmptyState';
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CRMSkeleton } from "@/components/ui/crm-skeleton";
import { CRMTour } from "@/components/onboarding/CRMTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTrackPageView } from "@/hooks/useUserStage";
import { useTestLead } from "@/hooks/useTestLead";
import { FlaskConical } from "lucide-react";
import { ResponseAnswersList } from "@/components/responses/ResponseAnswersList";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Lazy-load do Kanban Board (~40KB @dnd-kit/core)
const CRMKanbanBoard = lazy(() => import('@/components/crm/CRMKanbanBoard').then(m => ({ default: m.CRMKanbanBoard })));

type LeadStatus = 'new' | 'checkout' | 'negotiation' | 'converted' | 'relationship' | 'lost';

/** Detect if a lead has useful contact data (email, phone, name) either in fields or within answers */
const hasUsefulContactData = (lead: { respondent_email: string; respondent_whatsapp: string; respondent_name: string; answers: any; custom_field_data: any }): boolean => {
  // Explicit lead fields
  if (lead.respondent_email && lead.respondent_email.includes('@')) return true;
  if (lead.respondent_whatsapp && lead.respondent_whatsapp.replace(/\D/g, '').length >= 8) return true;
  // Check within answers for email/phone patterns
  const answersStr = JSON.stringify(lead.answers || {}) + JSON.stringify(lead.custom_field_data || {});
  if (/[\w.-]+@[\w.-]+\.\w{2,}/.test(answersStr)) return true;
  if (/\d{10,}/.test(answersStr)) return true;
  return false;
};

interface Lead {
  id: string;
  respondent_name: string;
  respondent_email: string;
  respondent_whatsapp: string;
  quiz_title: string;
  result_text: string;
  completed_at: string;
  status: LeadStatus;
  answers: any;
  custom_field_data: any;
  quiz_questions?: Array<{ id: string; question_text: string; order_number: number; blocks?: any[] }>;
}

const CRM = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { checkLeadLimit } = useSubscriptionLimits();
  const { limits } = useResourceLimits();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [blockedLeadsCount, setBlockedLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newLeadDialog, setNewLeadDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [filterQuiz, setFilterQuiz] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedLeadsForComparison, setSelectedLeadsForComparison] = useState<string[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [anonymousResponseCount, setAnonymousResponseCount] = useState(0);
  
  // Novo lead form
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    whatsapp: "",
    quizId: ""
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 100;

  const columns = [
    { id: 'new' as LeadStatus, title: t('crm.columns.new'), color: 'hsl(221, 83%, 53%)', bgColor: 'bg-primary/5', borderColor: 'border-primary/20' },
    { id: 'checkout' as LeadStatus, title: t('crm.columns.checkout'), color: 'hsl(45, 93%, 47%)', bgColor: 'bg-yellow-500/5', borderColor: 'border-yellow-500/20' },
    { id: 'negotiation' as LeadStatus, title: t('crm.columns.negotiation'), color: 'hsl(25, 95%, 53%)', bgColor: 'bg-orange-500/5', borderColor: 'border-orange-500/20' },
    { id: 'converted' as LeadStatus, title: t('crm.columns.converted'), color: 'hsl(142, 76%, 36%)', bgColor: 'bg-green-500/5', borderColor: 'border-green-500/20' },
    { id: 'relationship' as LeadStatus, title: t('crm.columns.relationship'), color: 'hsl(291, 64%, 42%)', bgColor: 'bg-accent/5', borderColor: 'border-accent/20' },
    { id: 'lost' as LeadStatus, title: t('crm.columns.lost'), color: 'hsl(0, 84%, 60%)', bgColor: 'bg-destructive/5', borderColor: 'border-destructive/20' },
  ];

  useEffect(() => {
    loadLeads();
  }, [filterQuiz, filterStatus, limits?.leads.limit, limits?.leads.isUnlimited]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Buscar quizzes do usuário
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('user_id', user.id);
      
      setQuizzes(quizzesData || []);

      // ✅ ITEM 3: QUERIES OTIMIZADAS - Buscar leads com paginação e campos específicos
      let query = supabase
        .from('quiz_responses')
        .select(`
          id,
          respondent_name,
          respondent_email,
          respondent_whatsapp,
          completed_at,
          lead_status,
          answers,
          custom_field_data,
          quizzes!inner(id, title, user_id, quiz_questions(id, question_text, order_number, blocks)),
          quiz_results(result_text)
        `)
        .eq('quizzes.user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(500);

      if (filterQuiz !== "all") {
        query = query.eq('quiz_id', filterQuiz);
      }

      const { data: responsesData } = await query;

      // Transformar respostas em leads usando o status do banco
      const leadsData = (responsesData || []).map(response => ({
        id: response.id,
        respondent_name: response.respondent_name || t('crm.noName'),
        respondent_email: response.respondent_email || "",
        respondent_whatsapp: response.respondent_whatsapp || "",
        quiz_title: response.quizzes?.title || t('crm.quiz'),
        result_text: Array.isArray(response.quiz_results) ? (response.quiz_results[0]?.result_text || "N/A") : (response.quiz_results?.result_text || "N/A"),
        completed_at: response.completed_at,
        status: (response.lead_status || 'new') as LeadStatus,
        answers: response.answers || {},
        custom_field_data: response.custom_field_data,
        quiz_questions: (response.quizzes?.quiz_questions || []) as any[],
      }));

      // 🔒 Bloqueio de visualização por limite de plano (banco continua salvando tudo)
      const planLeadLimit = limits?.leads.isUnlimited
        ? Infinity
        : (limits?.leads.limit ?? Infinity);
      const totalFetched = leadsData.length;
      const visibleLeads = planLeadLimit === Infinity
        ? leadsData
        : leadsData.slice(0, planLeadLimit);
      const blocked = Math.max(0, totalFetched - (planLeadLimit === Infinity ? totalFetched : planLeadLimit));

      setLeads(visibleLeads);
      setBlockedLeadsCount(blocked);

      // Count anonymous responses (apenas dentro do que está visível)
      const anonymousCount = visibleLeads.filter(l => !hasUsefulContactData(l)).length;
      setAnonymousResponseCount(anonymousCount);
    } catch (error) {
      logger.error('Error loading leads:', error);
      toast.error(t('crm.toast.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const moveLeadToStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase
      .from('quiz_responses')
      .update({ lead_status: newStatus })
      .eq('id', leadId);
    
    if (error) {
      logger.error('Error updating lead status:', error);
      toast.error(t('crm.toast.errorUpdating'));
      return;
    }

    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    // M10: trigger crm_interaction (mudança de status kanban)
    import('@/lib/icpTracking').then(({ incrementProfileCounter }) => {
      incrementProfileCounter('crm_interactions_count');
    });

    toast.success(t('crm.toast.leadUpdated'));
  };

  const deleteLead = async (leadId: string) => {
    const { error } = await supabase
      .from('quiz_responses')
      .delete()
      .eq('id', leadId);

    if (error) {
      logger.error('Error deleting lead:', error);
      toast.error(t('crm.toast.errorDeleting'));
      return;
    }

    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    setSelectedLead(null);
    toast.success(t('crm.toast.leadDeleted'));
  };

  // Filter: only show leads with useful contact data in the kanban
  const identifiedLeads = leads.filter(lead => hasUsefulContactData(lead));

  const statusFilteredLeads = filterStatus !== "all"
    ? identifiedLeads.filter(lead => lead.status === filterStatus)
    : identifiedLeads;

  // Busca em memória por nome ou email (não faz nova query)
  const filteredLeads = debouncedSearch.trim()
    ? statusFilteredLeads.filter(lead => {
        const q = debouncedSearch.trim().toLowerCase();
        return (
          lead.respondent_name?.toLowerCase().includes(q) ||
          lead.respondent_email?.toLowerCase().includes(q)
        );
      })
    : statusFilteredLeads;

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  );

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filterQuiz, filterStatus, debouncedSearch]);


  const getStats = () => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;
    
    return { total, newLeads, converted, conversionRate };
  };

  // ✅ ITEM 5: Lazy load XLSX export
  const exportToExcel = async () => {
    if (leads.length === 0) {
      toast.error(t('crm.toast.noLeadsToExport'));
      return;
    }

    try {
      // ✅ Importar XLSX dinamicamente apenas quando necessário
      const XLSX = await import('xlsx');
      
      const exportData = leads.map(lead => ({
        [t('crm.export.name')]: lead.respondent_name || "N/A",
        [t('crm.export.email')]: lead.respondent_email || "N/A",
        [t('crm.export.whatsapp')]: lead.respondent_whatsapp || "N/A",
        [t('crm.export.quiz')]: lead.quiz_title,
        [t('crm.export.result')]: lead.result_text,
        [t('crm.export.status')]: lead.status,
        [t('crm.export.date')]: new Date(lead.completed_at).toLocaleDateString('pt-BR'),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads");
      XLSX.writeFile(wb, `leads_crm_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // GTM: LeadExported
      pushGTMEvent('LeadExported', { source: 'crm', count: leads.length });

      // M10: trigger crm_interaction (exportação CSV/Excel)
      import('@/lib/icpTracking').then(({ incrementProfileCounter }) => {
        incrementProfileCounter('crm_interactions_count');
      });
      
      toast.success(t('crm.toast.exportSuccess', { count: leads.length }));
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      toast.error(t('crm.toast.exportError'));
    }
  };

  const createManualLead = async () => {
    if (!newLead.name || !newLead.quizId) {
      toast.error(t('crm.toast.fillNameAndQuiz'));
      return;
    }

    // 🔒 Exigir pelo menos email OU whatsapp para que o lead seja localizável
    const hasEmail = !!newLead.email?.trim();
    const hasWhatsapp = !!newLead.whatsapp?.trim();
    if (!hasEmail && !hasWhatsapp) {
      toast.error(t('crm.toast.contactRequired', 'Informe email ou WhatsApp para criar o lead'));
      return;
    }

    // Verificar limite de leads
    const canAddLead = await checkLeadLimit();
    if (!canAddLead) {
      toast.error(t('crm.leadLimitReached'));
      return;
    }

    try {
      // Validate lead data
      const { leadSchema } = await import('@/lib/validations');
      const validationResult = leadSchema.safeParse({
        respondent_name: newLead.name,
        respondent_email: newLead.email || '',
        respondent_whatsapp: newLead.whatsapp || '',
        lead_status: 'new'
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.issues[0].message;
        toast.error(errorMessage);
        return;
      }

      const { error } = await supabase
        .from('quiz_responses')
        .insert({
          quiz_id: newLead.quizId,
          respondent_name: newLead.name,
          respondent_email: newLead.email || null,
          respondent_whatsapp: newLead.whatsapp || null,
          lead_status: 'new',
          answers: {},
        });

      if (error) throw error;

      toast.success(t('crm.toast.leadCreated'));
      setNewLeadDialog(false);
      setNewLead({ name: "", email: "", whatsapp: "", quizId: "" });
      loadLeads();
    } catch (error) {
      logger.error('Error creating lead:', error);
      toast.error(t('crm.toast.errorCreating'));
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(t('crm.whatsappMessage', { name }));
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const openEmail = (email: string, name: string) => {
    const subject = encodeURIComponent(t('crm.emailSubject'));
    const body = encodeURIComponent(t('crm.emailBody', { name }));
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadsForComparison(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else if (prev.length < 5) {
        return [...prev, leadId];
      } else {
        toast.error(t('crm.toast.maxLeadsCompare'));
        return prev;
      }
    });
  };

  const getSelectedLeads = () => {
    return leads.filter(l => selectedLeadsForComparison.includes(l.id));
  };


  const stats = getStats();
  const { status: onboardingStatus } = useOnboarding();

  // Track CRM view for PQL stage upgrade
  useTrackPageView('crm');

  return (
    <DashboardLayout>
      {!onboardingStatus.crm_tour_completed && <CRMTour />}
      <FirstLeadUpgradeBanner />
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          {/* Mobile: 2 linhas */}
          <div className="md:hidden space-y-2 mb-4">
            {/* Linha 1: Menu + Título */}
            <div className="flex items-center gap-2">
              <MobileNav />
              <h1 className="text-lg font-bold">{t('crm.title')}</h1>
            </div>
            
            {/* Linha 2: Ações */}
            <div className="flex items-center justify-end gap-2">
              <LanguageSwitch />
              <Button variant="default" size="sm" onClick={exportToExcel} disabled={leads.length === 0} className="btn-touch" aria-label={t('crm.header.export')}>
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Desktop: linha única */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="p-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span>{t('common.back')}</span>
                </Button>
              </div>
              <h1 className="text-2xl font-bold">{t('crm.title')}</h1>
              <div className="flex items-center gap-2">
                <LanguageSwitch />
              </div>
            </div>
            {/* Desktop: todos os botões */}
            <div id="crm-export" className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setConfigDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {t('crm.header.configure')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setNewLeadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('crm.header.newLead')}
              </Button>
              {selectedLeadsForComparison.length >= 2 && (
                <Button 
                  variant="default"
                  size="sm"
                  onClick={() => setCompareDialogOpen(true)}
                >
                  {t('crm.compare')} {selectedLeadsForComparison.length}
                </Button>
              )}
              <Button variant="default" size="sm" onClick={exportToExcel} disabled={leads.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                {t('crm.header.export')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div id="crm-stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('crm.totalLeads')}</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('crm.newLeads')}</CardDescription>
              <CardTitle className="text-3xl">{stats.newLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-8 w-8 text-primary opacity-20" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('crm.converted')}</CardDescription>
              <CardTitle className="text-3xl">{stats.converted}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="h-8 w-8 text-accent opacity-20" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('crm.conversionRate')}</CardDescription>
              <CardTitle className="text-3xl">{stats.conversionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-8 w-8 text-accent opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div id="crm-filters" className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('crm.searchPlaceholder')}
              className="pl-9"
              aria-label={t('crm.searchPlaceholder')}
            />
          </div>

          <Select value={filterQuiz} onValueChange={setFilterQuiz}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t('crm.filterByQuiz')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('crm.allQuizzes')}</SelectItem>
              {quizzes.map(quiz => (
                <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t('crm.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('crm.allStatus')}</SelectItem>
              {columns.map(col => (
                <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔒 Bloqueio por limite de plano */}
        <PlanLimitBlockedBanner
          blockedCount={blockedLeadsCount}
          labelKey="leads"
          area="crm"
          className="mb-4"
        />

        {/* Banner informativo: respostas anônimas */}
        {anonymousResponseCount > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-border bg-muted/50 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>{anonymousResponseCount}</strong> {anonymousResponseCount === 1 ? 'resposta anônima' : 'respostas anônimas'} (sem dados de contato). 
              O CRM exibe apenas leads com e-mail, telefone ou informação identificável. 
              Para capturar mais leads, adicione um formulário de coleta ao seu quiz.
            </p>
          </div>
        )}

        {loading ? (
          <CRMSkeleton />
        ) : leads.length === 0 ? (
          <CRMEmptyState quizzes={quizzes} />
        ) : (
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CRMKanbanBoard
              leads={paginatedLeads}
              columns={columns}
              onLeadClick={(lead) => {
                setSelectedLead(lead);
                // M10: trigger crm_interaction (clique em lead — abertura de detalhes)
                import('@/lib/icpTracking').then(({ incrementProfileCounter }) => {
                  incrementProfileCounter('crm_interactions_count');
                });
              }}
              onMoveLeadToStatus={moveLeadToStatus}
              selectedLeadsForComparison={selectedLeadsForComparison}
              onToggleLeadSelection={toggleLeadSelection}
            />
          </Suspense>
        )}

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-sm text-muted-foreground">
              {t('common.showingOf', { 
                start: (currentPage - 1) * leadsPerPage + 1, 
                end: Math.min(currentPage * leadsPerPage, filteredLeads.length),
                total: filteredLeads.length 
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent id="crm-lead-details" className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('crm.detailsDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('crm.detailsDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{selectedLead.respondent_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedLead.quiz_title}</p>
                </div>
                <Badge className={columns.find(c => c.id === selectedLead.status)?.color}>
                  {columns.find(c => c.id === selectedLead.status)?.title}
                </Badge>
              </div>

              <div className="flex gap-2">
                {selectedLead.respondent_email && (
                  <Button size="sm" variant="outline" onClick={() => openEmail(selectedLead.respondent_email, selectedLead.respondent_name)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                {selectedLead.respondent_whatsapp && (
                  <Button size="sm" variant="outline" onClick={() => openWhatsApp(selectedLead.respondent_whatsapp, selectedLead.respondent_name)}>
                    <Phone className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{selectedLead.respondent_email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium text-sm">{selectedLead.respondent_whatsapp || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('crm.detailsDialog.completionDate')}
                  </p>
                  <p className="font-medium text-sm">
                    {new Date(selectedLead.completed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('crm.detailsDialog.resultObtained')}</p>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm">{selectedLead.result_text}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Respostas do quiz */}
              {selectedLead.answers && Object.keys(selectedLead.answers).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('crm.detailsDialog.answers', 'Respostas do Quiz')}</p>
                  <Card>
                    <CardContent className="pt-4">
                      <ResponseAnswersList 
                        answers={selectedLead.answers} 
                        questions={selectedLead.quiz_questions}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('crm.detailsDialog.moveTo')}</p>
                <div className="flex flex-wrap gap-2">
                  {columns.filter(c => c.id !== selectedLead.status).map(column => (
                    <Button
                      key={column.id}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        moveLeadToStatus(selectedLead.id, column.id);
                        setSelectedLead({ ...selectedLead, status: column.id });
                      }}
                    >
                      {column.title}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('crm.deleteLead')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('crm.deleteLeadConfirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('crm.deleteLeadDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteLead(selectedLead.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Lead */}
      <Dialog open={newLeadDialog} onOpenChange={setNewLeadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('crm.newLeadDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('crm.newLeadDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('crm.newLeadDialog.name')} *</Label>
              <Input
                id="name"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder={t('crm.newLeadDialog.namePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('crm.newLeadDialog.email')}</Label>
              <Input
                id="email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder={t('crm.newLeadDialog.emailPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">{t('crm.newLeadDialog.whatsapp')}</Label>
              <Input
                id="whatsapp"
                value={newLead.whatsapp}
                onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                placeholder={t('crm.newLeadDialog.whatsappPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="quiz">{t('crm.newLeadDialog.quiz')} *</Label>
              <Select value={newLead.quizId} onValueChange={(val) => setNewLead({ ...newLead, quizId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('crm.newLeadDialog.selectQuiz')} />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewLeadDialog(false)}>
                {t('crm.newLeadDialog.cancel')}
              </Button>
              <Button onClick={createManualLead}>
                {t('crm.newLeadDialog.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Configurações */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('crm.configDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('crm.configDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('crm.configDialog.comingSoon')}
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">{t('crm.configDialog.currentColumns')}</h4>
              {columns.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: col.color }}></div>
                  <span className="text-sm">{col.title}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => setConfigDialog(false)} className="w-full">
              {t('crm.configDialog.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Comparação de Leads */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('crm.compareDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('crm.compareDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-semibold sticky left-0 bg-background">
                    {t('crm.compareDialog.field')}
                  </th>
                  {getSelectedLeads().map((lead) => (
                    <th key={lead.id} className="p-3 text-left font-semibold min-w-[200px]">
                      {lead.respondent_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">Email</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3 text-sm">{lead.respondent_email || '-'}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">WhatsApp</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3 text-sm">{lead.respondent_whatsapp || '-'}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">{t('crm.compareDialog.quiz')}</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3 text-sm">{lead.quiz_title}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">{t('crm.compareDialog.status')}</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3">
                      <Badge style={{ backgroundColor: columns.find(c => c.id === lead.status)?.color }}>
                        {columns.find(c => c.id === lead.status)?.title}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">{t('crm.compareDialog.result')}</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3 text-sm">{lead.result_text}</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium sticky left-0 bg-background">{t('crm.compareDialog.date')}</td>
                  {getSelectedLeads().map((lead) => (
                    <td key={lead.id} className="p-3 text-sm">
                      {new Date(lead.completed_at).toLocaleDateString('pt-BR')}
                    </td>
                  ))}
                </tr>
                
                {/* Respostas do Quiz */}
                {Object.keys(getSelectedLeads()[0]?.answers || {}).length > 0 && (
                  <>
                    <tr className="bg-muted/30">
                      <td colSpan={getSelectedLeads().length + 1} className="p-3 font-semibold">
                        {t('crm.compareDialog.quizAnswers')}
                      </td>
                    </tr>
                    {Object.entries(getSelectedLeads()[0]?.answers || {}).map(([questionKey, _], idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium sticky left-0 bg-background">
                          {t('crm.compareDialog.question', { number: idx + 1 })}
                        </td>
                        {getSelectedLeads().map((lead) => {
                          const answer = (lead.answers || {})[questionKey];
                          const answerDisplay = Array.isArray(answer) ? answer.join(', ') : answer;
                          const firstAnswers = getSelectedLeads()[0]?.answers || {};
                          const isSameAsFirst = answerDisplay === (Array.isArray(firstAnswers[questionKey]) 
                            ? firstAnswers[questionKey].join(', ') 
                            : firstAnswers[questionKey]);
                          
                          return (
                            <td 
                              key={lead.id} 
                              className={`p-3 text-sm ${isSameAsFirst && getSelectedLeads().length > 1 ? 'bg-green-50 dark:bg-green-950' : ''}`}
                            >
                              {answerDisplay || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t('crm.compareDialog.highlightInfo')}
            </p>
            <Button variant="outline" onClick={() => {
              setCompareDialogOpen(false);
              setSelectedLeadsForComparison([]);
            }}>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CRM;
