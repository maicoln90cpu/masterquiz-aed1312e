import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3, Clock, TrendingUp, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

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
  express_first_published: { label: "Express", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  express_started: { label: "Onboarding", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  paywall_viewed: { label: "Conversão", color: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" },
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
  analytics_viewed: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  first_response_received: { label: "Milestone", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  first_lead_received: { label: "Milestone", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  aha_threshold_reached: { label: "Milestone", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  objective_selected: { label: "Onboarding", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  cta_click: { label: "Landing", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  header_nav_click: { label: "Landing", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  header_login_click: { label: "Landing", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  pricing_cta_click: { label: "Conversão", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  template_click: { label: "Landing", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
  web_vitals: { label: "Performance", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
  editor_session_end: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  integration_connected: { label: "Engajamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  quiz_duplicated: { label: "Criação", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  ai_generation_used: { label: "IA - Unificado", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
};

// Extract unique categories for filter
const UNIQUE_CATEGORIES = [...new Set(Object.values(EVENT_CATEGORIES).map(c => c.label))].sort();

type EventRow = {
  event: string;
  count24h: number;
  count7d: number;
  category: string;
  categoryColor: string;
};

type IntegrationMap = Record<string, { is_integrated: boolean; gtm_event_name: string }>;

export const GTMEventsDashboard = () => {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [firingFilter, setFiringFilter] = useState<string>("all"); // "all" | "fired" | "never"
  const [localGtmNames, setLocalGtmNames] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch integration status
  const { data: integrations } = useQuery({
    queryKey: ["gtm-event-integrations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gtm_event_integrations" as any)
        .select("event_name, is_integrated, gtm_event_name");
      const map: IntegrationMap = {};
      (data || []).forEach((r: any) => {
        map[r.event_name] = {
          is_integrated: r.is_integrated || false,
          gtm_event_name: r.gtm_event_name || "",
        };
      });
      return map;
    },
  });

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async (payload: { event_name: string; is_integrated?: boolean; gtm_event_name?: string }) => {
      const existing = integrations?.[payload.event_name];
      const row = {
        event_name: payload.event_name,
        is_integrated: payload.is_integrated ?? existing?.is_integrated ?? false,
        gtm_event_name: payload.gtm_event_name ?? existing?.gtm_event_name ?? "",
      };
      await supabase.from("gtm_event_integrations" as any).upsert(row, { onConflict: "event_name" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtm-event-integrations"] });
    },
  });

  const handleToggleIntegrated = useCallback((eventName: string, checked: boolean) => {
    upsertMutation.mutate({ event_name: eventName, is_integrated: checked });
  }, [upsertMutation]);

  const handleGtmNameBlur = useCallback((eventName: string) => {
    const value = localGtmNames[eventName];
    if (value !== undefined) {
      upsertMutation.mutate({ event_name: eventName, gtm_event_name: value });
    }
  }, [localGtmNames, upsertMutation]);

  // Fetch event counts (24h and 7d) — merge with EVENT_CATEGORIES
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

      // Merge: all registered events + any from logs not in EVENT_CATEGORIES
      const allEventNames = new Set(Object.keys(EVENT_CATEGORIES));
      (res24.data || []).forEach((r: any) => allEventNames.add(r.event_name));
      (res7.data || []).forEach((r: any) => allEventNames.add(r.event_name));

      return [...allEventNames].sort().map((event): EventRow => ({
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
  const pendingCount = counts?.filter((row) => !integrations?.[row.event]?.is_integrated).length || 0;

  // Apply all filters
  const filteredCounts = useMemo(() => {
    let result = counts || [];
    if (showOnlyPending) {
      result = result.filter((row) => !integrations?.[row.event]?.is_integrated);
    }
    if (categoryFilter !== "all") {
      result = result.filter((row) => row.category === categoryFilter);
    }
    if (firingFilter === "fired") {
      result = result.filter((row) => row.count7d > 0);
    } else if (firingFilter === "never") {
      result = result.filter((row) => row.count7d === 0);
    }
    return result;
  }, [counts, showOnlyPending, categoryFilter, firingFilter, integrations]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Filter className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes GTM</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Counts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg">Contagem por Evento</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {UNIQUE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={firingFilter} onValueChange={setFiringFilter}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Status disparo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="fired">Com disparos (7d)</SelectItem>
                  <SelectItem value="never">Sem disparos (7d)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyPending ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                className="gap-2 h-9"
              >
                <Filter className="h-4 w-4" />
                {showOnlyPending ? `Pendentes (${pendingCount})` : "Não integrados"}
              </Button>
            </div>
          </div>
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
                  <TableHead className="text-center w-[80px]">No GTM</TableHead>
                  <TableHead className="w-[200px]">Nome no GTM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCounts.map((row) => {
                  const integration = integrations?.[row.event];
                  const isIntegrated = integration?.is_integrated || false;
                  const gtmName = localGtmNames[row.event] ?? integration?.gtm_event_name ?? "";
                  const hasFired = row.count7d > 0;

                  return (
                    <TableRow key={row.event} className={isIntegrated ? "opacity-60" : ""}>
                      <TableCell className="font-mono text-sm">
                        {row.event}
                        {!hasFired && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-muted text-muted-foreground">
                            sem disparos
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={row.categoryColor}>{row.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{row.count24h}</TableCell>
                      <TableCell className="text-right">{row.count7d}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isIntegrated}
                          onCheckedChange={(checked) => handleToggleIntegrated(row.event, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="ex: signup_complete"
                          className="h-8 text-xs"
                          value={gtmName}
                          onChange={(e) => setLocalGtmNames((prev) => ({ ...prev, [row.event]: e.target.value }))}
                          onBlur={() => handleGtmNameBlur(row.event)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {showOnlyPending ? "Todos os eventos já foram integrados! 🎉" : "Nenhum evento encontrado com os filtros aplicados"}
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
