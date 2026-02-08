import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, MessageSquare, Webhook, Settings, Loader2, HelpCircle, FileQuestion, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useDashboardStats, useChartData } from "@/hooks/useDashboardData";
import { showErrorToast } from "@/lib/errorHandler";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Onboarding } from "@/components/Onboarding";
import { DashboardTour } from "@/components/onboarding/DashboardTour";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { FeatureTooltip } from "@/components/onboarding/FeatureTooltip";
import { useOnboarding } from "@/hooks/useOnboarding";
import { PlanLimitWarning } from "@/components/PlanLimitWarning";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { ResourceMonitoringPanel } from "@/components/ResourceMonitoringPanel";
import { useUserStage } from "@/hooks/useUserStage";
import type { Profile } from "@/types/quiz";

// Lazy load components
const ChartsBundle = lazy(() => import("@/components/lazy/ChartsBundle").then(m => ({ default: m.ChartsBundle })));
const CreateTicketDialog = lazy(() => import("@/components/support/CreateTicketDialog").then(m => ({ default: m.CreateTicketDialog })));
const UserTicketsList = lazy(() => import("@/components/support/UserTicketsList").then(m => ({ default: m.UserTicketsList })));

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Keyboard shortcuts
  useGlobalShortcuts();
  
  // React Query hooks
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData = [], isLoading: chartLoading } = useChartData();
  
  // Local state
  const [userName, setUserName] = useState('');
  const { isMasterAdmin } = useUserRole();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { quizLimit, responseLimit } = useSubscriptionLimits();
  const { shouldShowDashboardTour, updateOnboardingStep } = useOnboarding();
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Pick<Profile, 'full_name' | 'company_slug'> | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  
  // PQL User Stage
  const userStageData = useUserStage();
  
  const loading = statsLoading;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
       
       // Verificar se é um novo cadastro e disparar evento GTM
       const justRegistered = localStorage.getItem('mq_just_registered');
       if (justRegistered === 'true') {
         localStorage.removeItem('mq_just_registered');
         const w = window as Window & { dataLayer?: Record<string, unknown>[] };
         w.dataLayer = w.dataLayer || [];
         w.dataLayer.push({
           event: 'account_created',
           user_id: user.id,
           user_email: user.email
         });
         console.log('🎯 [GTM] Event pushed: account_created');
       }
        
        // Load user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_slug')
          .eq('id', user.id)
          .maybeSingle();
        
        setUserName(profile?.full_name || user.email?.split('@')[0] || t('dashboard.user'));
        setUserProfile(profile);
        
        // Check if first time user (show onboarding)
        if ((stats?.totalQuizzes ?? 0) === 0 && !localStorage.getItem(`onboarding_completed_${user.id}`)) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [navigate, t, stats?.totalQuizzes]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      showErrorToast(error, 'Logout', t('nav.logoutError'));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Breadcrumbs />
        <DashboardSkeleton />
      </main>
    );
  }

  const handleCloseOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <DashboardLayout>
      <Onboarding open={showOnboarding} onClose={handleCloseOnboarding} />
      {shouldShowDashboardTour && <DashboardTour updateOnboardingStep={updateOnboardingStep} />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div id="dashboard-overview" className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            {t('dashboard.overview')}
          </h2>
          {isMasterAdmin && (
            <Button 
              variant="default"
              size="sm"
              onClick={() => navigate("/masteradm")}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              {t('nav.masterPanel')}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, staggerChildren: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.totalQuizzes')}</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalQuizzes ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.totalResponses')}</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalResponses ?? 0}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.activeQuizzes')}</CardDescription>
              <CardTitle className="text-3xl">{stats?.activeQuizzes ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Plan Limit Warnings */}
        <PlanLimitWarning 
          current={stats?.totalQuizzes ?? 0} 
          limit={quizLimit} 
          type="quiz" 
        />
        <PlanLimitWarning 
          current={stats?.totalResponses ?? 0} 
          limit={responseLimit} 
          type="response" 
        />

        {/* Onboarding Progress Card */}
        <div className="mb-6">
          <OnboardingProgress collapsible />
        </div>

        {/* Resource Monitoring Panel */}
        <div className="mb-6">
          <ResourceMonitoringPanel />
        </div>

        {/* PQL Stage CTA Card */}
        {!userStageData.loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{userStageData.stageEmoji}</span>
                    <div>
                      <p className="text-lg font-medium">{userStageData.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('userStage.level', 'Nível')}: {userStageData.stageLabel}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={userStageData.primaryCTA.action}
                    className="gap-2 shrink-0"
                    variant={userStageData.primaryCTA.variant || 'default'}
                  >
                    <Sparkles className="h-4 w-4" />
                    {userStageData.primaryCTA.label}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Access Card - Meus Quizzes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            className="mb-6 hover:shadow-lg transition-all cursor-pointer group border-primary/20 hover:border-primary/40" 
            onClick={() => navigate('/meus-quizzes')}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileQuestion className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('nav.myQuizzes')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.quizzesCount', { count: stats?.totalQuizzes ?? 0 })}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {t('dashboard.viewAll')}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Create Quiz */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {t('dashboard.createNewQuiz')}
              </CardTitle>
              <CardDescription>{t('dashboard.createNewQuizDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureTooltip
                id="dashboard-create-quiz"
                title={t('onboarding.tooltip.createQuiz.title', '🚀 Comece aqui!')}
                description={t('onboarding.tooltip.createQuiz.desc', 'Clique para criar seu primeiro quiz.')}
                position="top"
                delay={1000}
              >
                <Button className="w-full" onClick={() => navigate("/create-quiz")}>
                  {t('dashboard.newQuiz')}
                </Button>
              </FeatureTooltip>
            </CardContent>
          </Card>

          {/* CRM */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t('dashboard.crm')}
              </CardTitle>
              <CardDescription>{t('dashboard.crmDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/crm")}>
                {t('dashboard.accessCRM')}
              </Button>
            </CardContent>
          </Card>

          {/* Responses */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t('dashboard.responses')}
              </CardTitle>
              <CardDescription>{t('dashboard.responsesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/responses")}>
                {t('dashboard.viewResponses')}
              </Button>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                {t('dashboard.webhooks')}
              </CardTitle>
              <CardDescription>{t('dashboard.webhooksDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/webhook-logs")}>
                {t('dashboard.viewLogs')}
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t('dashboard.settings')}
              </CardTitle>
              <CardDescription>{t('dashboard.manageAccount')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/settings")}>
                {t('dashboard.configure')}
              </Button>
            </CardContent>
          </Card>

          {/* FAQ / Help */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {t('dashboard.generalQuestions')}
              </CardTitle>
              <CardDescription>{t('dashboard.helpCenter')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/faq")}>
                {t('dashboard.viewFAQ')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.needHelp')}</CardTitle>
            <CardDescription>{t('dashboard.reportBugs')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setTicketDialogOpen(true)}>
              {t('dashboard.openTicket')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Dialog */}
      <Suspense fallback={null}>
        <CreateTicketDialog
          open={ticketDialogOpen}
          onOpenChange={setTicketDialogOpen}
        />
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
