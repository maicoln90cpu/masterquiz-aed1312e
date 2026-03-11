// ✅ FASE 2 - ITEM 5: Imports base permanecem
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles/onboarding.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ReactNode, lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTranslation } from "react-i18next";

import { useInvalidateOnLogout } from "@/hooks/useInvalidateOnLogout";
import { useGlobalTracking } from "@/hooks/useGlobalTracking";
import { useProductionWebVitals } from "@/hooks/useWebVitals";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAccountCreatedEvent } from "@/hooks/useAccountCreatedEvent";
import { usePlanUpgradeEvent } from "@/hooks/usePlanUpgradeEvent";
import { useSiteMode } from "@/hooks/useSiteMode";
import { supabase } from "@/integrations/supabase/client";

// ✅ Lazy com retry automático + tratamento robusto para erros de cache/rede
const lazyWithRetry = (
  componentImport: () => Promise<{ default: React.ComponentType<any> }>,
  componentName: string = 'Component',
  retries = 3
) => {
  return lazy(async () => {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[LazyLoad] Tentativa ${i + 1}/${retries} falhou para ${componentName}:`, error);
        
        // Se for erro de módulo não encontrado, tenta limpar cache
        if (lastError.message?.includes('Failed to fetch dynamically imported module') ||
            lastError.message?.includes('Loading chunk') ||
            lastError.message?.includes('Importing a module script failed')) {
          // Limpa cache do service worker se existir
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              console.log('[LazyLoad] Cache limpo com sucesso');
            } catch (cacheError) {
              console.warn('[LazyLoad] Erro ao limpar cache:', cacheError);
            }
          }
        }
        
        // Aguardar antes de tentar novamente (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    // Se falhou após retries, oferecer reload ou fallback
    console.error(`[LazyLoad] Falha permanente ao carregar ${componentName} após ${retries} tentativas`);
    
    // Retorna um componente de fallback ao invés de recarregar automaticamente
    return {
      default: () => {
        const handleReload = () => {
          // Força reload com cache bypass
          window.location.href = window.location.href.split('?')[0] + '?cache=' + Date.now();
        };
        
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">Erro ao carregar página</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar <strong>{componentName}</strong>. 
                Isso pode acontecer após uma atualização do sistema.
              </p>
              <button
                onClick={handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        );
      }
    };
  });
};

// ✅ FASE 2 - ITEM 5: CODE SPLITTING - Lazy load páginas principais com retry
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "Dashboard");
const CRM = lazyWithRetry(() => import("./pages/CRM"), "CRM");
const Analytics = lazyWithRetry(() => import("./pages/Analytics"), "Analytics");
const Settings = lazyWithRetry(() => import("./pages/Settings"), "Settings");
const CreateQuiz = lazyWithRetry(() => import("./pages/CreateQuiz"), "CreateQuiz");
const Responses = lazyWithRetry(() => import("./pages/Responses"), "Responses");
const WebhookLogs = lazyWithRetry(() => import("./pages/WebhookLogs"), "WebhookLogs");
const WebhookSettings = lazyWithRetry(() => import("./pages/WebhookSettings"), "WebhookSettings");
const MaisfyGenerator = lazyWithRetry(() => import("./pages/MaisfyGenerator"), "MaisfyGenerator");
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"), "AdminDashboard");
const AdminTemplateEditor = lazyWithRetry(() => import("./pages/AdminTemplateEditor"), "AdminTemplateEditor");
const Checkout = lazyWithRetry(() => import("./pages/Checkout"), "Checkout");
const FAQ = lazyWithRetry(() => import("./pages/FAQ"), "FAQ");
const Blog = lazyWithRetry(() => import("./pages/Blog"), "Blog");
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"), "BlogPost");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "Pricing");
const MediaLibrary = lazyWithRetry(() => import("./pages/MediaLibrary"), "MediaLibrary");
const PreviewQuiz = lazyWithRetry(() => import("./pages/PreviewQuiz"), "PreviewQuiz");
const KiwifySuccess = lazyWithRetry(() => import("./pages/KiwifySuccess"), "KiwifySuccess");
const KiwifyCancel = lazyWithRetry(() => import("./pages/KiwifyCancel"), "KiwifyCancel");
const Integrations = lazyWithRetry(() => import("./pages/Integrations"), "Integrations");
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"), "PrivacyPolicy");
const MyQuizzes = lazyWithRetry(() => import("./pages/MyQuizzes"), "MyQuizzes");
const Start = lazyWithRetry(() => import("./pages/Start"), "Start");

// ✅ GTM GLOBAL: Layout route que carrega tracking apenas nas rotas do site (NÃO quiz público/preview)
const GlobalTrackingLayout = () => {
  useGlobalTracking();
  return <Outlet />;
};

// ✅ FASE 5: RequireAuth usa AuthContext centralizado (side effects via useEffect)
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { isModeB, isLoading: modeLoading } = useSiteMode();
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(true);
  
  // ✅ ITEM 4: Limpar cache ao fazer logout
  useInvalidateOnLogout();
  
  // ✅ Disparar account_created globalmente (qualquer rota autenticada)
  useAccountCreatedEvent();
  
  // ✅ Detectar upgrade de plano (free → pago)
  usePlanUpgradeEvent();

  useEffect(() => {
    if (!loading && !user) {
      toast.error(t('nav.needLogin'));
      navigate('/login');
    }
  }, [loading, user, navigate, t]);

  // ✅ ETAPA 3: No Modo B, verificar payment_confirmed
  useEffect(() => {
    if (!user || loading || modeLoading) return;
    if (!isModeB) {
      setPaymentChecked(true);
      setPaymentConfirmed(true);
      return;
    }

    const checkPayment = async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('payment_confirmed, plan_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // Admin/master_admin plans bypass payment check
      if (data?.plan_type === 'admin') {
        setPaymentConfirmed(true);
      } else {
        setPaymentConfirmed(data?.payment_confirmed ?? false);
      }
      setPaymentChecked(true);
    };

    checkPayment();
  }, [user, loading, isModeB, modeLoading]);

  // ✅ Redirect unpaid users to checkout in Mode B
  useEffect(() => {
    if (!paymentChecked || !isModeB) return;
    if (!paymentConfirmed) {
      // Don't redirect if already on checkout or kiwify pages
      const path = window.location.pathname;
      if (path !== '/checkout' && !path.startsWith('/kiwify')) {
        toast.error(t('checkout.paymentRequired', 'Pagamento necessário para acessar a plataforma'));
        navigate('/checkout');
      }
    }
  }, [paymentChecked, paymentConfirmed, isModeB, navigate, t]);
  
  if (loading || !user || (isModeB && !paymentChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return <>{children}</>;
};

// ✅ FASE 3 - Páginas estáticas (não lazy) mantidas para performance crítica
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// ✅ FASE 3 - QuizView lazy loaded para reduzir bundle inicial
const QuizView = lazyWithRetry(() => import("./pages/QuizView"), "QuizView");

// ✅ FASE 2 - ITEM 5: Componente LazyRoute para wrapping de páginas lazy
const LazyRoute = ({ Component }: { Component: React.ComponentType }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  }>
    <Component />
  </Suspense>
);

// ✅ ITEM 4: REACT QUERY CACHE CONFIGURATION
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // ✅ Cache válido por 5 minutos
      gcTime: 10 * 60 * 1000, // ✅ Mantém em memória por 10 min
      refetchOnWindowFocus: false, // ✅ Não refaz ao voltar para aba
      retry: 1, // ✅ Apenas 1 retry (ao invés de 3)
    },
  },
});

// ✅ FASE 4: Web Vitals wrapper component
const WebVitalsProvider = ({ children }: { children: ReactNode }) => {
  useProductionWebVitals();
  return <>{children}</>;
};

// ✅ Handler global para unhandled rejections (evita tela branca)
const GlobalErrorHandler = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalErrorHandler] Unhandled rejection:', event.reason);
      
      // Previne crash total da aplicação
      event.preventDefault();
      
      // Mostra toast amigável ao invés de crashar
      const errorMessage = event.reason?.message || 'Erro inesperado';
      toast.error(`Ocorreu um erro: ${errorMessage}`, {
        description: 'Se persistir, recarregue a página.',
        duration: 5000,
      });
    };

    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalErrorHandler] Uncaught error:', event.error);
      // Não previne default aqui para que ErrorBoundary ainda funcione
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <GlobalErrorHandler>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WebVitalsProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter>
              <Routes>
                {/* ✅ ROTAS COM GTM GLOBAL (todas as páginas do site) */}
                <Route element={<GlobalTrackingLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/kiwify/success" element={<LazyRoute Component={KiwifySuccess} />} />
                  <Route path="/kiwify/cancel" element={<LazyRoute Component={KiwifyCancel} />} />
                  <Route path="/faq" element={<LazyRoute Component={FAQ} />} />
                  <Route path="/blog" element={<LazyRoute Component={Blog} />} />
                  <Route path="/blog/:slug" element={<LazyRoute Component={BlogPost} />} />
                  <Route path="/precos" element={<LazyRoute Component={Pricing} />} />
                  <Route path="/privacy-policy" element={<LazyRoute Component={PrivacyPolicy} />} />
                  <Route path="/start" element={
                    <RequireAuth>
                      <LazyRoute Component={Start} />
                    </RequireAuth>
                  } />
                  <Route path="/dashboard" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Dashboard} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/meus-quizzes" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={MyQuizzes} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/settings" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Settings} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/create-quiz" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={CreateQuiz} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/crm" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={CRM} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/responses" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Responses} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/analytics" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Analytics} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/webhook-logs" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={WebhookLogs} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/webhook-settings" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={WebhookSettings} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/maisfy-generator" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={MaisfyGenerator} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/media-library" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={MediaLibrary} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/integrations" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Integrations} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="/masteradm" element={
                    <ProtectedRoute requiredRole="master_admin">
                      <LazyRoute Component={AdminDashboard} />
                    </ProtectedRoute>
                  } />
                  <Route path="/masteradm/template-editor/:templateId" element={
                    <ProtectedRoute requiredRole="master_admin">
                      <LazyRoute Component={AdminTemplateEditor} />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <RequireAuth>
                      <ProtectedRoute requiredRole="admin">
                        <LazyRoute Component={Checkout} />
                      </ProtectedRoute>
                    </RequireAuth>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* ✅ ROTAS SEM GTM GLOBAL (apenas GTM do criador via useQuizTracking) */}
                <Route path="/preview/:quizId" element={
                  <RequireAuth>
                    <LazyRoute Component={PreviewQuiz} />
                  </RequireAuth>
                } />
                <Route path="/:company/:slug" element={<LazyRoute Component={QuizView} />} />
                <Route path="/quiz/:slug" element={<LazyRoute Component={QuizView} />} />
              </Routes>
              <CookieConsentBanner />
            </BrowserRouter>
          </WebVitalsProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorHandler>
  </ErrorBoundary>
);

export default App;
