import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHeader } from '@/components/admin/system/SortableTableHeader';
import { useTableSort } from '@/hooks/useTableSort';
import { Sparkles, Target, TrendingUp, Users } from 'lucide-react';

/**
 * ICP Insights — Etapa 3
 *
 * Lista usuários com seu ICP score (0-100), ordenável por score e
 * filtrável por plano e variante de landing. Permite priorizar contato
 * para usuários com score alto + cadastro recente.
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
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [variantFilter, setVariantFilter] = useState<string>('all');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['icp-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity_summary' as any)
        .select('*')
        .order('icp_score', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as unknown as ICPRow[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (planFilter !== 'all' && r.plan_type !== planFilter) return false;
      if (variantFilter !== 'all' && r.landing_variant_seen !== variantFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!r.email?.toLowerCase().includes(s) && !r.full_name?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, planFilter, variantFilter]);

  const { sortConfig, handleSort, sortedData } = useTableSort<ICPRow>(filtered, 'icp_score', 'desc');

  const stats = useMemo(() => {
    const total = filtered.length;
    const hot = filtered.filter(r => r.icp_score >= 70).length;
    const warm = filtered.filter(r => r.icp_score >= 40 && r.icp_score < 70).length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((s, r) => s + r.icp_score, 0) / total) : 0;
    return { total, hot, warm, avgScore };
  }, [filtered]);

  const planOptions = useMemo(() => {
    const set = new Set(rows.map(r => r.plan_type).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const variantOptions = useMemo(() => {
    const set = new Set(rows.map(r => r.landing_variant_seen).filter(Boolean) as string[]);
    return Array.from(set);
  }, [rows]);

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total filtrado</CardTitle>
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Buscar por email ou nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Plano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {planOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={variantFilter} onValueChange={setVariantFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Variante landing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as variantes</SelectItem>
              {variantOptions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranking ICP ({sortedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader<ICPRow> label="Score" sortKey="icp_score" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Email" sortKey="email" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Plano" sortKey="plan_type" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Dias desde cadastro" sortKey="days_since_signup" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Quizzes" sortKey="quiz_count" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Leads" sortKey="lead_count" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Upgrade clicks" sortKey="upgrade_clicked_count" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Paywall hits" sortKey="paywall_hit_count" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="UTM source" sortKey="utm_source" currentSort={sortConfig} onSort={handleSort} />
                <SortableTableHeader<ICPRow> label="Variante" sortKey="landing_variant_seen" currentSort={sortConfig} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : sortedData.map(r => {
                const badge = scoreBadgeVariant(r.icp_score);
                const isFresh = r.days_since_signup <= 7;
                return (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tabular-nums">{r.icp_score}</span>
                        <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{r.email || '—'}</span>
                        {r.full_name && <span className="text-xs text-muted-foreground">{r.full_name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.plan_type === 'free' ? 'secondary' : 'default'}>{r.plan_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={isFresh ? 'font-semibold text-emerald-600' : ''}>
                        {r.days_since_signup}d
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{r.quiz_count}</TableCell>
                    <TableCell className="tabular-nums">{r.lead_count}</TableCell>
                    <TableCell className="tabular-nums">{r.upgrade_clicked_count}</TableCell>
                    <TableCell className="tabular-nums">{r.paywall_hit_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.utm_source || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.landing_variant_seen || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
