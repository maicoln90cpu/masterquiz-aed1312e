import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

export function BlogCostTracking() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["blog-generation-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_generation_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: postsCount } = useQuery({
    queryKey: ["blog-posts-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("blog_posts")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const stats = useMemo(() => {
    if (!logs) return { totalText: 0, totalImage: 0, totalCost: 0, avgCost: 0, count: 0 };
    const totalText = logs.reduce((sum, l) => sum + (Number(l.text_cost_usd) || 0), 0);
    const totalImage = logs.reduce((sum, l) => sum + (Number(l.image_cost_usd) || 0), 0);
    const totalCost = logs.reduce((sum, l) => sum + (Number(l.total_cost_usd) || 0), 0);
    return {
      totalText,
      totalImage,
      totalCost,
      avgCost: logs.length > 0 ? totalCost / logs.length : 0,
      count: logs.length,
    };
  }, [logs]);

  const chartData = useMemo(() => {
    if (!logs) return [];
    const byMonth: Record<string, { text: number; image: number }> = {};
    logs.forEach((l) => {
      const month = format(startOfMonth(parseISO(l.created_at)), "yyyy-MM");
      if (!byMonth[month]) byMonth[month] = { text: 0, image: 0 };
      byMonth[month].text += Number(l.text_cost_usd) || 0;
      byMonth[month].image += Number(l.image_cost_usd) || 0;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(parseISO(month + "-01"), "MMM/yy", { locale: ptBR }),
        "Texto (USD)": Number(data.text.toFixed(4)),
        "Imagem (USD)": Number(data.image.toFixed(4)),
      }));
  }, [logs]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const cards = [
    { label: "Total Gasto", value: `$${stats.totalCost.toFixed(4)}`, icon: DollarSign, color: "text-success" },
    { label: "Custo Texto (OpenAI)", value: `$${stats.totalText.toFixed(4)}`, icon: FileText, color: "text-info" },
    { label: "Custo Imagem (Gemini)", value: `$${stats.totalImage.toFixed(4)}`, icon: Zap, color: "text-accent" },
    { label: "Custo Médio / Artigo", value: `$${stats.avgCost.toFixed(4)}`, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold">{postsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Gerações IA</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Sucesso</p>
            <p className="text-2xl font-bold">
              {logs ? logs.filter((l) => l.status === "success").length : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Texto (USD)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Imagem (USD)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
