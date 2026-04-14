import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const EVENT_CATEGORIES: Record<string, { label: string; color: string }> = {
  AccountCreated: { label: "Onboarding", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  SignupStarted: { label: "Onboarding", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  PlanUpgraded: { label: "Conversão", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  QuizShared: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  EditorAbandoned: { label: "Churn", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  LeadExported: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  first_quiz_created: { label: "Criação", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  first_quiz_createdB: { label: "Criação (Modern)", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  quiz_first_published: { label: "Criação", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  quiz_first_publishedB: { label: "Criação (Modern)", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
  quiz_view: { label: "Respondente", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  quiz_start: { label: "Respondente", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  quiz_complete: { label: "Respondente", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  lead_captured: { label: "Respondente", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  quiz_ia_form: { label: "IA - Formulário", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  quiz_ia_pdf: { label: "IA - PDF", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  quiz_ia_edu: { label: "IA - Educacional", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  quiz_created: { label: "Criação", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  quiz_published: { label: "Publicação", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  plan_limit_hit: { label: "Conversão", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  upgrade_clicked: { label: "Conversão", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  crm_viewed: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  first_response_received: { label: "Milestone", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  aha_threshold_reached: { label: "Milestone", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
};

export const GTMEventsDashboard = () => {
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Fetch event counts (24h and 7d)
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["gtm-event-counts"],
    queryFn: async () => {
      const now = new Date();
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [res24, res7] = await Promise.all([
        supabase.from("gtm_event_logs" as any).select("event_name").gte("created_at", h24),
        supabase.from("gtm_event_logs" as any).select("event_name").gte("created_at", d7),
      ]);

      const count = (rows: any[], event: string) => rows?.filter((r: any) => r.event_name === event).length || 0;

      const allEvents = [...new Set([
        ...(res24.data || []).map((r: any) => r.event_name),
        ...(res7.data || []).map((r: any) => r.event_name),
      ])].sort();

      return allEvents.map((event) => ({
        event,
        count24h: count(res24.data || [], event),
        count7d: count(res7.data || [], event),
        category: EVENT_CATEGORIES[event]?.label || "Outro",
        categoryColor: EVENT_CATEGORIES[event]?.color || "bg-muted text-muted-foreground",
      }));
    },
    refetchInterval: 30000,
  });

  // Fetch recent logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["gtm-event-logs", eventFilter],
    queryFn: async () => {
      let query = supabase
        .from("gtm_event_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (eventFilter !== "all") {
        query = query.eq("event_name", eventFilter);
      }

      const { data } = await query;
      return (data || []) as any[];
    },
    refetchInterval: 15000,
  });

  const totalEvents24h = counts?.reduce((sum, c) => sum + c.count24h, 0) || 0;
  const totalEvents7d = counts?.reduce((sum, c) => sum + c.count7d, 0) || 0;
  const uniqueEvents = counts?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eventos (24h)</p>
              <p className="text-2xl font-bold">{totalEvents24h}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Eventos (7d)</p>
              <p className="text-2xl font-bold">{totalEvents7d}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipos de Evento</p>
              <p className="text-2xl font-bold">{uniqueEvents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Counts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contagem por Evento</CardTitle>
        </CardHeader>
        <CardContent>
          {countsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">24h</TableHead>
                  <TableHead className="text-right">7d</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts?.map((row) => (
                  <TableRow key={row.event}>
                    <TableCell className="font-mono text-sm">{row.event}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={row.categoryColor}>{row.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{row.count24h}</TableCell>
                    <TableCell className="text-right">{row.count7d}</TableCell>
                  </TableRow>
                ))}
                {(!counts || counts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum evento registrado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Últimos Disparos</CardTitle>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {counts?.map((c) => (
                <SelectItem key={c.event} value={c.event}>{c.event}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.event_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.user_id ? log.user_id.substring(0, 8) + "…" : "anon"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {JSON.stringify(log.metadata)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GTMEventsDashboard;
