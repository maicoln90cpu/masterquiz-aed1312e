import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Users, FileText, MessageSquare, CheckCircle, XCircle, DollarSign, TrendingUp, BarChart3, Settings, ArrowLeft, Trash2, Shield, Sparkles, LayoutDashboard, Package, Palette, Cog, Activity, Globe, FlaskConical, Search, ChevronLeft, ChevronRight, RefreshCw, Pencil, Download, BookOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useQueryPerformance } from "@/hooks/useQueryPerformance";
import { motion } from "framer-motion";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useTranslation } from "react-i18next";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";
import { SystemHealthAlert } from "@/components/admin/SystemHealthAlert";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

// Lazy load heavy admin components
const PlanManagement = lazy(() => import("@/components/admin/PlanManagement"));
const PerformanceMetrics = lazy(() => import("@/components/admin/PerformanceMetrics").then(m => ({ default: m.PerformanceMetrics })));
const AuditLogsViewer = lazy(() => import("@/components/admin/AuditLogsViewer").then(m => ({ default: m.AuditLogsViewer })));
const TrackingConfiguration = lazy(() => import("@/components/admin/TrackingConfiguration").then(m => ({ default: m.TrackingConfiguration })));
const CSPViolationsPanel = lazy(() => import("@/components/admin/CSPViolationsPanel").then(m => ({ default: m.CSPViolationsPanel })));
const AISettings = lazy(() => import("@/components/admin/AISettings").then(m => ({ default: m.AISettings })));
const SupportTicketsManager = lazy(() => import("@/components/admin/SupportTicketsManager").then(m => ({ default: m.SupportTicketsManager })));
const TemplateManagement = lazy(() => import("@/components/admin/TemplateManagement"));
const PaymentGatewaySettings = lazy(() => import("@/components/admin/PaymentGatewaySettings"));
const BunnyStorageSettings = lazy(() => import("@/components/admin/BunnyStorageSettings").then(m => ({ default: m.BunnyStorageSettings })));
const BundleSizeMonitor = lazy(() => import("@/components/admin/BundleSizeMonitor").then(m => ({ default: m.BundleSizeMonitor })));
const SystemHealthDashboard = lazy(() => import("@/components/admin/SystemHealthDashboard").then(m => ({ default: m.SystemHealthDashboard })));
const HealthReport = lazy(() => import("@/components/admin/HealthReport").then(m => ({ default: m.HealthReport })));
const LandingContentEditor = lazy(() => import("@/components/admin/LandingContentEditor").then(m => ({ default: m.LandingContentEditor })));
const LandingABTestDashboard = lazy(() => import("@/components/admin/LandingABTestDashboard").then(m => ({ default: m.LandingABTestDashboard })));
const CustomerRecovery = lazy(() => import("@/components/admin/recovery").then(m => ({ default: m.CustomerRecovery })));
const PQLAnalytics = lazy(() => import("@/components/admin/PQLAnalytics").then(m => ({ default: m.PQLAnalytics })));
const BlogManager = lazy(() => import("@/components/admin/blog/BlogManager"));
const GTMEventsDashboard = lazy(() => import("@/components/admin/GTMEventsDashboard"));

// Loading fallback for lazy components
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const { measureQuery, getSlowestQueries, getMetrics } = useQueryPerformance();
  const [loading, setLoading] = useState(true);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalResponses: 0,
    activeUsers: 0
  });
  const [validationRequests, setValidationRequests] = useState<any[]>([]);
  const [administrators, setAdministrators] = useState<any[]>([]);
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [usersCurrentPage, setUsersCurrentPage] = useState<number>(1);
  const [respondentsCurrentPage, setRespondentsCurrentPage] = useState<number>(1);
  const USERS_PER_PAGE = 20;
  const RESPONDENTS_PER_PAGE = 50;
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState({
    activeUsers: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    annualRevenue: 0
  });
  const [chartData, setChartData] = useState<any>({
    usersByMonth: [],
    planDistribution: [],
    monthlyRevenue: []
  });
  const [settings, setSettings] = useState({
    site_name: '',
    support_email: '',
    maintenance_mode: false,
    maintenance_message: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, email: string} | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{id: string, email: string, whatsapp: string} | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ✅ Componente de Skeleton para carregamento
  const UserCardSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-3">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const filteredAdministrators = useMemo(() => {
    let result = administrators;
    
    // Filtro por plano
    if (planFilter !== 'all') {
      result = result.filter((user: any) => 
        user.subscription?.plan_type === planFilter
      );
    }
    
    // Filtro por pesquisa (nome ou email)
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      result = result.filter((user: any) => 
        user.profile?.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [administrators, planFilter, userSearchQuery]);

  // Paginação de usuários
  const paginatedAdministrators = useMemo(() => {
    const startIndex = (usersCurrentPage - 1) * USERS_PER_PAGE;
    return filteredAdministrators.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredAdministrators, usersCurrentPage]);

  const totalUsersPages = Math.ceil(filteredAdministrators.length / USERS_PER_PAGE);

  // Paginação de respondentes
  const paginatedRespondents = useMemo(() => {
    const startIndex = (respondentsCurrentPage - 1) * RESPONDENTS_PER_PAGE;
    return allUsers.slice(startIndex, startIndex + RESPONDENTS_PER_PAGE);
  }, [allUsers, respondentsCurrentPage]);

  const totalRespondentsPages = Math.ceil(allUsers.length / RESPONDENTS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setUsersCurrentPage(1);
  }, [planFilter, userSearchQuery]);

  // ✅ Use TanStack Query for better caching and performance
  const { data: allUsersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const result = await supabase.functions.invoke('list-all-users');
      if (result.error) throw result.error;
      return result.data?.users || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Update administrators when query data changes
  useEffect(() => {
    if (allUsersData) {
      setAdministrators(allUsersData);
    }
  }, [allUsersData]);

  // Load open tickets count + realtime
  useEffect(() => {
    const loadOpenTickets = async () => {
      const { count } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('has_unread_admin', true as any);
      setOpenTicketsCount(count || 0);
    };
    loadOpenTickets();

    const channel = supabase
      .channel('open-tickets-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        loadOpenTickets();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      // Run count queries in parallel for better performance
      const [usersCountResult, quizzesCountResult, responsesCountResult, requestsResult, respondentsResult] = await Promise.all([
        measureQuery('user-subscriptions-count', async () => {
          const result = await supabase
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true });
          return result;
        }),
        measureQuery('quizzes-count', async () => {
          const result = await supabase
            .from('quizzes')
            .select('*', { count: 'exact', head: true });
          return result;
        }),
        measureQuery('quiz-responses-count', async () => {
          const result = await supabase
            .from('quiz_responses')
            .select('*', { count: 'exact', head: true });
          return result;
        }),
        measureQuery('validation-requests', async () => {
          try {
            const result = await supabase
              .from('validation_requests')
              .select(`*, quizzes!inner(title)`)
              .eq('status', 'pending')
              .order('requested_at', { ascending: false });
            return result;
          } catch (e) {
            console.warn('validation_requests query failed (expected for non-admin):', e);
            return { data: [], error: null, count: null };
          }
        }),
        measureQuery('quiz-respondents', async () => {
          const result = await supabase.functions.invoke('list-all-respondents');
          if (result.error) return { data: [], error: result.error };
          return { data: result.data?.respondents || [], error: null };
        })
      ]);

      setStats({
        totalUsers: usersCountResult.count || 0,
        totalQuizzes: quizzesCountResult.count || 0,
        totalResponses: responsesCountResult.count || 0,
        activeUsers: 0
      });

      setValidationRequests(requestsResult.data || []);

      // Edge function already returns aggregated respondents
      setAllUsers(respondentsResult.data || []);
      await loadFinancialData();
      await loadSettings();
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const loadFinancialData = async () => {
    try {
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status, created_at')
        .eq('status', 'active');

      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('plan_type, price_monthly');

      const planPrices: Record<string, number> = {};
      plans?.forEach(plan => {
        planPrices[plan.plan_type] = parseFloat(String(plan.price_monthly || '0'));
      });

      // Excluir planos free e admin dos cálculos de usuários ativos e receita
      const activeUsers = subscriptions?.filter(s => s.plan_type !== 'free' && s.plan_type !== 'admin').length || 0;
      const totalUsers = subscriptions?.filter(s => s.plan_type !== 'admin').length || 0;
      const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      let monthlyRevenue = 0;
      subscriptions?.forEach(sub => {
        // Admin não conta para receita (é plano interno de teste)
        if (sub.plan_type !== 'free' && sub.plan_type !== 'admin') {
          monthlyRevenue += planPrices[sub.plan_type] || 0;
        }
      });

      setFinancialData({
        activeUsers,
        conversionRate: Math.round(conversionRate * 10) / 10,
        monthlyRevenue,
        annualRevenue: monthlyRevenue * 12
      });

      const planCounts: Record<string, number> = {};
      subscriptions?.forEach(sub => {
        planCounts[sub.plan_type] = (planCounts[sub.plan_type] || 0) + 1;
      });

      const planDistribution = Object.entries(planCounts).map(([name, value]) => ({
        name,
        value
      }));

      const monthlyData: Record<string, number> = {};
      subscriptions?.forEach(sub => {
        const month = new Date(sub.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const usersByMonth = Object.entries(monthlyData).map(([month, users]) => ({
        month,
        users
      })).slice(-6);

      const revenuePlans = Object.entries(planCounts)
        .filter(([plan]) => plan !== 'free' && plan !== 'admin')
        .map(([plan, count]) => ({
          plan,
          revenue: (planPrices[plan] || 0) * count
        }));

      setChartData({
        usersByMonth,
        planDistribution,
        monthlyRevenue: revenuePlans
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      const settingsObj: any = {};
      data?.forEach(setting => {
        if (setting.setting_key === 'maintenance_mode') {
          settingsObj[setting.setting_key] = setting.setting_value === 'true';
        } else {
          settingsObj[setting.setting_key] = setting.setting_value;
        }
      });

      setSettings({
        site_name: settingsObj.site_name || '',
        support_email: settingsObj.support_email || '',
        maintenance_mode: settingsObj.maintenance_mode || false,
        maintenance_message: settingsObj.maintenance_message || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const updates = [
        { setting_key: 'site_name', setting_value: settings.site_name },
        { setting_key: 'support_email', setting_value: settings.support_email },
        { setting_key: 'maintenance_mode', setting_value: settings.maintenance_mode.toString() },
        { setting_key: 'maintenance_message', setting_value: settings.maintenance_message }
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'setting_key' });
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleValidation = async (requestId: string, approve: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: request } = await supabase
        .from('validation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) return;

      await supabase
        .from('validation_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', requestId);

      if (approve) {
        await supabase
          .from('user_subscriptions')
          .update({
            plan_type: 'partner',
            status: 'active',
            quiz_limit: 999,
            response_limit: 999999,
            validated_at: new Date().toISOString(),
            validated_by: user.id
          })
          .eq('user_id', request.user_id);

        await supabase
          .from('user_roles')
          .insert({
            user_id: request.user_id,
            role: 'admin',
            created_by: user.id
          });
      }

      toast.success(approve ? 'Validação aprovada!' : 'Validação rejeitada');
      loadData();
    } catch (error) {
      console.error('Error handling validation:', error);
      toast.error('Erro ao processar validação');
    }
  };

  const updatePlan = async (userId: string, newPlan: 'free' | 'paid' | 'partner' | 'premium') => { 
    try {
      const { data: planDataArray, error: planError } = await supabase
        .from('subscription_plans')
        .select('quiz_limit, response_limit')
        .eq('plan_type', newPlan)
        .eq('is_active', true)
        .order('quiz_limit', { ascending: false })
        .limit(1);

      if (planError) {
        console.error('Error fetching plan limits:', planError);
        toast.error('Erro ao buscar limites do plano');
        return;
      }

      if (!planDataArray || planDataArray.length === 0) {
        toast.error('Plano não encontrado no sistema');
        return;
      }

      const planData = planDataArray[0];

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          plan_type: newPlan,
          quiz_limit: planData.quiz_limit,
          response_limit: planData.response_limit
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast.success(`Plano atualizado! Limites: ${planData.quiz_limit} quizzes, ${planData.response_limit} respostas`);
      await loadData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const confirmDeleteUser = (userId: string, email: string) => {
    setUserToDelete({ id: userId, email });
    setDeleteDialogOpen(true);
  };

  const openEditUser = (user: any) => {
    setEditingUser({ id: user.id, email: user.email || '', whatsapp: user.profile?.whatsapp || '' });
    setEditEmail(user.email || '');
    setEditWhatsapp(user.profile?.whatsapp || '');
    setEditDialogOpen(true);
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    try {
      const { error } = await supabase.functions.invoke('update-user-profile', {
        body: { user_id: editingUser.id, email: editEmail, whatsapp: editWhatsapp }
      });
      if (error) throw error;
      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      refetchUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Erro ao atualizar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.id }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao chamar função de exclusão');
      }

      if (data?.error) {
        console.error('Delete user error:', data);
        throw new Error(data.error);
      }

      const method = data?.method || 'api';
      const methodLabel = method === 'sql' ? ' (via SQL - dados corrompidos)' : '';

      toast.success(`Usuário ${userToDelete.email} excluído com sucesso!${methodLabel}`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      refetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMsg = error.message || 'Erro desconhecido ao excluir usuário';
      toast.error(`Erro ao excluir usuário: ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  // ========== RENDER CONTENT SECTIONS ==========
  
  const renderOverviewContent = () => (
    <>
      <Suspense fallback={<ComponentLoader />}>
        <PerformanceMetrics 
          slowestQueries={getSlowestQueries(5)}
          totalQueries={getMetrics().length}
        />
      </Suspense>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.quizzesCreated')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalResponses')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.pendingValidations')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationRequests.length}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderReportsContent = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Com plano pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Free → Pagante</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {financialData.monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Receita recorrente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {financialData.annualRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">MRR × 12</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.registeredUsers')}</CardTitle>
            <CardDescription>{t('admin.last6Months')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.planDistribution')}</CardTitle>
            <CardDescription>{t('admin.activeSubscriptions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {chartData.planDistribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('admin.monthlyRevenueByPlan')}</CardTitle>
            <CardDescription>{t('admin.revenueDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const exportMissingAccountCreatedCSV = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('account_created_event_sent', false as any)
        .not('email', 'is', null);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info('Todos os usuários já tiveram o evento disparado!');
        return;
      }

      // Gera client_id sintético a partir do UUID (GA4 exige formato XXXXXXXXXX.YYYYYYYYYY)
      const uuidToClientId = (uuid: string): string => {
        const clean = uuid.replace(/-/g, '');
        const half = Math.floor(clean.length / 2);
        const part1 = clean.slice(0, half);
        const part2 = clean.slice(half);
        const hash = (s: string) => {
          let h = 0;
          for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h + s.charCodeAt(i)) | 0;
          }
          return Math.abs(h);
        };
        const p1 = String(hash(part1)).padStart(10, '0').slice(0, 10);
        const p2 = String(hash(part2)).padStart(10, '0').slice(0, 10);
        return `${p1}.${p2}`;
      };

      const MEASUREMENT_ID = 'G-H8NWKZ5NZJ';
      const header = 'measurement_id,client_id,user_id,event_name,timestamp_micros';
      const rows = data.map((row: any) => {
        const clientId = uuidToClientId(row.id);
        const timestampMicros = new Date(row.created_at).getTime() * 1000;
        return `${MEASUREMENT_ID},${clientId},${row.id},AccountCreated,${timestampMicros}`;
      });

      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ga4_account_created_import_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`CSV GA4 exportado com ${data.length} eventos!`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Erro ao exportar CSV');
    }
  };

  const markAllAccountCreatedAsSent = async () => {
    try {
      const { error, count } = await supabase
        .from('profiles')
        .update({ account_created_event_sent: true } as any)
        .eq('account_created_event_sent', false as any)
        .not('email', 'is', null);

      if (error) throw error;
      toast.success(`${count ?? 'Todos os'} usuários marcados como enviados!`);
    } catch (err) {
      console.error('Mark sent error:', err);
      toast.error('Erro ao marcar usuários');
    }
  };

  const renderAdministratorsContent = () => (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle>{t('admin.allUsers')}</CardTitle>
            <CardDescription>{t('admin.allUsersDesc')} - {filteredAdministrators.length} usuários</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Plan Filter */}
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allPlans')}</SelectItem>
                <SelectItem value="free">{t('admin.free')}</SelectItem>
                <SelectItem value="paid">{t('admin.pro')}</SelectItem>
                <SelectItem value="partner">{t('admin.partner')}</SelectItem>
                <SelectItem value="premium">{t('admin.premium')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMissingAccountCreatedCSV}
              title="Exportar eventos AccountCreated para importação no GA4"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV Ads
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAccountCreatedAsSent}
              title="Marcar todos como enviados (usar APÓS importar CSV no Google Ads)"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Marcar enviados
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAdministrators.length === 0 ? (
          <p className="text-muted-foreground">{userSearchQuery ? 'Nenhum usuário encontrado para esta pesquisa' : t('admin.noUsersFiltered')}</p>
        ) : (
          <>
            {/* Desktop: Tabela condensada */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="text-center">Logins</TableHead>
                    <TableHead className="text-center">Quizzes</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAdministrators.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.profile?.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.profile?.whatsapp || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at 
                          ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{user.profile?.login_count || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{user.stats?.quiz_count || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{user.stats?.lead_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.subscription?.plan_type || 'free'}
                          onValueChange={(value) => updatePlan(user.id, value as 'free' | 'paid' | 'partner' | 'premium')}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">{t('admin.free')}</SelectItem>
                            <SelectItem value="paid">{t('admin.pro')}</SelectItem>
                            <SelectItem value="partner">{t('admin.partner')}</SelectItem>
                            <SelectItem value="premium">{t('admin.premium')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditUser(user)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => confirmDeleteUser(user.id, user.email)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet: Cards compactos */}
            <div className="lg:hidden space-y-3">
              {paginatedAdministrators.map((user: any, index: number) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.profile?.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span><FileText className="h-3 w-3 inline mr-1" />{user.stats?.quiz_count || 0}</span>
                          <span><Users className="h-3 w-3 inline mr-1" />{user.stats?.lead_count || 0}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {user.roles?.slice(0, 2).map((role: string) => (
                            <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Select 
                          value={user.subscription?.plan_type || 'free'}
                          onValueChange={(value) => updatePlan(user.id, value as 'free' | 'paid' | 'partner' | 'premium')}
                        >
                          <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">{t('admin.free')}</SelectItem>
                            <SelectItem value="paid">{t('admin.pro')}</SelectItem>
                            <SelectItem value="partner">{t('admin.partner')}</SelectItem>
                            <SelectItem value="premium">{t('admin.premium')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => confirmDeleteUser(user.id, user.email)}
                          className="h-7 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalUsersPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {usersCurrentPage} de {totalUsersPages} ({filteredAdministrators.length} usuários)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersCurrentPage(p => Math.max(1, p - 1))}
                    disabled={usersCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUsersCurrentPage(p => Math.min(totalUsersPages, p + 1))}
                    disabled={usersCurrentPage === totalUsersPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderRespondentsContent = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usuários (Respondentes de Quiz)</CardTitle>
          <span className="text-sm text-muted-foreground">{allUsers.length} respondentes</span>
        </div>
      </CardHeader>
      <CardContent>
        {allUsers.length === 0 ? (
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Respostas</TableHead>
                    <TableHead>Última Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRespondents.map((user, idx) => (
                    <TableRow key={idx} className={user.isTestLead ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {user.name || '-'}
                          {user.isTestLead && (
                            <Badge variant="outline" className="text-xs gap-1 shrink-0">
                              <FlaskConical className="h-3 w-3" />
                              Teste
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.whatsapp || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{user.lastQuizTitle || '-'}</TableCell>
                      <TableCell>{user.responseCount}</TableCell>
                      <TableCell>
                        {new Date(user.lastResponse).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedRespondents.map((user, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeOut" }}
                >
                  <Card className={`p-4 ${user.isTestLead ? 'opacity-60 border-dashed' : ''}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium flex items-center gap-1.5">
                            {user.name || '-'}
                            {user.isTestLead && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <FlaskConical className="h-3 w-3" />
                                Teste
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email || '-'}</p>
                        </div>
                        <Badge variant="secondary">{user.responseCount}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>WhatsApp: {user.whatsapp || '-'}</p>
                        <p>Quiz: {user.lastQuizTitle || '-'}</p>
                        <p>Última resposta: {new Date(user.lastResponse).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalRespondentsPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {respondentsCurrentPage} de {totalRespondentsPages} ({allUsers.length} respondentes)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRespondentsCurrentPage(p => Math.max(1, p - 1))}
                    disabled={respondentsCurrentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRespondentsCurrentPage(p => Math.min(totalRespondentsPages, p + 1))}
                    disabled={respondentsCurrentPage === totalRespondentsPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderValidationsContent = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.pendingValidationsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {validationRequests.length === 0 ? (
          <p className="text-muted-foreground">{t('admin.noValidationRequests')}</p>
        ) : (
          <div className="space-y-4">
            {validationRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{(request.quizzes as any)?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('admin.url')} {request.validation_url}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('admin.requestedAt')} {new Date(request.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleValidation(request.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('admin.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleValidation(request.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSettingsContent = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('admin.systemSettings')}
        </CardTitle>
        <CardDescription>
          {t('admin.systemSettingsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="site_name">{t('admin.siteName')}</Label>
          <Input
            id="site_name"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            placeholder={t('admin.siteNamePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support_email">{t('admin.supportEmail')}</Label>
          <Input
            id="support_email"
            type="email"
            value={settings.support_email}
            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
            placeholder={t('admin.supportEmailPlaceholder')}
          />
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance_mode">Modo de Manutenção</Label>
              <p className="text-sm text-muted-foreground">
                Ativar para bloquear acesso ao sistema
              </p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
            />
          </div>

          {settings.maintenance_mode && (
            <div className="space-y-2">
              <Label htmlFor="maintenance_message">Mensagem de Manutenção</Label>
              <Textarea
                id="maintenance_message"
                value={settings.maintenance_message}
                onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                placeholder="Digite a mensagem que será exibida aos usuários..."
                rows={4}
              />
            </div>
          )}
        </div>

        <Button onClick={saveSettings} className="w-full">
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileNav />
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logo} alt="MasterQuizz" className="h-8 w-8 rounded-md object-contain" />
                <span className="font-bold text-lg hidden md:inline">MasterQuizz</span>
              </Link>
              <span className="text-muted-foreground hidden md:inline">|</span>
              <h1 className="text-lg md:text-xl font-semibold">Admin Master</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitch />
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          {/* 6 ABAS PRINCIPAIS */}
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="commercial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Comercial</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 relative">
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
              {openTicketsCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {openTicketsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="observability" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Observabilidade</span>
            </TabsTrigger>
          </TabsList>

          {/* Alerta Global de Saúde do Sistema */}
          <SystemHealthAlert />

          {/* ========== 1. VISÃO GERAL ========== */}
          <TabsContent value="overview">
            <AdminSubTabs
              tabs={[
                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, color: 'blue' },
                { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="h-4 w-4" />, color: 'green' },
                { id: 'pql', label: 'PQL Analytics', icon: <FlaskConical className="h-4 w-4" />, color: 'purple' },
              ]}
              defaultTab="dashboard"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'dashboard' && renderOverviewContent()}
                  {activeTab === 'reports' && renderReportsContent()}
                  {activeTab === 'pql' && (
                    <Suspense fallback={<ComponentLoader />}>
                      <PQLAnalytics />
                    </Suspense>
                  )}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 2. USUÁRIOS ========== */}
          <TabsContent value="users">
            <AdminSubTabs
              tabs={[
                { id: 'administrators', label: 'Administradores', icon: <Users className="h-4 w-4" />, color: 'purple' },
                { id: 'respondents', label: 'Respondentes', icon: <MessageSquare className="h-4 w-4" />, color: 'cyan' },
                { id: 'validations', label: 'Validações', icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
              ]}
              defaultTab="administrators"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'administrators' && renderAdministratorsContent()}
                  {activeTab === 'respondents' && renderRespondentsContent()}
                  {activeTab === 'validations' && renderValidationsContent()}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 3. COMERCIAL ========== */}
          <TabsContent value="commercial">
            <AdminSubTabs
              tabs={[
                { id: 'plans', label: 'Planos', icon: <Package className="h-4 w-4" />, color: 'yellow' },
                { id: 'gateway', label: 'Gateway Pagamento', icon: <DollarSign className="h-4 w-4" />, color: 'green' },
                { id: 'recovery', label: 'Recuperação de Clientes', icon: <RefreshCw className="h-4 w-4" />, color: 'cyan' },
              ]}
              defaultTab="plans"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'plans' && <PlanManagement />}
                  {activeTab === 'gateway' && <PaymentGatewaySettings />}
                  {activeTab === 'recovery' && <CustomerRecovery />}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 4. CONTEÚDO ========== */}
          <TabsContent value="content">
            <AdminSubTabs
              tabs={[
                { id: 'templates', label: 'Templates', icon: <FileText className="h-4 w-4" />, color: 'pink' },
                { id: 'ai', label: 'Configurações IA', icon: <Sparkles className="h-4 w-4" />, color: 'purple' },
                { id: 'blog', label: 'Blog', icon: <BookOpen className="h-4 w-4" />, color: 'emerald' },
              ]}
              defaultTab="templates"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'templates' && <TemplateManagement />}
                  {activeTab === 'ai' && <AISettings />}
                  {activeTab === 'blog' && <BlogManager />}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 5. SEGURANÇA ========== */}
          <TabsContent value="security">
            <AdminSubTabs
              tabs={[
                { id: 'audit', label: 'Audit Logs', icon: <Shield className="h-4 w-4" />, color: 'red' },
                { id: 'tracking', label: 'Tracking & CSP', icon: <BarChart3 className="h-4 w-4" />, color: 'orange' },
              ]}
              defaultTab="audit"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'audit' && <AuditLogsViewer />}
                  {activeTab === 'tracking' && (
                    <div className="space-y-6">
                      <TrackingConfiguration />
                      <CSPViolationsPanel />
                    </div>
                  )}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 6. SISTEMA ========== */}
          <TabsContent value="system">
            <AdminSubTabs
              tabs={[
                { id: 'settings', label: 'Configurações', icon: <Settings className="h-4 w-4" />, color: 'blue' },
                { id: 'landing', label: 'Landing Page', icon: <Globe className="h-4 w-4" />, color: 'emerald' },
                { id: 'ab-testing', label: 'A/B Testing', icon: <FlaskConical className="h-4 w-4" />, color: 'purple' },
                { id: 'storage', label: 'Armazenamento', icon: <Package className="h-4 w-4" />, color: 'purple' },
                { id: 'performance', label: 'Bundle Size', icon: <BarChart3 className="h-4 w-4" />, color: 'green' },
                { id: 'support', label: 'Suporte', icon: <MessageSquare className="h-4 w-4" />, color: 'cyan', badge: openTicketsCount },
              ]}
              defaultTab="settings"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'settings' && renderSettingsContent()}
                  {activeTab === 'landing' && <LandingContentEditor />}
                  {activeTab === 'ab-testing' && <LandingABTestDashboard />}
                  {activeTab === 'storage' && <BunnyStorageSettings />}
                  {activeTab === 'performance' && <BundleSizeMonitor />}
                  {activeTab === 'support' && <SupportTicketsManager />}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>

          {/* ========== 7. OBSERVABILIDADE ========== */}
          <TabsContent value="observability">
            <AdminSubTabs
              tabs={[
                { id: 'health', label: 'Saúde do Sistema', icon: <Activity className="h-4 w-4" />, color: 'green' },
                { id: 'report', label: 'Relatório Consolidado', icon: <FileText className="h-4 w-4" />, color: 'blue' },
                { id: 'gtm-events', label: 'Eventos GTM', icon: <BarChart3 className="h-4 w-4" />, color: 'purple' },
              ]}
              defaultTab="health"
            >
              {(activeTab) => (
                <>
                  {activeTab === 'health' && <SystemHealthDashboard />}
                  {activeTab === 'report' && <HealthReport />}
                  {activeTab === 'gtm-events' && <Suspense fallback={<ComponentLoader />}><GTMEventsDashboard /></Suspense>}
                </>
              )}
            </AdminSubTabs>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{userToDelete?.email}</strong>?
              <br /><br />
              ⚠️ Esta ação é <strong>IRREVERSÍVEL</strong> e deletará:
              <ul className="list-disc ml-6 mt-2">
                <li>Conta de acesso (auth.users)</li>
                <li>Perfil e assinatura</li>
                <li>Todos os quizzes criados</li>
                <li>Respostas coletadas</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Altere o email e/ou WhatsApp do usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-whatsapp">WhatsApp</Label>
              <Input
                id="edit-whatsapp"
                type="text"
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                placeholder="5511999999999"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEditUser} disabled={isSavingEdit}>
              {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
