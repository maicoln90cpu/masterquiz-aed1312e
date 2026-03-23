import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, FileText, Sparkles, Mail, TrendingUp, RefreshCw, Brain, Users, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export function UnifiedCostsDashboard() {
  // ========== BLOG COSTS ==========
  const { data: blogLogs, isLoading: blogLoading } = useQuery({
    queryKey: ["unified-costs-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_generation_logs")
        .select("text_cost_usd, image_cost_usd, total_cost_usd, created_at, status, model_used")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ========== QUIZ AI COSTS ==========
  const { data: quizLogs, isLoading: quizLoading, refetch: refetchQuiz } = useQuery({
    queryKey: ["unified-costs-quiz-detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_quiz_generations")
        .select("estimated_cost_usd, total_tokens, prompt_tokens, completion_tokens, created_at, model_used, questions_generated, user_id, generation_month")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ========== EMAIL AI COSTS ==========
  const { data: emailLogs, isLoading: emailLoading, refetch: refetchEmail } = useQuery({
    queryKey: ["unified-costs-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_generation_logs")
        .select("template_type, model_used, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ========== QUIZ AI - Top users ==========
  const { data: topUsers } = useQuery({
    queryKey: ["unified-costs-top-users"],
    queryFn: async () => {
      const { data: generations } = await supabase
        .from("ai_quiz_generations")
        .select("user_id, model_used, questions_generated, total_tokens, estimated_cost_usd, created_at");

      const userStats: Record<string, { generations: number; tokens: number; cost: number; lastUsed: string }> = {};
      generations?.forEach(row => {
        const uid = row.user_id;
        if (!userStats[uid]) userStats[uid] = { generations: 0, tokens: 0, cost: 0, lastUsed: '' };
        userStats[uid].generations++;
        userStats[uid].tokens += row.total_tokens || 0;
        userStats[uid].cost += Number(row.estimated_cost_usd) || 0;
        if (!userStats[uid].lastUsed || (row.created_at || '') > userStats[uid].lastUsed) {
          userStats[uid].lastUsed = row.created_at || '';
        }
      });

      const userIds = Object.keys(userStats);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return Object.entries(userStats)
        .map(([uid, d]) => {
          const p = profileMap.get(uid);
          return {
            name: p?.full_name || p?.email || uid.substring(0, 8) + '...',
            ...d,
            lastUsed: d.lastUsed ? format(new Date(d.lastUsed), 'dd/MM/yy HH:mm') : '-',
          };
        })
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);
    },
  });

  // ========== COMPUTED STATS ==========
  const blogStats = useMemo(() => {
    if (!blogLogs) return { totalText: 0, totalImage: 0, totalCost: 0, count: 0, avgCost: 0 };
    const totalText = blogLogs.reduce((s, l) => s + (Number(l.text_cost_usd) || 0), 0);
    const totalImage = blogLogs.reduce((s, l) => s + (Number(l.image_cost_usd) || 0), 0);
    const totalCost = blogLogs.reduce((s, l) => s + (Number(l.total_cost_usd) || 0), 0);
    return { totalText, totalImage, totalCost, count: blogLogs.length, avgCost: blogLogs.length > 0 ? totalCost / blogLogs.length : 0 };
  }, [blogLogs]);

  const quizStats = useMemo(() => {
    if (!quizLogs) return { totalCost: 0, totalTokens: 0, count: 0, avgCost: 0, totalQuestions: 0, uniqueUsers: 0, monthCost: 0, monthTokens: 0 };
    const totalCost = quizLogs.reduce((s, l) => s + (Number(l.estimated_cost_usd) || 0), 0);
    const totalTokens = quizLogs.reduce((s, l) => s + (Number(l.total_tokens) || 0), 0);
    const totalQuestions = quizLogs.reduce((s, l) => s + (l.questions_generated || 0), 0);
    const uniqueUsers = new Set(quizLogs.map(l => l.user_id)).size;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthLogs = quizLogs.filter(l => (l.generation_month || '').startsWith(currentMonth));
    const monthCost = monthLogs.reduce((s, l) => s + (Number(l.estimated_cost_usd) || 0), 0);
    const monthTokens = monthLogs.reduce((s, l) => s + (Number(l.total_tokens) || 0), 0);
    return { totalCost, totalTokens, count: quizLogs.length, avgCost: quizLogs.length > 0 ? totalCost / quizLogs.length : 0, totalQuestions, uniqueUsers, monthCost, monthTokens };
  }, [quizLogs]);

  const emailStats = useMemo(() => {
    if (!emailLogs) return { totalCost: 0, totalTokens: 0, count: 0, avgCost: 0, byType: [] as { type: string; count: number; tokens: number; cost: number }[] };
    const totalCost = emailLogs.reduce((s, l) => s + (Number(l.estimated_cost_usd) || 0), 0);
    const totalTokens = emailLogs.reduce((s, l) => s + (Number(l.total_tokens) || 0), 0);
    const byTypeMap: Record<string, { count: number; tokens: number; cost: number }> = {};
    emailLogs.forEach(l => {
      const t = l.template_type || 'unknown';
      if (!byTypeMap[t]) byTypeMap[t] = { count: 0, tokens: 0, cost: 0 };
      byTypeMap[t].count++;
      byTypeMap[t].tokens += l.total_tokens || 0;
      byTypeMap[t].cost += Number(l.estimated_cost_usd) || 0;
    });
    const byType = Object.entries(byTypeMap).map(([type, d]) => ({ type, ...d })).sort((a, b) => b.cost - a.cost);
    return { totalCost, totalTokens, count: emailLogs.length, avgCost: emailLogs.length > 0 ? totalCost / emailLogs.length : 0, byType };
  }, [emailLogs]);

  // Model breakdown for quiz
  const modelBreakdown = useMemo(() => {
    if (!quizLogs) return [];
    const counts: Record<string, { count: number; tokens: number; cost: number }> = {};
    quizLogs.forEach(row => {
      const model = (row.model_used || 'unknown').replace('google/', '').replace('openai/', '');
      if (!counts[model]) counts[model] = { count: 0, tokens: 0, cost: 0 };
      counts[model].count++;
      counts[model].tokens += row.total_tokens || 0;
      counts[model].cost += Number(row.estimated_cost_usd) || 0;
    });
    return Object.entries(counts).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.cost - a.cost);
  }, [quizLogs]);

  const totalCost = blogStats.totalCost + quizStats.totalCost + emailStats.totalCost;

  // Monthly chart data (blog + quiz + email stacked)
  const chartData = useMemo(() => {
    const byMonth: Record<string, { blog: number; quiz: number; email: number }> = {};
    blogLogs?.forEach((l) => {
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { blog: 0, quiz: 0, email: 0 };
      byMonth[month].blog += Number(l.total_cost_usd) || 0;
    });
    quizLogs?.forEach((l) => {
      if (!l.created_at) return;
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { blog: 0, quiz: 0, email: 0 };
      byMonth[month].quiz += Number(l.estimated_cost_usd) || 0;
    });
    emailLogs?.forEach((l) => {
      if (!l.created_at) return;
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { blog: 0, quiz: 0, email: 0 };
      byMonth[month].email += Number(l.estimated_cost_usd) || 0;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: format(parseISO(month + "-01"), "MMM/yy", { locale: ptBR }),
        "Blog (USD)": Number(data.blog.toFixed(4)),
        "Quiz IA (USD)": Number(data.quiz.toFixed(4)),
        "Email IA (USD)": Number(data.email.toFixed(4)),
      }));
  }, [blogLogs, quizLogs, emailLogs]);

  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const TEMPLATE_LABELS: Record<string, string> = {
    weekly_tip: 'Dica da Semana',
    success_story: 'Case de Sucesso',
    monthly_summary: 'Resumo Mensal',
    platform_news: 'Novidades',
    blog_digest: 'Digest do Blog',
  };

  if (blogLoading || quizLoading || emailLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Dashboard Unificado de Custos
              </CardTitle>
              <CardDescription>Visão consolidada de todos os custos com IA do sistema</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => { refetchQuiz(); refetchEmail(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ========== SUMMARY CARDS ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={DollarSign} label="Total Gasto" value={`$${totalCost.toFixed(4)}`} color="text-emerald-500" />
        <SummaryCard icon={FileText} label="Blog" value={`$${blogStats.totalCost.toFixed(4)}`} color="text-blue-500" />
        <SummaryCard icon={Sparkles} label="Quiz IA" value={`$${quizStats.totalCost.toFixed(4)}`} color="text-purple-500" />
        <SummaryCard icon={Mail} label="Email IA" value={emailStats.count > 0 ? `$${emailStats.totalCost.toFixed(4)}` : 'Sem dados'} color="text-amber-500" />
      </div>

      {/* ========== QUIZ IA - DETAILED ========== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Quiz IA — Detalhamento Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Custo Total" value={`$${quizStats.totalCost.toFixed(4)}`} />
            <StatItem label="Custo Este Mês" value={`$${quizStats.monthCost.toFixed(4)}`} />
            <StatItem label="Total Tokens" value={formatTokens(quizStats.totalTokens)} />
            <StatItem label="Tokens Este Mês" value={formatTokens(quizStats.monthTokens)} />
            <StatItem label="Total Gerações" value={quizStats.count.toString()} />
            <StatItem label="Perguntas Geradas" value={quizStats.totalQuestions.toLocaleString()} />
            <StatItem label="Custo Médio / Geração" value={`$${quizStats.avgCost.toFixed(4)}`} />
            <StatItem label="Usuários Ativos" value={quizStats.uniqueUsers.toString()} />
          </div>
        </CardContent>
      </Card>

      {/* ========== QUIZ IA - MODEL BREAKDOWN ========== */}
      {modelBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Custo por Modelo (Quiz IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Gerações</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Custo (USD)</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelBreakdown.map((model) => {
                  const totalModelCost = modelBreakdown.reduce((s, m) => s + m.cost, 0);
                  const pct = totalModelCost > 0 ? (model.cost / totalModelCost) * 100 : 0;
                  return (
                    <TableRow key={model.name}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell className="text-right">{model.count}</TableCell>
                      <TableCell className="text-right">{formatTokens(model.tokens)}</TableCell>
                      <TableCell className="text-right font-medium">${model.cost.toFixed(4)}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">{pct.toFixed(1)}%</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========== TOP USERS ========== */}
      {topUsers && topUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Top 10 Usuários por Custo (Quiz IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Gerações</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Custo (USD)</TableHead>
                  <TableHead>Último uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Badge variant={idx === 0 ? "default" : idx < 3 ? "secondary" : "outline"}>{idx + 1}º</Badge></TableCell>
                    <TableCell className="text-sm font-medium">{user.name}</TableCell>
                    <TableCell className="text-right">{user.generations}</TableCell>
                    <TableCell className="text-right">{formatTokens(user.tokens)}</TableCell>
                    <TableCell className="text-right font-medium">${user.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========== BLOG BREAKDOWN ========== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Blog — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Texto (OpenAI)" value={`$${blogStats.totalText.toFixed(4)}`} />
            <StatItem label="Imagem (Gemini)" value={`$${blogStats.totalImage.toFixed(4)}`} />
            <StatItem label="Custo Médio / Artigo" value={`$${blogStats.avgCost.toFixed(4)}`} />
            <StatItem label="Total Gerações" value={blogStats.count.toString()} />
          </div>
          {blogStats.count === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong>Dados históricos indisponíveis:</strong> Os artigos gerados antes da implantação do tracking de custos não possuem registros de log. 
                Novos artigos gerados a partir de agora terão seus custos registrados automaticamente.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ========== EMAIL AI BREAKDOWN ========== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-500" />
            Email IA — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailStats.count > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem label="Custo Total" value={`$${emailStats.totalCost.toFixed(4)}`} />
                <StatItem label="Total Gerações" value={emailStats.count.toString()} />
                <StatItem label="Total Tokens" value={formatTokens(emailStats.totalTokens)} />
                <StatItem label="Custo Médio / Email" value={`$${emailStats.avgCost.toFixed(6)}`} />
              </div>
              {emailStats.byType.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Template</TableHead>
                      <TableHead className="text-right">Gerações</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailStats.byType.map((row) => (
                      <TableRow key={row.type}>
                        <TableCell className="font-medium">{TEMPLATE_LABELS[row.type] || row.type}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right">{formatTokens(row.tokens)}</TableCell>
                        <TableCell className="text-right font-medium">${row.cost.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm text-muted-foreground">
                Ainda não há registros de custos de IA para emails. Os custos serão rastreados automaticamente a partir das próximas gerações de conteúdo dinâmico (dica semanal, case de sucesso, resumo mensal, novidades).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ========== MONTHLY CHART ========== */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Custos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Blog (USD)" stackId="costs" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Quiz IA (USD)" stackId="costs" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Email IA (USD)" stackId="costs" fill="hsl(var(--chart-3, 45 93% 47%))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sobre os custos:</strong> Os valores são estimativas baseadas nos tokens reportados pela API e nas tabelas de preço públicas dos modelos. 
          Gerações anteriores ao tracking de tokens mostrarão $0.00.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
