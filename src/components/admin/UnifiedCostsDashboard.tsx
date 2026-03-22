import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, Sparkles, Mail, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UnifiedCostsDashboard() {
  const { data: blogLogs, isLoading: blogLoading } = useQuery({
    queryKey: ["unified-costs-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_generation_logs")
        .select("text_cost_usd, image_cost_usd, total_cost_usd, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: quizLogs, isLoading: quizLoading } = useQuery({
    queryKey: ["unified-costs-quiz"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_quiz_generations")
        .select("estimated_cost_usd, total_tokens, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const blogStats = useMemo(() => {
    if (!blogLogs) return { totalText: 0, totalImage: 0, totalCost: 0, count: 0, avgCost: 0 };
    const totalText = blogLogs.reduce((s, l) => s + (Number(l.text_cost_usd) || 0), 0);
    const totalImage = blogLogs.reduce((s, l) => s + (Number(l.image_cost_usd) || 0), 0);
    const totalCost = blogLogs.reduce((s, l) => s + (Number(l.total_cost_usd) || 0), 0);
    return { totalText, totalImage, totalCost, count: blogLogs.length, avgCost: blogLogs.length > 0 ? totalCost / blogLogs.length : 0 };
  }, [blogLogs]);

  const quizStats = useMemo(() => {
    if (!quizLogs) return { totalCost: 0, totalTokens: 0, count: 0, avgCost: 0 };
    const totalCost = quizLogs.reduce((s, l) => s + (Number(l.estimated_cost_usd) || 0), 0);
    const totalTokens = quizLogs.reduce((s, l) => s + (Number(l.total_tokens) || 0), 0);
    return { totalCost, totalTokens, count: quizLogs.length, avgCost: quizLogs.length > 0 ? totalCost / quizLogs.length : 0 };
  }, [quizLogs]);

  const totalCost = blogStats.totalCost + quizStats.totalCost;

  const chartData = useMemo(() => {
    const byMonth: Record<string, { blog: number; quiz: number }> = {};
    blogLogs?.forEach((l) => {
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { blog: 0, quiz: 0 };
      byMonth[month].blog += Number(l.total_cost_usd) || 0;
    });
    quizLogs?.forEach((l) => {
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { blog: 0, quiz: 0 };
      byMonth[month].quiz += Number(l.estimated_cost_usd) || 0;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(parseISO(month + "-01"), "MMM/yy", { locale: ptBR }),
        "Blog (USD)": Number(data.blog.toFixed(4)),
        "Quiz IA (USD)": Number(data.quiz.toFixed(4)),
      }));
  }, [blogLogs, quizLogs]);

  if (blogLoading || quizLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const summaryCards = [
    { label: "Total Gasto", value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Blog", value: `$${blogStats.totalCost.toFixed(4)}`, icon: FileText, color: "text-blue-500" },
    { label: "Quiz IA", value: `$${quizStats.totalCost.toFixed(4)}`, icon: Sparkles, color: "text-purple-500" },
    { label: "Email", value: "Sem dados", icon: Mail, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <c.icon className={`h-8 w-8 ${c.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blog breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Blog — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Texto (OpenAI)</p>
              <p className="font-bold">${blogStats.totalText.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Imagem (Gemini)</p>
              <p className="font-bold">${blogStats.totalImage.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Médio / Artigo</p>
              <p className="font-bold">${blogStats.avgCost.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gerações</p>
              <p className="font-bold">{blogStats.count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz IA breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Quiz IA — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="font-bold">${quizStats.totalCost.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens Usados</p>
              <p className="font-bold">{quizStats.totalTokens.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Médio / Geração</p>
              <p className="font-bold">${quizStats.avgCost.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gerações</p>
              <p className="font-bold">{quizStats.count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-500" />
            Email — Detalhamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-sm text-muted-foreground">
              O tracking de custos de email ainda não está implementado. 
              Quando disponível, os custos de envio (E-goi) aparecerão aqui.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Monthly stacked chart */}
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
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Blog (USD)" stackId="costs" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Quiz IA (USD)" stackId="costs" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
