import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, MailOpen, MousePointerClick, AlertTriangle, RefreshCw, Mail, TrendingUp, Trophy, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EmailContact {
  id: string;
  email: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  days_inactive_at_contact: number | null;
  user_plan_at_contact: string | null;
  retry_count: number | null;
  created_at: string | null;
  template_id: string | null;
  ab_variant: string | null;
  email_recovery_templates: {
    name: string;
    category: string;
    subject: string | null;
    subject_b: string | null;
  } | null;
}

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  subject: string | null;
  subject_b: string | null;
}

// Min sample size per variant to declare a winner
const MIN_SAMPLE_FOR_WINNER = 100;

// Period filter (days). 0 = all-time.
type PeriodKey = '7' | '30' | '90' | '0';
const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7': 'Últimos 7 dias',
  '30': 'Últimos 30 dias',
  '90': 'Últimos 90 dias',
  '0': 'Todo o período',
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  opened: 'bg-blue-100 text-blue-700',
  clicked: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  welcome: '👋 Boas-vindas',
  check_in: '🤔 Check-in',
  recovery: '🔄 Recuperação',
  reminder: '⏰ Lembrete',
  special_offer: '🎁 Oferta Especial',
  reactivation: '🚀 Reativação',
  milestone: '🏅 Marco de Leads',
  tutorial: '📖 Tutorial',
  survey: '📝 Pesquisa',
  plan_compare: '💎 Comparativo',
  integration_guide: '🔌 Integrações',
  re_engagement: '🔁 Reengajamento',
  webinar: '🎥 Webinar',
};

function pct(num: number, den: number): string {
  if (den === 0) return '0%';
  return `${((num / den) * 100).toFixed(1)}%`;
}

export function EmailRecoveryReports() {
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodKey>('30');

  useEffect(() => { load(period); }, [period]);

  const load = async (selectedPeriod: PeriodKey) => {
    setLoading(true);
    try {
      const days = parseInt(selectedPeriod, 10);
      const cutoff = days > 0
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Load templates list (always full set so categories with 0 sends still render)
      const tplPromise = supabase
        .from('email_recovery_templates')
        .select('id, name, category, subject, subject_b')
        .eq('is_active', true);

      // Paginated fetch with optional date filter
      const PAGE = 1000;
      let from = 0;
      const all: EmailContact[] = [];
      for (let i = 0; i < 50; i++) {
        let q = supabase
          .from('email_recovery_contacts')
          .select('*, email_recovery_templates(name, category, subject, subject_b)')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE - 1);
        if (cutoff) q = q.gte('created_at', cutoff);
        const { data, error } = await q;
        if (error) throw error;
        const page = (data || []) as unknown as EmailContact[];
        all.push(...page);
        if (page.length < PAGE) break;
        from += PAGE;
      }

      const { data: tplData, error: tplErr } = await tplPromise;
      if (tplErr) throw tplErr;

      setTemplates((tplData || []) as TemplateRow[]);
      setContacts(all);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const filtered = contacts.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (categoryFilter !== 'all' && c.email_recovery_templates?.category !== categoryFilter) return false;
    return true;
  });

  const total = contacts.length;
  const sent = contacts.filter(c => ['sent', 'opened', 'clicked'].includes(c.status)).length;
  const opened = contacts.filter(c => c.opened_at || c.status === 'opened' || c.status === 'clicked').length;
  const clicked = contacts.filter(c => c.clicked_at || c.status === 'clicked').length;
  const failed = contacts.filter(c => c.status === 'failed').length;
  const pending = contacts.filter(c => c.status === 'pending').length;

  // ──────────────────────────────────────────────────────────
  // Performance by Category — baseline = todas as categorias de templates
  // (categorias com 0 envios aparecem zeradas, não somem)
  // ──────────────────────────────────────────────────────────
  const categoryPerformance = useMemo(() => {
    const stats = new Map<string, { sent: number; opened: number; clicked: number; failed: number }>();
    for (const t of templates) {
      if (!stats.has(t.category)) stats.set(t.category, { sent: 0, opened: 0, clicked: 0, failed: 0 });
    }
    for (const c of contacts) {
      const cat = c.email_recovery_templates?.category || 'unknown';
      if (!stats.has(cat)) stats.set(cat, { sent: 0, opened: 0, clicked: 0, failed: 0 });
      const e = stats.get(cat)!;
      if (['sent', 'opened', 'clicked'].includes(c.status)) e.sent++;
      if (c.opened_at || c.status === 'opened' || c.status === 'clicked') e.opened++;
      if (c.clicked_at || c.status === 'clicked') e.clicked++;
      if (c.status === 'failed') e.failed++;
    }
    return Array.from(stats.entries())
      .map(([cat, s]) => ({
        cat,
        category: CATEGORY_LABELS[cat] || cat,
        sent: s.sent,
        opened: s.opened,
        clicked: s.clicked,
        failed: s.failed,
        openRate: pct(s.opened, s.sent),
        clickRate: pct(s.clicked, s.sent),
        failRate: pct(s.failed, s.sent + s.failed),
      }))
      .sort((a, b) => b.sent - a.sent);
  }, [contacts, templates]);

  const categoryChartData = categoryPerformance
    .filter(r => r.sent > 0 || r.failed > 0) // chart só com dados (tabela mostra todas)
    .map(r => ({ name: r.category, sent: r.sent, opened: r.opened, clicked: r.clicked, failed: r.failed }));

  // ──────────────────────────────────────────────────────────
  // A/B test results POR TEMPLATE
  // - Templates sem subject_b => "Sem variante B"
  // - Indicador de vencedor só quando A e B >= MIN_SAMPLE_FOR_WINNER
  // ──────────────────────────────────────────────────────────
  const abPerTemplate = useMemo(() => {
    const byTpl = new Map<string, { A: EmailContact[]; B: EmailContact[] }>();
    for (const c of contacts) {
      if (!c.template_id || !c.ab_variant) continue;
      if (!['sent', 'opened', 'clicked'].includes(c.status)) continue;
      if (!byTpl.has(c.template_id)) byTpl.set(c.template_id, { A: [], B: [] });
      const slot = byTpl.get(c.template_id)!;
      if (c.ab_variant === 'A') slot.A.push(c);
      else if (c.ab_variant === 'B') slot.B.push(c);
    }
    return templates.map(t => {
      const buckets = byTpl.get(t.id) || { A: [], B: [] };
      const calc = (arr: EmailContact[]) => {
        const s = arr.length;
        const o = arr.filter(c => c.opened_at || c.status === 'opened' || c.status === 'clicked').length;
        const cl = arr.filter(c => c.clicked_at || c.status === 'clicked').length;
        return { sent: s, opened: o, clicked: cl, openRate: s > 0 ? o / s : 0, clickRate: s > 0 ? cl / s : 0 };
      };
      const a = calc(buckets.A);
      const b = calc(buckets.B);
      const hasVariantB = !!t.subject_b && t.subject_b.trim().length > 0;
      const enoughSample = hasVariantB && a.sent >= MIN_SAMPLE_FOR_WINNER && b.sent >= MIN_SAMPLE_FOR_WINNER;
      let winner: 'A' | 'B' | 'tie' | null = null;
      if (enoughSample) {
        if (a.openRate > b.openRate) winner = 'A';
        else if (b.openRate > a.openRate) winner = 'B';
        else winner = 'tie';
      }
      return { template: t, a, b, hasVariantB, enoughSample, winner };
    }).sort((x, y) => (y.a.sent + y.b.sent) - (x.a.sent + x.b.sent));
  }, [contacts, templates]);

  // Pie chart data
  const pieData = [
    { name: 'Enviados', value: sent - opened, color: '#10b981' },
    { name: 'Abertos', value: opened - clicked, color: '#3b82f6' },
    { name: 'Clicados', value: clicked, color: '#8b5cf6' },
    { name: 'Pendentes', value: pending, color: '#f59e0b' },
    { name: 'Falhas', value: failed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Período de análise</h3>
          <p className="text-xs text-muted-foreground">Filtra todos os gráficos e tabelas abaixo</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map(k => (
                <SelectItem key={k} value={k}>{PERIOD_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => load(period)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-blue-100 text-blue-600"><Mail className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-green-100 text-green-600"><Send className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{sent}</p><p className="text-xs text-muted-foreground">Enviados</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-blue-100 text-blue-600"><MailOpen className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{opened}</p><p className="text-xs text-muted-foreground">Abertos ({pct(opened, sent)})</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-purple-100 text-purple-600"><MousePointerClick className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{clicked}</p><p className="text-xs text-muted-foreground">Clicados ({pct(clicked, sent)})</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-yellow-100 text-yellow-600"><TrendingUp className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-full bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{failed}</p><p className="text-xs text-muted-foreground">Falhas</p></div></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Categoria de Email</CardTitle>
            <CardDescription>Performance por tipo de template</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sent" name="Enviados" fill="#10b981" />
                  <Bar dataKey="opened" name="Abertos" fill="#3b82f6" />
                  <Bar dataKey="clicked" name="Clicados" fill="#8b5cf6" />
                  <Bar dataKey="failed" name="Falhas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados ainda</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Status</CardTitle>
            <CardDescription>Visão geral do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance by Category Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance por Categoria</CardTitle>
          <CardDescription>Open rate e click rate por tipo de email</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Enviados</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Falhas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPerformance.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.category}</TableCell>
                    <TableCell>{row.sent}</TableCell>
                    <TableCell><Badge variant="outline" className="text-blue-600">{row.openRate}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-purple-600">{row.clickRate}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-red-600">{row.failRate}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">Sem dados</p>
          )}
        </CardContent>
      </Card>

      {/* A/B Test Results — POR TEMPLATE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teste A/B por Template</CardTitle>
          <CardDescription>
            Comparação subject line A vs B. Vencedor declarado apenas com ≥ {MIN_SAMPLE_FOR_WINNER} envios em cada variante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {abPerTemplate.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum template ativo encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Template</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Variante A</TableHead>
                    <TableHead className="text-center">Variante B</TableHead>
                    <TableHead className="text-center">Vencedora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abPerTemplate.map(({ template: t, a, b, hasVariantB, enoughSample, winner }) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[t.category] || t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-xs">
                          <div className="font-semibold">{a.sent} env.</div>
                          <div className="text-muted-foreground">
                            Open {pct(a.opened, a.sent)} · Click {pct(a.clicked, a.sent)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {!hasVariantB ? (
                          <Badge variant="secondary" className="text-xs">
                            <Minus className="h-3 w-3 mr-1" /> Sem variante B
                          </Badge>
                        ) : (
                          <div className="text-xs">
                            <div className="font-semibold">{b.sent} env.</div>
                            <div className="text-muted-foreground">
                              Open {pct(b.opened, b.sent)} · Click {pct(b.clicked, b.sent)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!hasVariantB ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : !enoughSample ? (
                          <span className="text-xs text-muted-foreground">
                            Amostra insuficiente
                          </span>
                        ) : winner === 'tie' ? (
                          <Badge variant="outline" className="text-xs">Empate</Badge>
                        ) : (
                          <Badge className="text-xs bg-green-600 hover:bg-green-600">
                            <Trophy className="h-3 w-3 mr-1" /> {winner}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base">Todos os Emails Enviados</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="opened">Abertos</SelectItem>
                  <SelectItem value="clicked">Clicados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => { setLoading(true); load(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum email encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>A/B</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Aberto em</TableHead>
                    <TableHead>Clicado em</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{c.email}</TableCell>
                      <TableCell className="text-sm">{c.email_recovery_templates?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[c.email_recovery_templates?.category || ''] || c.email_recovery_templates?.category || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-700'}`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{c.ab_variant || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.sent_at ? new Date(c.sent_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.opened_at ? new Date(c.opened_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.clicked_at ? new Date(c.clicked_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                        {c.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-xs text-muted-foreground text-center mt-2">Mostrando 100 de {filtered.length} registros</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
