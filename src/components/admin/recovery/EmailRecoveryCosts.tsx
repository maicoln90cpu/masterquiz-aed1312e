import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Mail, TrendingDown, Wallet, PieChart, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Constantes de custo baseadas na recarga real
const TOTAL_RECHARGE_BRL = 190;
const TOTAL_EMAILS_PURCHASED = 40533;
const COST_PER_EMAIL_BRL = TOTAL_RECHARGE_BRL / TOTAL_EMAILS_PURCHASED; // ~R$0.00469

const formatBRL = (value: number, decimals = 2) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const CATEGORY_LABELS: Record<string, string> = {
  welcome: "Boas-vindas",
  recovery: "Recuperação",
  reactivation: "Reativação",
  tutorial: "Tutorial",
  milestone: "Marco/Conquista",
  upgrade: "Upgrade",
  engagement: "Engajamento",
  feedback: "Feedback",
  newsletter: "Newsletter",
  blog_digest: "Blog Digest",
  weekly_tip: "Dica Semanal",
  success_story: "Caso de Sucesso",
  monthly_summary: "Resumo Mensal",
  platform_news: "Novidades",
};

const CATEGORY_COLORS: Record<string, string> = {
  welcome: "#22c55e",
  recovery: "#ef4444",
  reactivation: "#f97316",
  tutorial: "#3b82f6",
  milestone: "#a855f7",
  upgrade: "#eab308",
  engagement: "#06b6d4",
  feedback: "#ec4899",
  newsletter: "#6366f1",
  blog_digest: "#14b8a6",
  weekly_tip: "#8b5cf6",
  success_story: "#f59e0b",
  monthly_summary: "#10b981",
  platform_news: "#6366f1",
};

export function EmailRecoveryCosts() {
  // Buscar apenas contatos com status "sent" (enviados efetivamente)
  // opened/clicked são subsequentes a sent, contá-los duplicaria
  const { data: contacts, isLoading } = useQuery({
    queryKey: ["email-recovery-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_recovery_contacts")
        .select("id, status, template_id, sent_at, created_at")
        .not("sent_at", "is", null);
      if (error) throw error;
      // Deduplicar por id (cada registro = 1 envio)
      return data || [];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["email-recovery-templates-for-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_recovery_templates")
        .select("id, name, category");
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalSent = contacts?.length || 0;
  const totalCost = totalSent * COST_PER_EMAIL_BRL;
  const remainingEmails = TOTAL_EMAILS_PURCHASED - totalSent;
  const remainingBalance = remainingEmails * COST_PER_EMAIL_BRL;
  const usagePercent = (totalSent / TOTAL_EMAILS_PURCHASED) * 100;

  // Agrupar por categoria via template
  const templateMap = new Map(templates?.map((t) => [t.id, t]) || []);
  const categoryStats: Record<string, { count: number; templateNames: Set<string> }> = {};

  contacts?.forEach((c) => {
    const template = c.template_id ? templateMap.get(c.template_id) : null;
    const category = template?.category || "outros";
    if (!categoryStats[category]) {
      categoryStats[category] = { count: 0, templateNames: new Set() };
    }
    categoryStats[category].count++;
    if (template?.name) categoryStats[category].templateNames.add(template.name);
  });

  const categoryData = Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      count: stats.count,
      cost: stats.count * COST_PER_EMAIL_BRL,
      percent: totalSent > 0 ? (stats.count / totalSent) * 100 : 0,
      color: CATEGORY_COLORS[category] || "#94a3b8",
      templates: Array.from(stats.templateNames),
    }))
    .sort((a, b) => b.count - a.count);

  // Dados por template individual
  const templateStats: Record<string, { name: string; category: string; count: number }> = {};
  contacts?.forEach((c) => {
    const template = c.template_id ? templateMap.get(c.template_id) : null;
    const key = c.template_id || "sem-template";
    if (!templateStats[key]) {
      templateStats[key] = {
        name: template?.name || "Sem template",
        category: template?.category || "outros",
        count: 0,
      };
    }
    templateStats[key].count++;
  });

  const templateData = Object.values(templateStats).sort((a, b) => b.count - a.count);

  // Dados mensais
  const monthlyStats: Record<string, number> = {};
  contacts?.forEach((c) => {
    const date = c.sent_at || c.created_at;
    if (date) {
      const month = date.substring(0, 7);
      monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    }
  });

  const monthlyData = Object.entries(monthlyStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      emails: count,
      custo: count * COST_PER_EMAIL_BRL,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custos de Email Transacional</h3>
          <p className="text-sm text-muted-foreground">
            Base: R$ {formatBRL(TOTAL_RECHARGE_BRL)} = {TOTAL_EMAILS_PURCHASED.toLocaleString("pt-BR")} emails (R$ {formatBRL(COST_PER_EMAIL_BRL, 5)}/email)
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          E-goi Slingshot API
        </Badge>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground">
              de {TOTAL_EMAILS_PURCHASED.toLocaleString("pt-BR")} disponíveis ({formatBRL(usagePercent, 1)}%)
            </p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: usagePercent > 80 ? "#ef4444" : usagePercent > 50 ? "#f97316" : "#22c55e",
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {formatBRL(totalCost)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              de R$ {formatBRL(TOTAL_RECHARGE_BRL)} investidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Restante</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {formatBRL(remainingBalance)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {remainingEmails.toLocaleString("pt-BR")} emails restantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Custo por Email</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatBRL(COST_PER_EMAIL_BRL, 5)}
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ US$ {(COST_PER_EMAIL_BRL / 5.5).toFixed(6)} por email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico mensal + Pizza categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Custo Mensal (R$)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `R$${formatBRL(v)}`} />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${formatBRL(value, 4)}`, "Custo"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) => `${label} (${percent.toFixed(0)}%)`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} emails (R$ ${formatBRL(value * COST_PER_EMAIL_BRL, 4)})`, name]} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Custo por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categoryData.map((cat) => (
              <div
                key={cat.category}
                className="border rounded-lg p-3 space-y-1"
                style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatBRL(cat.percent, 1)}%
                  </Badge>
                </div>
                <div className="text-lg font-bold">{cat.count.toLocaleString("pt-BR")} emails</div>
                <div className="text-sm text-muted-foreground">
                  R$ {formatBRL(cat.cost, 4)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela detalhada por template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Detalhamento por Template</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Enviados</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateData.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[t.category] || t.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{t.count.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    R$ {formatBRL(COST_PER_EMAIL_BRL, 5)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {formatBRL(t.count * COST_PER_EMAIL_BRL, 4)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {totalSent > 0 ? formatBRL((t.count / totalSent) * 100, 1) : "0,0"}%
                  </TableCell>
                </TableRow>
              ))}
              {templateData.length > 0 && (
                <TableRow className="border-t-2 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell />
                  <TableCell className="text-right">{totalSent.toLocaleString("pt-BR")}</TableCell>
                  <TableCell />
                  <TableCell className="text-right text-destructive">
                    R$ {formatBRL(totalCost, 4)}
                  </TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
