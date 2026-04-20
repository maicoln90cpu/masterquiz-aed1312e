import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, TrendingUp, ChevronLeft, ChevronRight, MousePointerClick } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  order_number: number;
  blocks?: any;
}

/** Extract display title from blocks (like heatmap does), fallback to question_text */
const getQuestionDisplayTitle = (q: Question): string => {
  if (q.blocks && Array.isArray(q.blocks)) {
    const questionBlock = q.blocks.find((b: any) => b.type === 'question');
    if (questionBlock?.content || questionBlock?.questionText) {
      const raw = questionBlock.questionText || questionBlock.content || '';
      return raw.replace(/<[^>]*>/g, '').trim() || q.question_text;
    }
  }
  return q.question_text;
};

interface QuizMetrics {
  visitors: number;
  leads: number;
  conversionRate: number;
}

interface CtaClickSummary {
  cta_text: string;
  clicks: number;
}

interface CtaClickData {
  cta_text: string | null;
  cta_url: string;
}

interface ResponsesSpreadsheetProps {
  quizId: string;
}

const ITEMS_PER_PAGE = 50;

const formatAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '-';
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') return JSON.stringify(answer);
  const str = String(answer);
  return str.length > 40 ? str.slice(0, 40) + '...' : str;
};

export function ResponsesSpreadsheet({ quizId }: ResponsesSpreadsheetProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<QuizMetrics | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stepRetention, setStepRetention] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [ctaSummary, setCtaSummary] = useState<CtaClickSummary[]>([]);
  const [lastStepCtaSessions, setLastStepCtaSessions] = useState(0);
  const [responseCtaMap, setResponseCtaMap] = useState<Record<string, CtaClickData>>({});

  useEffect(() => {
    loadSpreadsheetData();
  }, [quizId, currentPage]);

  const loadSpreadsheetData = async () => {
    setLoading(true);
    try {
      // 1. Buscar perguntas do quiz
      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('id, question_text, order_number, blocks')
        .eq('quiz_id', quizId)
        .order('order_number');
      
      const qs = (questionsData || []) as Question[];
      setQuestions(qs);

      // 2. Buscar métricas de funil (retenção por step)
      const { data: funnelData } = await supabase
        .from('quiz_step_analytics')
        .select('step_number, session_id')
        .eq('quiz_id', quizId);
      
      // Calcular sessões únicas por step
      const stepSessions: Record<number, Set<string>> = {};
      funnelData?.forEach(row => {
        if (!stepSessions[row.step_number]) {
          stepSessions[row.step_number] = new Set();
        }
        stepSessions[row.step_number].add(row.session_id);
      });
      
      const stepCounts: Record<number, number> = {};
      Object.entries(stepSessions).forEach(([step, sessions]) => {
        stepCounts[Number(step)] = sessions.size;
      });
      
      const maxCount = stepCounts[0] || Math.max(...Object.values(stepCounts), 1);

      // 3. Buscar cliques CTA da última etapa (quiz_cta_click_analytics)
      const { data: ctaData } = await supabase
        .from('quiz_cta_click_analytics')
        .select('session_id, cta_text')
        .eq('quiz_id', quizId);

      // Sessões únicas com clique CTA
      const ctaSessionSet = new Set<string>();
      const ctaTextCounts: Record<string, number> = {};
      ctaData?.forEach(row => {
        ctaSessionSet.add(row.session_id);
        const text = row.cta_text || 'CTA';
        ctaTextCounts[text] = (ctaTextCounts[text] || 0) + 1;
      });
      setLastStepCtaSessions(ctaSessionSet.size);
      setCtaSummary(
        Object.entries(ctaTextCounts)
          .map(([cta_text, clicks]) => ({ cta_text, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
      );

      // Calcular retenção — agora usando order_number diretamente como step_number
      // O tracking grava step_number = order_number da pergunta (0-indexed)
      // Para a última etapa, complementar com CTA clicks
      const lastStepNumber = qs.length > 0 ? qs[qs.length - 1].order_number : -1;
      
      const retention: Record<number, number> = {};
      Object.entries(stepCounts).forEach(([step, count]) => {
        retention[Number(step)] = (count / maxCount) * 100;
      });

      // Se última etapa tem CTA clicks mas não tem step analytics, usar CTA clicks
      if (lastStepNumber >= 0 && ctaSessionSet.size > 0) {
        // Merge: step analytics sessions + CTA click sessions for last step
        const lastStepSessions = stepSessions[lastStepNumber] || new Set<string>();
        ctaSessionSet.forEach(s => lastStepSessions.add(s));
        const mergedCount = lastStepSessions.size;
        retention[lastStepNumber] = (mergedCount / maxCount) * 100;
      }

      setStepRetention(retention);

      // 4. Buscar respostas com paginação (select específico)
      const { data: responsesData, count } = await supabase
        .from('quiz_responses')
        .select('id, completed_at, respondent_name, respondent_email, answers, session_id', { count: 'exact' })
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      setResponses(responsesData || []);
      setTotalCount(count || 0);

      // 4b. Buscar CTAs clicados por session_id para mapear nas respostas
      const sessionIds = (responsesData || [])
        .map(r => r.session_id)
        .filter(Boolean) as string[];
      
      if (sessionIds.length > 0) {
        const { data: ctaClicks } = await supabase
          .from('quiz_cta_click_analytics')
          .select('session_id, cta_text, cta_url')
          .eq('quiz_id', quizId)
          .in('session_id', sessionIds);
        
        const ctaMap: Record<string, CtaClickData> = {};
        ctaClicks?.forEach(click => {
          if (!ctaMap[click.session_id]) {
            ctaMap[click.session_id] = { cta_text: click.cta_text, cta_url: click.cta_url };
          }
        });
        setResponseCtaMap(ctaMap);
      } else {
        setResponseCtaMap({});
      }
      setTotalCount(count || 0);

      // 5. Calcular métricas gerais
      const views = maxCount;
      const completions = count || 0;
      setMetrics({
        visitors: views,
        leads: completions,
        conversionRate: views > 0 ? (completions / views * 100) : 0
      });

    } catch (error) {
      logger.error('Error loading spreadsheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColumnColor = (orderNumber: number) => {
    // Agora usa order_number diretamente (sem +1)
    const ret = stepRetention[orderNumber] || 0;
    if (ret >= 70) return 'bg-green-100/50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    if (ret >= 40) return 'bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    return 'bg-red-100/50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
  };

  const getRetentionForQuestion = (orderNumber: number) => {
    return stepRetention[orderNumber] || 0;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{metrics?.visitors || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {t('responses.spreadsheet.visitors', 'Visitantes')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{metrics?.leads || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {t('responses.spreadsheet.leadsAcquired', 'Leads Capturados')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{(metrics?.conversionRate || 0).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">
                  {t('responses.spreadsheet.conversionRate', 'Taxa de Conversão')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Performance (última etapa) */}
      {ctaSummary.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MousePointerClick className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">
                {t('responses.spreadsheet.ctaPerformance', 'Performance dos CTAs (Última Etapa)')}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {lastStepCtaSessions} {t('responses.spreadsheet.uniqueClicks', 'cliques únicos')}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ctaSummary.map((cta, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={cta.cta_text}>
                      {cta.cta_text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cta.clicks} {t('responses.spreadsheet.clicks', 'cliques')}
                      {metrics && metrics.visitors > 0 && (
                        <span className="ml-1">
                          ({((cta.clicks / metrics.visitors) * 100).toFixed(1)}% CTR)
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

      {/* Tabela Planilha */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">
                    {t('responses.date', 'Data')}
                  </TableHead>
                  <TableHead className="sticky left-[100px] bg-background z-10 min-w-[120px]">
                    {t('responses.name', 'Nome')}
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    {t('responses.email', 'Email')}
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    {t('responses.spreadsheet.ctaClicked', 'CTA Clicado')}
                  </TableHead>
                  {questions.map((q, idx) => (
                    <TableHead 
                      key={q.id} 
                      className={cn("min-w-[150px] text-center border-x", getColumnColor(q.order_number))}
                      title={q.question_text}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold">P{idx + 1}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[130px]" title={getQuestionDisplayTitle(q)}>
                          {getQuestionDisplayTitle(q).slice(0, 25)}{getQuestionDisplayTitle(q).length > 25 ? '...' : ''}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {getRetentionForQuestion(q.order_number).toFixed(0)}%
                        </Badge>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4 + questions.length} className="text-center py-8 text-muted-foreground">
                      {t('responses.noResponses', 'Nenhuma resposta encontrada')}
                    </TableCell>
                  </TableRow>
                ) : (
                  responses.map(response => (
                    <TableRow key={response.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {format(new Date(response.completed_at), 'dd/MM/yy')}
                      </TableCell>
                      <TableCell className="sticky left-[100px] bg-background">
                        {response.respondent_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {response.respondent_email || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {response.session_id && responseCtaMap[response.session_id] ? (
                          <Badge variant="secondary" className="text-xs" title={responseCtaMap[response.session_id].cta_url}>
                            {responseCtaMap[response.session_id].cta_text || 'CTA'}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      {questions.map(q => (
                        <TableCell 
                          key={q.id} 
                          className={cn("text-center text-sm border-x", getColumnColor(q.order_number))}
                          title={String(response.answers?.[q.id] || '')}
                        >
                          {formatAnswer(response.answers?.[q.id])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-green-100/50 dark:bg-green-900/20 border-green-300 dark:border-green-700" />
          <span className="text-foreground">{t('responses.spreadsheet.legendHigh', '> 70% chegaram')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700" />
          <span className="text-foreground">{t('responses.spreadsheet.legendMedium', '40-70% chegaram')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border bg-red-100/50 dark:bg-red-900/20 border-red-300 dark:border-red-700" />
          <span className="text-foreground">{t('responses.spreadsheet.legendLow', '< 40% chegaram')}</span>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.previous', 'Anterior')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('responses.pageOf', 'Página {{current}} de {{total}}', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next', 'Próxima')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
