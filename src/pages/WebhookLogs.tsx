import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface WebhookLog {
  id: string;
  created_at: string;
  event_type: string;
  payload: any;
  status: 'success' | 'failed' | 'pending';
  response: any;
  quiz_id?: string;
  quiz_title?: string;
}

const LOGS_PER_PAGE = 20;

const WebhookLogs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadWebhookLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadWebhookLogs = async () => {
    try {
      setLoading(true);
      if (!user) {
        navigate('/login');
        return;
      }

      // Buscar logs reais de webhook_logs
      const { data: logs, error } = await supabase
        .from('webhook_logs')
        .select(`
          id,
          created_at,
          status_code,
          response_body,
          error_message,
          quiz_id,
          response_id,
          webhook_id,
          user_webhooks!inner(user_id)
        `)
        .eq('user_webhooks.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Buscar títulos dos quizzes
      const quizIds = [...new Set((logs || []).map(log => log.quiz_id).filter(Boolean))];
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title')
        .in('id', quizIds);

      const quizMap = new Map(quizzes?.map(q => [q.id, q.title]));

      const webhookLogs: WebhookLog[] = (logs || []).map(log => ({
        id: log.id,
        created_at: log.created_at,
        event_type: 'quiz.response.completed',
        payload: {
          quiz_id: log.quiz_id,
          response_id: log.response_id,
        },
        status: log.status_code < 400 ? 'success' : 'failed',
        response: { statusCode: log.status_code, body: log.response_body },
        quiz_id: log.quiz_id,
        quiz_title: log.quiz_id ? quizMap.get(log.quiz_id) : undefined,
      }));

      setLogs(webhookLogs);
    } catch (error) {
      logger.error('Error loading webhook logs:', error);
      toast.error(t('webhookLogs.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    return logs.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [logs, currentPage]);

  const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{t('webhookLogs.title')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('webhookLogs.logsDesc')}
        </p>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('webhookLogs.recentLogs')}</CardTitle>
              <span className="text-sm text-muted-foreground">{logs.length} logs</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">{t('webhookLogs.noLogs')}</p>
                <p className="text-sm mt-2">{t('webhookLogs.noLogsDesc')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium">{log.event_type}</span>
                          {getStatusBadge(log.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {log.quiz_title && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Quiz: <span className="font-medium">{log.quiz_title}</span>
                        </div>
                      )}
                      <div className="text-sm bg-muted/30 rounded p-2 font-mono">
                        {JSON.stringify(log.payload, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages} ({logs.length} logs)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
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
      </div>
    </DashboardLayout>
  );
};

export default WebhookLogs;
