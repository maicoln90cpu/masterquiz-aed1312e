import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupportMode } from '@/contexts/SupportModeContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, XCircle, ExternalLink, RefreshCw, FileText, Users, BarChart3, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface QuizData {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  is_public: boolean;
  question_count: number;
  created_at: string;
  updated_at: string;
  creation_source: string | null;
  response_count: number;
}

interface DiagnosticData {
  quiz_id: string;
  title: string;
  slug: string | null;
  status: string;
  question_count: number;
  result_count: number;
  response_count: number;
  has_form_config: boolean;
  issues: string[];
  health: 'healthy' | 'warning';
}

interface UserOverview {
  profile: any;
  subscription: any;
  roles: string[];
  quizzes: QuizData[];
}

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { isSupportMode, target, exitSupportMode } = useSupportMode();
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagLoading, setDiagLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isSupportMode || !target) {
      navigate('/masteradm');
      return;
    }
    loadOverview();
  }, [isSupportMode, target]);

  const loadOverview = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-view-user-data', {
        body: { target_user_id: target.userId, data_type: 'overview' },
      });
      if (error) throw error;
      setOverview(data);
    } catch (err: any) {
      console.error('Error loading overview:', err);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    if (!target) return;
    setDiagLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-view-user-data', {
        body: { target_user_id: target.userId, data_type: 'diagnostics' },
      });
      if (error) throw error;
      setDiagnostics(data?.diagnostics || []);
    } catch (err: any) {
      console.error('Error loading diagnostics:', err);
      toast.error('Erro ao carregar diagnósticos');
    } finally {
      setDiagLoading(false);
    }
  };

  const handleBack = () => {
    exitSupportMode();
    navigate('/masteradm');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!overview || !target) return null;

  const planColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    partner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    premium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Suporte: {overview.profile?.full_name || target.email}
              </h1>
              <p className="text-sm text-muted-foreground">{target.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadOverview}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-sm text-muted-foreground">Plano</div>
              <div className="mt-1">
                <Badge className={planColors[overview.subscription?.plan_type] || ''}>
                  {overview.subscription?.plan_type || 'free'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-sm text-muted-foreground">Quizzes</div>
              <div className="text-2xl font-bold">{overview.quizzes.length}</div>
              <div className="text-xs text-muted-foreground">
                Limite: {overview.subscription?.quiz_limit || '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-sm text-muted-foreground">Respostas Total</div>
              <div className="text-2xl font-bold">
                {overview.quizzes.reduce((sum, q) => sum + q.response_count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Limite: {overview.subscription?.response_limit || '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={overview.subscription?.status === 'active' ? 'default' : 'destructive'}>
                {overview.subscription?.status || 'sem subscription'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                Roles: {overview.roles.join(', ') || 'nenhum'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'diagnostics' && diagnostics.length === 0) loadDiagnostics();
        }}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1">
              <FileText className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              Diagnóstico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quizzes do Usuário ({overview.quizzes.length})</CardTitle>
                <CardDescription>Lista de todos os quizzes com status e contagem de respostas</CardDescription>
              </CardHeader>
              <CardContent>
                {overview.quizzes.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum quiz encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Perguntas</TableHead>
                        <TableHead className="text-center">Respostas</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.quizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {quiz.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {quiz.slug ? (
                              <span className="flex items-center gap-1">
                                /{quiz.slug}
                                {quiz.is_public && (
                                  <ExternalLink className="h-3 w-3" />
                                )}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={quiz.status === 'active' ? 'default' : 'secondary'}>
                              {quiz.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{quiz.question_count}</TableCell>
                          <TableCell className="text-center font-medium">{quiz.response_count}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {quiz.creation_source === 'express_auto' ? 'Express' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(quiz.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Diagnóstico de Saúde dos Quizzes</CardTitle>
                  <CardDescription>Verificação automática de problemas comuns</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadDiagnostics} disabled={diagLoading}>
                  {diagLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Reanalisar
                </Button>
              </CardHeader>
              <CardContent>
                {diagLoading && diagnostics.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Analisando quizzes...</span>
                  </div>
                ) : diagnostics.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum quiz para diagnosticar.</p>
                ) : (
                  <div className="space-y-4">
                    {diagnostics.map((diag) => (
                      <Card key={diag.quiz_id} className={`border-l-4 ${diag.health === 'healthy' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                {diag.health === 'healthy' ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                )}
                                <span className="font-medium">{diag.title}</span>
                                <Badge variant={diag.status === 'active' ? 'default' : 'secondary'}>
                                  {diag.status}
                                </Badge>
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                <span>📝 {diag.question_count} perguntas</span>
                                <span>🎯 {diag.result_count} resultados</span>
                                <span>📊 {diag.response_count} respostas</span>
                                <span>{diag.has_form_config ? '✅ Form Config' : '⚠️ Sem Form Config'}</span>
                                <span>🔗 {diag.slug ? `/${diag.slug}` : 'Sem slug'}</span>
                              </div>
                              {diag.issues.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {diag.issues.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                                      <XCircle className="h-4 w-4 shrink-0" />
                                      {issue}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Nome:</strong> {overview.profile?.full_name || '-'}</div>
              <div><strong>Email:</strong> {overview.profile?.email || '-'}</div>
              <div><strong>WhatsApp:</strong> {overview.profile?.whatsapp || '-'}</div>
              <div><strong>Company Slug:</strong> {overview.profile?.company_slug || '-'}</div>
              <div><strong>Logins:</strong> {overview.profile?.login_count || 0}</div>
              <div><strong>Cadastro:</strong> {overview.profile?.created_at ? new Date(overview.profile.created_at).toLocaleDateString('pt-BR') : '-'}</div>
              <div><strong>Último update:</strong> {overview.profile?.updated_at ? new Date(overview.profile.updated_at).toLocaleDateString('pt-BR') : '-'}</div>
              <div><strong>Stage:</strong> {overview.profile?.user_stage || '-'}</div>
              <div><strong>Facebook Pixel:</strong> {overview.profile?.facebook_pixel_id || '-'}</div>
              <div><strong>GTM:</strong> {overview.profile?.gtm_container_id || '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportDashboard;
