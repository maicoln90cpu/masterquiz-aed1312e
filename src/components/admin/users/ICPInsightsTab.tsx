import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/admin/system/DataTable';

/**
 * ICP Insights — Etapa 3
 * Migrado para o componente DataTable universal (Etapa F).
 */

interface ICPRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  user_stage: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  landing_variant_seen: string | null;
  plan_type: string;
  payment_confirmed: boolean | null;
  quiz_count: number;
  active_quiz_count: number;
  lead_count: number;
  quiz_shared_count: number;
  paywall_hit_count: number;
  upgrade_clicked_count: number;
  editor_sessions_count: number;
  crm_interactions_count: number;
  ai_used_on_real_quiz: boolean;
  plan_limit_hit_type: string | null;
  first_lead_received_at: string | null;
  form_collection_configured_at: string | null;
  login_count: number | null;
  days_since_signup: number;
  icp_score: number;
}

const scoreBadgeVariant = (score: number) => {
  if (score >= 70) return { label: 'Alto', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' };
  if (score >= 40) return { label: 'Médio', className: 'bg-amber-500/15 text-amber-700 border-amber-500/30' };
  return { label: 'Baixo', className: 'bg-muted text-muted-foreground border-border' };
};

export default function ICPInsightsTab() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['icp-insights'],
    queryFn: async () => {
      // 🛡️ Paginação manual em batches de 1000 (limite default do PostgREST)
      // para suportar bases >1000 usuários sem perder dados.
      const BATCH = 1000;
      const all: ICPRow[] = [];
      let from = 0;
      // Hard ceiling de segurança: 50k usuários (50 batches)
      for (let i = 0; i < 50; i++) {
        const { data, error } = await supabase
          .from('user_activity_summary' as any)
          .select('*')
          .order('icp_score', { ascending: false })
          .range(from, from + BATCH - 1);
        if (error) throw error;
        const chunk = (data || []) as unknown as ICPRow[];
        all.push(...chunk);
        if (chunk.length < BATCH) break;
        from += BATCH;
      }
      return all;
    },
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const total = rows.length;
    const hot = rows.filter(r => r.icp_score >= 70).length;
    const warm = rows.filter(r => r.icp_score >= 40 && r.icp_score < 70).length;
    const avgScore = total > 0 ? Math.round(rows.reduce((s, r) => s + r.icp_score, 0) / total) : 0;
    return { total, hot, warm, avgScore };
  }, [rows]);

  const columns: DataTableColumn<ICPRow>[] = useMemo(() => [
    {
      key: 'icp_score',
      label: 'Score',
      sortable: true,
      render: (r) => {
        const badge = scoreBadgeVariant(r.icp_score);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tabular-nums">{r.icp_score}</span>
            <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      searchable: true,
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{r.email || '—'}</span>
          {r.full_name && <span className="text-xs text-muted-foreground">{r.full_name}</span>}
        </div>
      ),
    },
    {
      key: 'full_name',
      label: 'Nome',
      searchable: true,
      className: 'hidden',
      render: () => null,
    },
    {
      key: 'plan_type',
      label: 'Plano',
      sortable: true,
      filterable: true,
      render: (r) => <Badge variant={r.plan_type === 'free' ? 'secondary' : 'default'}>{r.plan_type}</Badge>,
    },
    {
      key: 'days_since_signup',
      label: 'Dias',
      sortable: true,
      align: 'right',
      render: (r) => (
        <span className={r.days_since_signup <= 7 ? 'font-semibold text-emerald-600' : ''}>
          {r.days_since_signup}d
        </span>
      ),
    },
    { key: 'quiz_count', label: 'Quizzes', sortable: true, align: 'right', format: 'number' },
    { key: 'lead_count', label: 'Leads', sortable: true, align: 'right', format: 'number' },
    { key: 'upgrade_clicked_count', label: 'Upgrade clicks', sortable: true, align: 'right', format: 'number' },
    { key: 'paywall_hit_count', label: 'Paywall', sortable: true, align: 'right', format: 'number' },
    {
      key: 'utm_source',
      label: 'UTM source',
      sortable: true,
      filterable: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.utm_source || '—'}</span>,
    },
    {
      key: 'landing_variant_seen',
      label: 'Variante',
      sortable: true,
      filterable: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.landing_variant_seen || '—'}</span>,
    },
  ], []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ICP alto (≥70)</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{stats.hot}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ICP médio (40-69)</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600">{stats.warm}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score médio</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.avgScore}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking ICP ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<ICPRow>
            data={rows}
            columns={columns}
            defaultSortKey="icp_score"
            defaultSortDirection="desc"
            pageSize={15}
            searchPlaceholder="Buscar por email ou nome…"
            exportCsv="icp-insights"
            emptyMessage="Nenhum usuário encontrado com os filtros atuais."
            rowKey={(r) => r.user_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
