/**
 * AIFeedbackDashboard — Onda 2
 *
 * Painel admin que agrega o feedback dos usuários sobre os quizzes gerados pela IA.
 * Cruza nota média, distribuição por modo, modelo e quantidade de perguntas.
 * Rota: Admin → Conteúdo → IA → aba "Feedback".
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Star, MessageSquare, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";

interface FeedbackRow {
  id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  would_use_as_is: boolean | null;
  quiz_mode: string | null;
  model_used: string | null;
  questions_count: number | null;
  created_at: string;
  user_id: string;
}

const TAG_LABELS: Record<string, string> = {
  questions_made_sense: "Perguntas faziam sentido",
  funnel_well_distributed: "Funil bem distribuído",
  will_use_as_is: "Vai usar como está",
  will_edit_a_lot: "Vai editar bastante",
};

const MODE_LABELS: Record<string, string> = {
  form: "Formulário",
  pdf: "PDF",
  educational: "Educacional",
  traffic: "Tráfego",
};

export const AIFeedbackDashboard = () => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["admin-ai-feedback"],
    queryFn: async (): Promise<FeedbackRow[]> => {
      const { data, error } = await supabase
        .from("ai_quiz_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as FeedbackRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const rows = feedback || [];
  const total = rows.length;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback do Quiz IA
          </CardTitle>
          <CardDescription>
            Avaliações dos usuários sobre os quizzes gerados pela IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">
            Ainda não há feedback registrado. Aguarde os usuários gerarem quizzes
            via IA e responderem o card de avaliação.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Métricas agregadas
  const avgRating = rows.reduce((s, r) => s + r.rating, 0) / total;
  const uniqueUsers = new Set(rows.map(r => r.user_id)).size;
  const useAsIsCount = rows.filter(r => r.would_use_as_is).length;
  const useAsIsPct = ((useAsIsCount / total) * 100).toFixed(0);

  // Distribuição por nota
  const ratingDistribution = [1, 2, 3, 4, 5].map(n => ({
    rating: `${n}★`,
    count: rows.filter(r => r.rating === n).length,
  }));

  // Média por modo
  const byMode = Object.entries(
    rows.reduce((acc, r) => {
      const k = r.quiz_mode || "desconhecido";
      if (!acc[k]) acc[k] = { sum: 0, count: 0 };
      acc[k].sum += r.rating;
      acc[k].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>),
  ).map(([mode, v]) => ({
    mode: MODE_LABELS[mode] || mode,
    avg: Number((v.sum / v.count).toFixed(2)),
    count: v.count,
  }));

  // Média por modelo
  const byModel = Object.entries(
    rows.reduce((acc, r) => {
      const k = r.model_used || "desconhecido";
      if (!acc[k]) acc[k] = { sum: 0, count: 0 };
      acc[k].sum += r.rating;
      acc[k].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>),
  ).map(([model, v]) => ({
    model: model.length > 25 ? model.slice(0, 22) + "…" : model,
    avg: Number((v.sum / v.count).toFixed(2)),
    count: v.count,
  }));

  // Distribuição de tags
  const tagCounts: Record<string, number> = {};
  rows.forEach(r => {
    (r.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Star className="h-3 w-3" /> Nota média
            </CardDescription>
            <CardTitle className="text-3xl">{avgRating.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Total avaliações
            </CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Usuários únicos
            </CardDescription>
            <CardTitle className="text-3xl">{uniqueUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Usaria como está
            </CardDescription>
            <CardTitle className="text-3xl">{useAsIsPct}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Distribuição por nota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de notas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {ratingDistribution.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      i + 1 >= 4
                        ? "hsl(var(--primary))"
                        : i + 1 === 3
                        ? "hsl(var(--muted-foreground))"
                        : "hsl(var(--destructive))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Por modo e por modelo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nota média por modo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modo</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byMode.map(m => (
                  <TableRow key={m.mode}>
                    <TableCell>{m.mode}</TableCell>
                    <TableCell className="text-right font-semibold">{m.avg.toFixed(2)} ★</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nota média por modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">N</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byModel.map(m => (
                  <TableRow key={m.model}>
                    <TableCell className="text-xs">{m.model}</TableCell>
                    <TableCell className="text-right font-semibold">{m.avg.toFixed(2)} ★</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tags mais marcadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tagCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, count]) => (
                <Badge key={tag} variant="secondary">
                  {TAG_LABELS[tag] || tag} <span className="ml-1 opacity-70">({count})</span>
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Últimos comentários abertos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos comentários</CardTitle>
          <CardDescription>50 mais recentes com texto livre</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nota</TableHead>
                <TableHead className="w-28">Modo</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead className="w-32 text-right">Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows
                .filter(r => r.comment && r.comment.trim().length > 0)
                .slice(0, 50)
                .map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={r.rating >= 4 ? "default" : r.rating === 3 ? "secondary" : "destructive"}>
                        {r.rating} ★
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{MODE_LABELS[r.quiz_mode || ""] || r.quiz_mode}</TableCell>
                    <TableCell className="text-sm">{r.comment}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {rows.filter(r => r.comment && r.comment.trim().length > 0).length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum comentário aberto registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};