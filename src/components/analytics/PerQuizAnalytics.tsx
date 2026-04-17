import { useState, useMemo, lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Play, CheckCircle2, TrendingUp, Users, Clock, MousePointerClick } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunnelChart } from "./FunnelChart";
import { useFunnelData } from "@/hooks/useFunnelData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PlanFeatureGate } from "@/components/PlanFeatureGate";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useResourceLimits } from "@/hooks/useResourceLimits";
import { PlanLimitBlockedBanner } from "@/components/ui/PlanLimitBlockedBanner";

const AnalyticsLineChart = lazy(() => 
  import("@/components/lazy/AnalyticsChartsBundle").then(m => ({ default: m.AnalyticsLineChart }))
);

interface PerQuizAnalyticsProps {
  quizzes: Array<{ id: string; title: string }>;
  startDate?: string;
  endDate?: string;
  period: string;
}

interface QuizAnalyticsData {
  date: string;
  views: number;
  starts: number;
  completions: number;
}

interface QuizResponse {
  id: string;
  completed_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_whatsapp: string | null;
  lead_status: string | null;
  result_id: string | null;
}

export const PerQuizAnalytics = ({ quizzes, startDate, endDate, period }: PerQuizAnalyticsProps) => {
  const { t } = useTranslation();
  const { allowAdvancedAnalytics, isLoading: planLoading } = usePlanFeatures();
  const { limits: resourceLimits } = useResourceLimits();
  const planLeadLimit = resourceLimits?.leads.isUnlimited
    ? Infinity
    : (resourceLimits?.leads.limit ?? Infinity);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || "");

  // Calculate filter dates
  const filterDates = useMemo(() => {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      start = new Date();
      start.setDate(start.getDate() - daysAgo);
      end = new Date();
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, [startDate, endDate, period]);

  // Fetch analytics for selected quiz
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['quiz-analytics', selectedQuizId, filterDates],
    queryFn: async () => {
      if (!selectedQuizId) return [];

      const { data, error } = await supabase
        .from('quiz_analytics')
        .select('*')
        .eq('quiz_id', selectedQuizId)
        .gte('date', filterDates.start)
        .lte('date', filterDates.end)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as QuizAnalyticsData[];
    },
    enabled: !!selectedQuizId,
  });

  // Fetch recent responses for selected quiz (com bloqueio por limite de plano)
  const { data: responsesPayload, isLoading: responsesLoading } = useQuery({
    queryKey: ['quiz-responses', selectedQuizId, filterDates, planLeadLimit],
    queryFn: async () => {
      if (!selectedQuizId) return { items: [] as QuizResponse[], total: 0 };

      // Quanto buscar: nunca passa de 20 (limite técnico do componente)
      // e nunca passa do limite do plano.
      const fetchLimit = planLeadLimit === Infinity
        ? 20
        : Math.min(20, planLeadLimit);

      const { data, error, count } = await supabase
        .from('quiz_responses')
        .select('id, completed_at, respondent_name, respondent_email, respondent_whatsapp, lead_status, result_id', { count: 'exact' })
        .eq('quiz_id', selectedQuizId)
        .gte('completed_at', filterDates.start)
        .lte('completed_at', filterDates.end + 'T23:59:59')
        .order('completed_at', { ascending: false })
        .limit(fetchLimit);

      if (error) throw error;
      return {
        items: (data as QuizResponse[]) ?? [],
        total: count ?? 0,
      };
    },
    enabled: !!selectedQuizId,
  });

  const responsesData = responsesPayload?.items ?? [];
  const totalResponsesInPeriod = responsesPayload?.total ?? 0;
  const blockedResponsesInList = planLeadLimit === Infinity
    ? 0
    : Math.max(0, totalResponsesInPeriod - planLeadLimit);

  // Funnel data (com bloqueio por limite de plano)
  const { data: funnelResult, isLoading: funnelLoading } = useFunnelData({
    quizId: selectedQuizId,
    startDate: filterDates.start,
    endDate: filterDates.end,
    planLimit: planLeadLimit,
  });
  const funnelSteps = funnelResult?.steps ?? [];
  const blockedSessions = funnelResult?.blockedSessions ?? 0;
  const totalSessions = funnelResult?.totalSessions ?? 0;
  const visibleSessions = funnelResult?.visibleSessions ?? 0;

  // CTA click analytics for funnel quizzes
  const { data: ctaPerformance } = useQuery({
    queryKey: ['quiz-cta-performance', selectedQuizId, filterDates],
    queryFn: async () => {
      if (!selectedQuizId) return [];
      const { data, error } = await supabase
        .from('quiz_cta_click_analytics')
        .select('cta_text, session_id')
        .eq('quiz_id', selectedQuizId)
        .gte('date', filterDates.start)
        .lte('date', filterDates.end);
      if (error) throw error;
      // Aggregate by cta_text
      const counts: Record<string, { clicks: number; sessions: Set<string> }> = {};
      data?.forEach(row => {
        const text = row.cta_text || 'CTA';
        if (!counts[text]) counts[text] = { clicks: 0, sessions: new Set() };
        counts[text].clicks++;
        counts[text].sessions.add(row.session_id);
      });
      return Object.entries(counts)
        .map(([text, { clicks, sessions }]) => ({ text, clicks, uniqueSessions: sessions.size }))
        .sort((a, b) => b.clicks - a.clicks);
    },
    enabled: !!selectedQuizId,
  });

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) {
      return {
        totalViews: 0,
        totalStarts: 0,
        totalCompletions: 0,
        conversionRate: 0,
        avgCompletionTime: 0,
      };
    }

    const totals = analyticsData.reduce(
      (acc, curr) => ({
        totalViews: acc.totalViews + curr.views,
        totalStarts: acc.totalStarts + curr.starts,
        totalCompletions: acc.totalCompletions + curr.completions,
      }),
      { totalViews: 0, totalStarts: 0, totalCompletions: 0 }
    );

    const conversionRate = totals.totalViews > 0
      ? (totals.totalCompletions / totals.totalViews) * 100
      : 0;

    // Calculate avg completion time from analytics
    const avgCompletionTime = analyticsData.reduce((sum, curr) => {
      return sum + (curr as any).avg_completion_time || 0;
    }, 0) / analyticsData.length || 0;

    return {
      ...totals,
      conversionRate,
      avgCompletionTime,
    };
  }, [analyticsData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    return analyticsData.map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      views: item.views,
      starts: item.starts,
      completions: item.completions,
    }));
  }, [analyticsData]);

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getLeadStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "Novo", variant: "default" },
      contacted: { label: "Contatado", variant: "secondary" },
      qualified: { label: "Qualificado", variant: "default" },
      converted: { label: "Convertido", variant: "default" },
      lost: { label: "Perdido", variant: "destructive" },
    };
    const config = statusMap[status || 'new'] || statusMap.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Verificar permissão do plano (after all hooks)
  if (!allowAdvancedAnalytics && !planLoading) {
    return (
      <PlanFeatureGate
        featureName="Analytics Avançado por Quiz"
        featureDescription="Visualize métricas detalhadas de cada quiz: funil de conversão, evolução temporal, tempo médio e respostas recentes. Tome decisões baseadas em dados."
        isAllowed={false}
        isLoading={planLoading}
      >
        <></>
      </PlanFeatureGate>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t('analytics.noQuizzes')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('analytics.selectQuiz')}
          </CardTitle>
          <CardDescription>
            {t('analytics.selectQuizDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder={t('analytics.selectQuizPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {quizzes.map((quiz) => (
                <SelectItem key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedQuizId && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalViews')}</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{summaryMetrics.totalViews.toLocaleString()}</p>
                    )}
                  </div>
                  <Eye className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalStarts')}</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{summaryMetrics.totalStarts.toLocaleString()}</p>
                    )}
                  </div>
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.totalCompletions')}</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{summaryMetrics.totalCompletions.toLocaleString()}</p>
                    )}
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.conversionRate')}</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{summaryMetrics.conversionRate.toFixed(1)}%</p>
                    )}
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.avgTime')}</p>
                    {analyticsLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold">{formatTime(summaryMetrics.avgCompletionTime)}</p>
                    )}
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Evolution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.evolutionChart')}</CardTitle>
              <CardDescription>
                {t('analytics.evolutionChartDescription')} - {selectedQuiz?.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.length > 0 ? (
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <AnalyticsLineChart 
                    data={chartData} 
                    dataKeys={['views', 'starts', 'completions']}
                    colors={['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142, 76%, 36%)']}
                  />
                </Suspense>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t('analytics.noDataForPeriod')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.conversionFunnel')}</CardTitle>
              <CardDescription>
                {t('analytics.funnelDescription')} - {selectedQuiz?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedSessions > 0 && (
                <PlanLimitBlockedBanner
                  blockedCount={blockedSessions}
                  labelKey="sessions"
                  context={`(${visibleSessions}/${totalSessions})`}
                />
              )}
              <FunnelChart data={funnelSteps} loading={funnelLoading} />
            </CardContent>
          </Card>

          {/* CTA Performance - only show when there's CTA data */}
          {ctaPerformance && ctaPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5" />
                  {t('analytics.ctaPerformance', 'Performance dos CTAs')}
                </CardTitle>
                <CardDescription>
                  {t('analytics.ctaPerformanceDesc', 'Ranking de cliques por CTA na última etapa do funil')} - {selectedQuiz?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ctaPerformance.map((cta, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={cta.text}>
                          {cta.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cta.clicks} {t('analytics.clicks', 'cliques')} · {cta.uniqueSessions} {t('analytics.uniqueSessions', 'sessões únicas')}
                          {summaryMetrics.totalViews > 0 && (
                            <span className="ml-1">
                              · {((cta.uniqueSessions / summaryMetrics.totalViews) * 100).toFixed(1)}% CTR
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Responses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('analytics.recentResponses')}
              </CardTitle>
              <CardDescription>
                {t('analytics.recentResponsesDescription')} - {selectedQuiz?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedResponsesInList > 0 && (
                <PlanLimitBlockedBanner
                  blockedCount={blockedResponsesInList}
                  label="respostas"
                  context="nesta lista"
                />
              )}
              {responsesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : responsesData && responsesData.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {responsesData.map((response) => (
                      <Card key={response.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">
                              {response.respondent_name || t('analytics.anonymous')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {response.respondent_email || response.respondent_whatsapp || "-"}
                            </p>
                          </div>
                          {getLeadStatusBadge(response.lead_status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(response.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('analytics.date')}</TableHead>
                          <TableHead>{t('analytics.name')}</TableHead>
                          <TableHead>{t('analytics.email')}</TableHead>
                          <TableHead>{t('analytics.whatsapp')}</TableHead>
                          <TableHead>{t('analytics.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {responsesData.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell>
                              {format(new Date(response.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{response.respondent_name || "-"}</TableCell>
                            <TableCell>{response.respondent_email || "-"}</TableCell>
                            <TableCell>{response.respondent_whatsapp || "-"}</TableCell>
                            <TableCell>{getLeadStatusBadge(response.lead_status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {t('analytics.noResponses')}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
