import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, DollarSign, BarChart3, Activity, Zap, Bot, Eye, Target, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Loader2, ShieldCheck, Gift } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSubTabs } from "./AdminSubTabs";

interface GrowthData {
  sectionA: {
    totalUsers: number;
    planCounts: Record<string, number>;
    newUsers7d: number;
    funnel: {
      createdQuiz: number;
      publishedQuiz: number;
      receivedResponse: number;
      received20Plus: number;
      paidUsers: number;
    };
    medianTimeToPublishHours: number | null;
    zombies: Array<{ id: string; email: string; name: string; created_at: string }>;
    zombieCount: number;
  };
  sectionB: {
    avgQuizzesPerUser: number;
    quizDistribution: Record<string, number>;
    aiUsage: { total: number; uniqueUsers: number; neverUsedPct: number };
    totalResponses: number;
    responsesGrowth7d: number;
    responsesGrowth30d: number;
    crmViewers: number;
    integrationsByProvider: Record<string, number>;
    usersAtFreeLimit: number;
    activitySegmentation: { active: number; sleeping: number; lost: number };
    utmSources: Record<string, number>;
  };
  sectionC: {
    mrr: number;
    realPaidByPlan: Record<string, number>;
    trialByPlan: Record<string, number>;
    paidByPlan: Record<string, number>;
    conversionRate: number;
    paidUserProfiles: Array<{
      email: string;
      name: string;
      plan: string;
      quizzes: number;
      leads: number;
      usedAI: boolean;
      daysToConvert: number | null;
      source: string;
    }>;
    trialUserProfiles: Array<{
      email: string;
      name: string;
      plan: string;
      source: string;
    }>;
    churnCount: number;
    medianDaysToConvert: number | null;
    realPaidCount: number;
    trialCount: number;
  };
}

function useGrowthMetrics() {
  return useQuery<GrowthData>({
    queryKey: ['growth-metrics'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('growth-metrics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      return data as GrowthData;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function MetricCard({ title, value, subtitle, icon: Icon, trend, trendLabel }: {
  title: string; value: string | number; subtitle: string;
  icon: any; trend?: number; trendLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
            {trend > 0 ? '+' : ''}{trend} {trendLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FunnelBar({ label, count, total, pctLabel }: {
  label: string; count: number; total: number; pctLabel: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count} ({pct.toFixed(1)}% {pctLabel})</span>
      </div>
      <div className="h-8 bg-muted rounded-md overflow-hidden">
        <div
          className="h-full bg-primary/80 rounded-md flex items-center px-2 text-xs font-medium text-primary-foreground transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          {pct > 10 && `${pct.toFixed(0)}%`}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Section A — Activation Funnel
// ═══════════════════════════════════════════
function SectionA({ data }: { data: GrowthData['sectionA'] }) {
  const [showZombies, setShowZombies] = useState(false);
  const f = data.funnel;
  const total = data.totalUsers;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cadastrados"
          value={total}
          subtitle={Object.entries(data.planCounts).map(([k, v]) => `${k}: ${v}`).join(' · ')}
          icon={Users}
          trend={data.newUsers7d}
          trendLabel="últimos 7d"
        />
        <MetricCard
          title="Tempo até 1ª Publicação"
          value={data.medianTimeToPublishHours !== null
            ? data.medianTimeToPublishHours < 24
              ? `${data.medianTimeToPublishHours.toFixed(1)}h`
              : `${(data.medianTimeToPublishHours / 24).toFixed(1)} dias`
            : 'N/A'}
          subtitle="Mediana cadastro → publicar (excl. Express)"
          icon={Activity}
        />
        <MetricCard
          title="Zombies"
          value={data.zombieCount}
          subtitle="7d+ sem criar quiz real"
          icon={AlertTriangle}
        />
        <MetricCard
          title="AHA! (20+ respostas)"
          value={f.received20Plus}
          subtitle={f.receivedResponse > 0 ? `${(f.received20Plus / f.receivedResponse * 100).toFixed(1)}% dos que receberam` : '—'}
          icon={Target}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Ativação</CardTitle>
          <CardDescription>Drop-off em cada etapa — excluindo Quiz Express (auto-criado)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FunnelBar label="Cadastrados" count={total} total={total} pctLabel="do total" />
          <FunnelBar label="Criou ≥1 Quiz (real)" count={f.createdQuiz} total={total} pctLabel="do total" />
          <FunnelBar label="Publicou ≥1 Quiz (real)" count={f.publishedQuiz} total={f.createdQuiz} pctLabel="dos que criaram" />
          <FunnelBar label="Recebeu ≥1 Resposta" count={f.receivedResponse} total={f.publishedQuiz} pctLabel="dos que publicaram" />
          <FunnelBar label="Recebeu 20+ Respostas" count={f.received20Plus} total={f.receivedResponse} pctLabel="dos que receberam" />
          <FunnelBar label="Pagantes Reais (webhook)" count={f.paidUsers} total={total} pctLabel="do total" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxa de Abandono por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              { label: 'Cadastro → Quiz', from: total, to: f.createdQuiz },
              { label: 'Quiz → Publicar', from: f.createdQuiz, to: f.publishedQuiz },
              { label: 'Publicar → Resposta', from: f.publishedQuiz, to: f.receivedResponse },
              { label: 'Resposta → 20+', from: f.receivedResponse, to: f.received20Plus },
              { label: '20+ → Pagante', from: f.received20Plus, to: f.paidUsers },
            ].map((step, i) => {
              const dropRate = step.from > 0 ? ((step.from - step.to) / step.from * 100) : 0;
              return (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className={`text-xl font-bold ${dropRate > 70 ? 'text-red-600' : dropRate > 40 ? 'text-amber-600' : 'text-green-600'}`}>
                    {dropRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{step.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowZombies(!showZombies)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários Inativos (Zombies) — {data.zombieCount}</CardTitle>
              <CardDescription>Cadastrou há 7+ dias e nunca criou quiz real (excl. Express)</CardDescription>
            </div>
            {showZombies ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        {showZombies && (
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.zombies.map(z => (
                    <TableRow key={z.id}>
                      <TableCell className="text-xs">{z.email || '—'}</TableCell>
                      <TableCell className="text-xs">{z.name || '—'}</TableCell>
                      <TableCell className="text-xs">{new Date(z.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.zombieCount > 50 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Mostrando 50 de {data.zombieCount} zombies
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// Section B — Platform Behavior
// ═══════════════════════════════════════════
function SectionB({ data, totalUsers }: { data: GrowthData['sectionB']; totalUsers: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Quizzes/Usuário (média)"
          value={data.avgQuizzesPerUser}
          subtitle={`1 quiz: ${data.quizDistribution['1'] || 0} · 2-3: ${data.quizDistribution['2-3'] || 0} · 4-10: ${data.quizDistribution['4-10'] || 0} · 10+: ${data.quizDistribution['10+'] || 0}`}
          icon={BarChart3}
        />
        <MetricCard
          title="Uso de IA"
          value={data.aiUsage.total}
          subtitle={`${data.aiUsage.uniqueUsers} usuários · ${data.aiUsage.neverUsedPct.toFixed(0)}% nunca usou`}
          icon={Bot}
        />
        <MetricCard
          title="Respostas Coletadas"
          value={data.totalResponses}
          subtitle="Total em todos os quizzes"
          icon={Activity}
          trend={data.responsesGrowth7d}
          trendLabel="últimos 7d"
        />
        <MetricCard
          title="Usaram CRM"
          value={data.crmViewers}
          subtitle={totalUsers > 0 ? `${(data.crmViewers / totalUsers * 100).toFixed(1)}% do total` : '—'}
          icon={Eye}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Segmentação de Atividade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Ativos (últimos 7d)', count: data.activitySegmentation.active, color: 'bg-green-500' },
              { label: 'Dormindo (8-30d)', count: data.activitySegmentation.sleeping, color: 'bg-amber-500' },
              { label: 'Perdidos (30d+)', count: data.activitySegmentation.lost, color: 'bg-red-500' },
            ].map((seg) => (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${seg.color}`} />
                  <span className="text-sm">{seg.label}</span>
                </div>
                <Badge variant="secondary">{seg.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Integrações Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.integrationsByProvider).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma integração ativa</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.integrationsByProvider).map(([provider, count]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{provider}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gatilhos de Upgrade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Atingiram limite free</span>
              <Badge variant="destructive">{data.usersAtFreeLimit}</Badge>
            </div>
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground mb-2">Fontes de Cadastro (UTM)</p>
              {Object.keys(data.utmSources).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sem dados UTM ainda</p>
              ) : (
                Object.entries(data.utmSources).slice(0, 5).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-xs">
                    <span>{source}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Section C — Revenue & Conversion
// ═══════════════════════════════════════════
function SectionC({ data, totalUsers }: { data: GrowthData['sectionC']; totalUsers: number }) {
  const realPaidCount = data.realPaidCount || 0;
  const trialCount = data.trialCount || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="MRR (Pagantes Reais)"
          value={`R$ ${data.mrr.toFixed(2)}`}
          subtitle="Verificado via webhook Kiwify"
          icon={DollarSign}
        />
        <MetricCard
          title="Projeção Anual"
          value={`R$ ${(data.mrr * 12).toFixed(2)}`}
          subtitle="MRR × 12"
          icon={TrendingUp}
        />
        <MetricCard
          title="Conversão Free → Pago"
          value={`${data.conversionRate}%`}
          subtitle={`${realPaidCount} pagante${realPaidCount !== 1 ? 's' : ''} real${realPaidCount !== 1 ? 'is' : ''} de ${totalUsers}`}
          icon={Target}
        />
        <MetricCard
          title="Tempo Free → Pago"
          value={data.medianDaysToConvert !== null ? `${data.medianDaysToConvert} dias` : 'N/A'}
          subtitle="Mediana até primeira compra"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real payers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-sm">Pagantes Reais ({realPaidCount})</CardTitle>
                <CardDescription className="text-xs">Verificados via webhook Kiwify</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(data.realPaidByPlan || {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagante real ainda</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.realPaidByPlan || {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{plan}</span>
                    <Badge className="bg-green-600">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trial/courtesy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              <div>
                <CardTitle className="text-sm">Trials / Cortesia ({trialCount})</CardTitle>
                <CardDescription className="text-xs">Upgrades manuais sem pagamento confirmado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(data.trialByPlan || {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum trial ativo</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.trialByPlan || {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{plan}</span>
                    <Badge variant="outline" className="border-amber-600 text-amber-600">{count}</Badge>
                  </div>
                ))}
                {(data.trialUserProfiles || []).length > 0 && (
                  <div className="border-t pt-2 mt-2 space-y-1">
                    {(data.trialUserProfiles || []).map((t, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        {t.email} — <span className="capitalize">{t.plan}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Churn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data.churnCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Trials expirados (não converteram)</p>
        </CardContent>
      </Card>

      {/* Real paid user profiles */}
      {data.paidUserProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil dos Pagantes Reais (Comportamento Antes de Pagar)</CardTitle>
            <CardDescription>Verificados via webhook — o que fizeram antes de converter</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Quizzes</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Usou IA</TableHead>
                  <TableHead>Dias até Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.paidUserProfiles.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{p.email || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{p.plan}</Badge></TableCell>
                    <TableCell>{p.quizzes}</TableCell>
                    <TableCell>{p.leads}</TableCell>
                    <TableCell>{p.usedAI ? '✅' : '❌'}</TableCell>
                    <TableCell>{p.daysToConvert !== null ? `${p.daysToConvert}d` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════
export function GrowthDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useGrowthMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-lg" />)}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Erro ao carregar métricas de crescimento.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Métricas de Crescimento</h2>
          <p className="text-sm text-muted-foreground">Dados em tempo real — pagantes verificados via webhook</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      <AdminSubTabs
        tabs={[
          { id: 'funnel', label: 'Funil de Ativação', icon: <Target className="h-4 w-4" />, color: 'red' },
          { id: 'behavior', label: 'Comportamento', icon: <Activity className="h-4 w-4" />, color: 'blue' },
          { id: 'revenue', label: 'Receita & Conversão', icon: <DollarSign className="h-4 w-4" />, color: 'green' },
        ]}
        defaultTab="funnel"
      >
        {(activeTab) => (
          <>
            {activeTab === 'funnel' && <SectionA data={data.sectionA} />}
            {activeTab === 'behavior' && <SectionB data={data.sectionB} totalUsers={data.sectionA.totalUsers} />}
            {activeTab === 'revenue' && <SectionC data={data.sectionC} totalUsers={data.sectionA.totalUsers} />}
          </>
        )}
      </AdminSubTabs>
    </div>
  );
}

export default GrowthDashboard;
