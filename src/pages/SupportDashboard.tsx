import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupportMode, type SupportAction } from '@/contexts/SupportModeContext';
import { logAudit } from '@/lib/auditLogger';
import { generateSupportPdfReport } from '@/lib/supportPdfReport';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, ArrowLeft, CheckCircle, AlertTriangle, XCircle, ExternalLink,
  RefreshCw, FileText, BarChart3, Shield, Wrench, RotateCcw,
  MessageSquare, Send, Search, Pencil, ClipboardList, Clock, Download, History
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
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

interface QuizDetail {
  quiz: any;
  questions: any[];
  results: any[];
  formConfig: any;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

interface SessionHistoryItem {
  id: string;
  admin_id: string;
  target_user_id: string;
  target_email: string;
  target_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  actions_count: number;
  actions_summary: string[];
}

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { isSupportMode, target, exitSupportMode, trackAction, sessionActions, startTime } = useSupportMode();
  const [overview, setOverview] = useState<UserOverview | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagLoading, setDiagLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Quiz detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Chat
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Session report
  const [reportOpen, setReportOpen] = useState(false);

  // History
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Action loading states
  const [fixingQuizId, setFixingQuizId] = useState<string | null>(null);
  const [republishingQuizId, setRepublishingQuizId] = useState<string | null>(null);

  // Realtime subscription ref
  const realtimeChannel = useRef<any>(null);

  useEffect(() => {
    if (!isSupportMode || !target) {
      navigate('/masteradm');
      return;
    }
    loadOverview();
  }, [isSupportMode, target]);

  // ── GLOBAL Realtime subscription (active during entire session) ──
  useEffect(() => {
    if (!target) return;

    realtimeChannel.current = supabase
      .channel(`support-tickets-${target.userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      }, (payload) => {
        const newMsg = payload.new as TicketMessage;
        if (tickets.some(t => t.id === newMsg.ticket_id)) {
          setMessages(prev => [...prev, newMsg]);
          // If not on chat tab or different ticket selected, increment unread
          if (activeTab !== 'chat' || selectedTicketId !== newMsg.ticket_id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${target.userId}`,
      }, (payload) => {
        const updated = payload.new as Ticket;
        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
      })
      .subscribe();

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [target, tickets.length]);

  // Clear unread when entering chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
    }
  }, [activeTab]);

  const callEdgeFunction = useCallback(async (body: any) => {
    const { data, error } = await supabase.functions.invoke('admin-view-user-data', { body });
    if (error) throw error;
    return data;
  }, []);

  const loadOverview = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const data = await callEdgeFunction({ target_user_id: target.userId, data_type: 'overview' });
      setOverview(data);
      trackAction('Visualizou overview', undefined, `${data?.quizzes?.length || 0} quizzes`);
      logAudit('support:view_overview', 'support', target.userId, { target_email: target.email });
    } catch (err: any) {
      logger.error('Error loading overview:', err);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostics = async () => {
    if (!target) return;
    setDiagLoading(true);
    try {
      const data = await callEdgeFunction({ target_user_id: target.userId, data_type: 'diagnostics' });
      setDiagnostics(data?.diagnostics || []);
      const issues = (data?.diagnostics || []).reduce((sum: number, d: any) => sum + (d.issues?.length || 0), 0);
      trackAction('Executou diagnóstico', undefined, `${issues} problemas encontrados`);
      logAudit('support:run_diagnostics', 'support', target.userId, { target_email: target.email });
    } catch (err: any) {
      logger.error('Error loading diagnostics:', err);
      toast.error('Erro ao carregar diagnósticos');
    } finally {
      setDiagLoading(false);
    }
  };

  const loadQuizDetail = async (quizId: string, quizTitle?: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const data = await callEdgeFunction({ target_user_id: target!.userId, data_type: 'quiz_detail', quiz_id: quizId });
      setQuizDetail(data);
      trackAction('Visualizou detalhes do quiz', quizId, quizTitle);
      logAudit('support:view_quiz_detail', 'support', quizId, { target_user_id: target!.userId });
    } catch (err: any) {
      logger.error('Error loading quiz detail:', err);
      toast.error('Erro ao carregar detalhes do quiz');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFixDuplicates = async (quizId: string, quizTitle?: string) => {
    setFixingQuizId(quizId);
    try {
      const data = await callEdgeFunction({ target_user_id: target!.userId, data_type: 'fix_duplicates', quiz_id: quizId });
      toast.success(`IDs reordenados: ${data.questions_reordered} perguntas`);
      trackAction('Corrigiu IDs duplicados', quizId, `${data.questions_reordered} perguntas reordenadas`);
      logAudit('support:fix_duplicates', 'support', quizId, { target_user_id: target!.userId });
      loadDiagnostics();
    } catch (err: any) {
      toast.error('Erro ao corrigir IDs duplicados');
    } finally {
      setFixingQuizId(null);
    }
  };

  const handleRepublish = async (quizId: string, quizTitle?: string) => {
    setRepublishingQuizId(quizId);
    try {
      await callEdgeFunction({ target_user_id: target!.userId, data_type: 'republish', quiz_id: quizId });
      toast.success('Quiz republicado com sucesso');
      trackAction('Republicou quiz', quizId, quizTitle);
      logAudit('support:republish_quiz', 'support', quizId, { target_user_id: target!.userId });
      loadDiagnostics();
      loadOverview();
    } catch (err: any) {
      toast.error('Erro ao republicar quiz');
    } finally {
      setRepublishingQuizId(null);
    }
  };

  const handleEditQuiz = (quizId: string, quizTitle?: string) => {
    trackAction('Abriu editor do quiz', quizId, quizTitle);
    logAudit('support:edit_quiz', 'support', quizId, {
      target_user_id: target!.userId,
    });
    navigate(`/masteradm/support/edit-quiz/${quizId}`);
  };

  const loadTickets = async () => {
    if (!target) return;
    setTicketsLoading(true);
    try {
      const data = await callEdgeFunction({ target_user_id: target.userId, data_type: 'tickets' });
      setTickets(data?.tickets || []);
      setMessages(data?.messages || []);
      trackAction('Visualizou tickets', undefined, `${data?.tickets?.length || 0} tickets`);
      logAudit('support:view_tickets', 'support', target.userId, { target_email: target.email });
    } catch (err: any) {
      toast.error('Erro ao carregar tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicketId || !newMessage.trim()) return;
    setSending(true);
    try {
      await callEdgeFunction({
        target_user_id: target!.userId,
        data_type: 'send_message',
        ticket_id: selectedTicketId,
        message: newMessage.trim(),
      });
      toast.success('Mensagem enviada');
      trackAction('Enviou mensagem', selectedTicketId, newMessage.trim().slice(0, 50));
      logAudit('support:send_message', 'support', selectedTicketId, { target_user_id: target!.userId });
      setNewMessage('');
      loadTickets();
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const loadSessionHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await callEdgeFunction({ target_user_id: target!.userId, data_type: 'session_history' });
      setSessionHistory(data?.sessions || []);
      trackAction('Visualizou histórico de sessões');
    } catch (err: any) {
      logger.error('Error loading session history:', err);
      toast.error('Erro ao carregar histórico');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleBack = () => {
    if (sessionActions.length > 1) {
      setReportOpen(true);
    } else {
      exitSupportMode();
      navigate('/masteradm');
    }
  };

  const confirmExit = () => {
    setReportOpen(false);
    exitSupportMode();
    navigate('/masteradm');
  };

  const openQuizPublic = (quiz: QuizData) => {
    const companySlug = overview?.profile?.company_slug;
    trackAction('Abriu quiz público', quiz.id, quiz.title);
    if (companySlug && quiz.slug) {
      window.open(`/${companySlug}/${quiz.slug}`, '_blank');
    } else if (quiz.slug) {
      window.open(`/quiz/${quiz.slug}`, '_blank');
    }
  };

  const getSessionDuration = () => {
    if (!startTime) return '00:00';
    const seconds = Math.round((Date.now() - startTime.getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const exportSessionReport = async () => {
    if (!target || !startTime) return;
    try {
      await generateSupportPdfReport({
        userName: target.fullName,
        userEmail: target.email,
        planType: target.planType,
        startTime,
        duration: getSessionDuration(),
        actions: sessionActions,
      });
      trackAction('Exportou relatório PDF');
      toast.success('PDF exportado com sucesso');
    } catch (err) {
      logger.error('Error generating PDF:', err);
      toast.error('Erro ao gerar PDF');
    }
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

  const selectedTicketMessages = messages.filter(m => m.ticket_id === selectedTicketId);

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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {getSessionDuration()}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              {sessionActions.length} ações
            </Badge>
            <Button variant="outline" size="sm" onClick={exportSessionReport} title="Exportar relatório">
              <Download className="h-4 w-4 mr-1" />
              Relatório
            </Button>
            <Button variant="outline" size="sm" onClick={loadOverview}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
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
              <div className="text-xs text-muted-foreground">Limite: {overview.subscription?.quiz_limit || '-'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-sm text-muted-foreground">Respostas Total</div>
              <div className="text-2xl font-bold">
                {overview.quizzes.reduce((sum, q) => sum + q.response_count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Limite: {overview.subscription?.response_limit || '-'}</div>
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
          if (v === 'chat' && tickets.length === 0) loadTickets();
          if (v === 'history' && sessionHistory.length === 0) loadSessionHistory();
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
            <TabsTrigger value="chat" className="gap-1 relative">
              <MessageSquare className="h-4 w-4" />
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="session" className="gap-1">
              <ClipboardList className="h-4 w-4" />
              Sessão
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* ── QUIZZES TAB ── */}
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quizzes do Usuário ({overview.quizzes.length})</CardTitle>
                <CardDescription>Lista de quizzes com ações de visualização, edição e diagnóstico</CardDescription>
              </CardHeader>
              <CardContent>
                {overview.quizzes.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum quiz encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Perguntas</TableHead>
                        <TableHead className="text-center">Respostas</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.quizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{quiz.title}</TableCell>
                          <TableCell>
                            <Badge variant={quiz.status === 'active' ? 'default' : 'secondary'}>{quiz.status}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{quiz.question_count}</TableCell>
                          <TableCell className="text-center font-medium">{quiz.response_count}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {quiz.creation_source === 'express_auto' ? 'Express' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {quiz.is_public && quiz.status === 'active' && quiz.slug && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openQuizPublic(quiz)} title="Ver quiz público">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadQuizDetail(quiz.id, quiz.title)} title="Ver detalhes">
                                <Search className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditQuiz(quiz.id, quiz.title)} title="Editar quiz (read-only)">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DIAGNOSTICS TAB ── */}
          <TabsContent value="diagnostics" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Diagnóstico de Saúde dos Quizzes</CardTitle>
                  <CardDescription>Verificação automática com ações corretivas</CardDescription>
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
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {diag.health === 'healthy' ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                                )}
                                <span className="font-medium">{diag.title}</span>
                                <Badge variant={diag.status === 'active' ? 'default' : 'secondary'}>{diag.status}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
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
                            <div className="flex flex-col gap-2 ml-4">
                              <Button variant="ghost" size="sm" onClick={() => loadQuizDetail(diag.quiz_id, diag.title)}>
                                <Search className="h-4 w-4 mr-1" />
                                Detalhe
                              </Button>
                              {diag.issues.some(i => i.includes('order_number duplicado')) && (
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => handleFixDuplicates(diag.quiz_id, diag.title)}
                                  disabled={fixingQuizId === diag.quiz_id}
                                >
                                  {fixingQuizId === diag.quiz_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <Wrench className="h-4 w-4 mr-1" />
                                  )}
                                  Corrigir IDs
                                </Button>
                              )}
                              {diag.issues.length > 0 && (
                                <Button
                                  variant="outline" size="sm"
                                  onClick={() => handleRepublish(diag.quiz_id, diag.title)}
                                  disabled={republishingQuizId === diag.quiz_id}
                                >
                                  {republishingQuizId === diag.quiz_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                  )}
                                  Republicar
                                </Button>
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

          {/* ── CHAT TAB ── */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chat de Suporte</CardTitle>
                  <CardDescription>Tickets e mensagens — atualização em tempo real</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadTickets} disabled={ticketsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${ticketsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {ticketsLoading && tickets.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum ticket encontrado para este usuário.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:border-r md:pr-4">
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Tickets ({tickets.length})</h3>
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTicketId === ticket.id ? 'bg-accent border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate">{ticket.title}</span>
                            <Badge variant={ticket.status === 'open' ? 'default' : ticket.status === 'resolved' ? 'secondary' : 'outline'} className="text-xs ml-2 shrink-0">
                              {ticket.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-2">
                      {!selectedTicketId ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          Selecione um ticket para ver as mensagens
                        </div>
                      ) : (
                        <div className="flex flex-col h-[400px]">
                          <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-3">
                              {selectedTicketMessages.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Nenhuma mensagem neste ticket.</p>
                              ) : (
                                selectedTicketMessages.map((msg) => {
                                  const isAdmin = msg.sender_id !== target!.userId;
                                  return (
                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                        isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                      }`}>
                                        <p>{msg.message}</p>
                                        <p className={`text-xs mt-1 ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                          {new Date(msg.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Textarea
                              placeholder="Digite uma mensagem..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="min-h-[40px] max-h-[80px]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button size="icon" onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SESSION LOG TAB ── */}
          <TabsContent value="session" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Log da Sessão de Suporte</CardTitle>
                  <CardDescription>
                    Todas as ações realizadas nesta sessão — Início: {startTime?.toLocaleTimeString('pt-BR')} — Duração: {getSessionDuration()}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportSessionReport}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
              </CardHeader>
              <CardContent>
                {sessionActions.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma ação registrada ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {sessionActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                          {action.timestamp.toLocaleTimeString('pt-BR')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{action.action}</div>
                          {action.details && (
                            <div className="text-xs text-muted-foreground">{action.details}</div>
                          )}
                          {action.resourceId && (
                            <div className="text-xs text-muted-foreground font-mono">
                              ID: {action.resourceId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── HISTORY TAB ── */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Histórico de Sessões de Suporte</CardTitle>
                  <CardDescription>Sessões anteriores registradas no audit_logs</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadSessionHistory} disabled={historyLoading}>
                  {historyLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {historyLoading && sessionHistory.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma sessão anterior encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {sessionHistory.map((session) => (
                      <Card key={session.id} className="border">
                        <CardContent className="py-3 px-4">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {session.target_name || session.target_email}
                                </span>
                                <span className="text-xs text-muted-foreground">{session.target_email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(session.started_at).toLocaleDateString('pt-BR')} {new Date(session.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2 justify-end text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDuration(session.duration_seconds)}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {session.actions_count} ações
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {expandedSessionId === session.id && session.actions_summary.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <h4 className="text-xs font-medium text-muted-foreground mb-2">Ações realizadas:</h4>
                              <div className="flex flex-wrap gap-1">
                                {session.actions_summary.map((action, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
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

      {/* ── QUIZ DETAIL MODAL ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Quiz</DialogTitle>
            <DialogDescription>{quizDetail?.quiz?.title || ''}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : quizDetail ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Status:</strong> {quizDetail.quiz?.status}</div>
                <div><strong>Slug:</strong> {quizDetail.quiz?.slug || '-'}</div>
                <div><strong>Público:</strong> {quizDetail.quiz?.is_public ? 'Sim' : 'Não'}</div>
                <div><strong>Template:</strong> {quizDetail.quiz?.template}</div>
                <div><strong>Criado:</strong> {quizDetail.quiz?.created_at ? new Date(quizDetail.quiz.created_at).toLocaleDateString('pt-BR') : '-'}</div>
                <div><strong>Atualizado:</strong> {quizDetail.quiz?.updated_at ? new Date(quizDetail.quiz.updated_at).toLocaleDateString('pt-BR') : '-'}</div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Perguntas ({quizDetail.questions.length})</h3>
                <div className="space-y-2">
                  {quizDetail.questions.map((q: any) => (
                    <div key={q.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">#{q.order_number}</Badge>
                        <span className="font-medium text-sm">{q.question_text}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Formato: {q.answer_format}</span>
                        <span>Blocos: {Array.isArray(q.blocks) ? q.blocks.length : 0}</span>
                        {q.media_url && <span>📎 Mídia</span>}
                      </div>
                      {Array.isArray(q.blocks) && q.blocks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.blocks.map((b: any, bi: number) => (
                            <Badge key={bi} variant="secondary" className="text-xs">{b.type || 'unknown'}</Badge>
                          ))}
                        </div>
                      )}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Opções:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.options.map((opt: any, oi: number) => (
                              <Badge key={oi} variant="outline" className="text-xs">
                                {typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt).slice(0, 30)}
                                {opt.score !== undefined && <span className="ml-1 text-primary">({opt.score}pts)</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Resultados ({quizDetail.results.length})</h3>
                <div className="space-y-2">
                  {quizDetail.results.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-3">
                      <div className="font-medium text-sm">{r.result_text}</div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>Score: {r.min_score ?? '-'} — {r.max_score ?? '-'}</span>
                        <span>Tipo: {r.condition_type}</span>
                        {r.redirect_url && <span>🔗 {r.redirect_url}</span>}
                        {r.button_text && <span>🔘 {r.button_text}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {quizDetail.formConfig && (
                <div>
                  <h3 className="font-semibold mb-2">Configuração do Formulário</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Email: {quizDetail.formConfig.collect_email ? '✅' : '❌'}</div>
                    <div>Nome: {quizDetail.formConfig.collect_name ? '✅' : '❌'}</div>
                    <div>WhatsApp: {quizDetail.formConfig.collect_whatsapp ? '✅' : '❌'}</div>
                    <div>Timing: {quizDetail.formConfig.collection_timing}</div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── EXIT CONFIRMATION WITH SESSION SUMMARY ── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar Sessão de Suporte</DialogTitle>
            <DialogDescription>
              Resumo da sessão com {target?.fullName || target?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Duração:</strong> {getSessionDuration()}</div>
              <div><strong>Ações:</strong> {sessionActions.length}</div>
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
              {sessionActions.slice(-10).map((a, i) => (
                <div key={i} className="text-xs py-1 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{a.timestamp.toLocaleTimeString('pt-BR')}</span>
                  <span className="ml-2">{a.action}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={exportSessionReport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              <Button variant="default" onClick={confirmExit}>
                Sair do Suporte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportDashboard;
