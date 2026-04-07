import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Minus, Users, FileText, Target, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModeLog {
  site_mode: string;
  updated_at: string;
}

interface MetricCard {
  label: string;
  icon: React.ReactNode;
  modeA: number;
  modeB: number;
}

export function ModeComparison() {
  // Get site_settings history (we only have current mode, so we'll use profiles.created_at + site_settings)
  const { data: siteSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['site-settings-mode'],
    queryFn: async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('site_mode, updated_at')
        .limit(1)
        .single();
      return data;
    },
  });

  // Get all profiles with created_at to segment by mode periods
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['mode-comparison-profiles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, created_at, email')
        .not('email', 'is', null)
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // Get quizzes
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['mode-comparison-quizzes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quizzes')
        .select('id, user_id, created_at, status');
      return data || [];
    },
  });

  // Get responses
  const { data: responses, isLoading: loadingResponses } = useQuery({
    queryKey: ['mode-comparison-responses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quiz_responses')
        .select('id, quiz_id, completed_at, respondent_email, respondent_whatsapp');
      return data || [];
    },
  });

  // Get subscriptions
  const { data: subscriptions, isLoading: loadingSubs } = useQuery({
    queryKey: ['mode-comparison-subs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_subscriptions' as any)
        .select('user_id, plan_type, created_at') as any;
      return (data || []) as Array<{ user_id: string; plan_type: string; created_at: string }>;
    },
  });

  const isLoading = loadingSettings || loadingProfiles || loadingQuizzes || loadingResponses || loadingSubs;

  // Determine mode switch date
  const currentMode = siteSettings?.site_mode || 'A';
  const modeSwitchDate = siteSettings?.updated_at ? new Date(siteSettings.updated_at) : null;

  const metrics = useMemo<MetricCard[]>(() => {
    if (!profiles || !quizzes || !responses || !modeSwitchDate) return [];

    const switchTime = modeSwitchDate.getTime();

    // Segment profiles by creation date relative to mode switch
    // If current mode is B: before switch = Mode A, after = Mode B
    // If current mode is A: everything is Mode A (no Mode B data yet)
    const profilesA = currentMode === 'B'
      ? profiles.filter(p => new Date(p.created_at).getTime() < switchTime)
      : profiles;
    const profilesB = currentMode === 'B'
      ? profiles.filter(p => new Date(p.created_at).getTime() >= switchTime)
      : [];

    const profileIdsA = new Set(profilesA.map(p => p.id));
    const profileIdsB = new Set(profilesB.map(p => p.id));

    // Quizzes by mode
    const quizzesA = quizzes.filter(q => profileIdsA.has(q.user_id));
    const quizzesB = quizzes.filter(q => profileIdsB.has(q.user_id));

    // Published quizzes
    const publishedA = quizzesA.filter(q => q.status === 'active').length;
    const publishedB = quizzesB.filter(q => q.status === 'active').length;

    // Leads (responses with email or whatsapp)
    const quizIdsA = new Set(quizzesA.map(q => q.id));
    const quizIdsB = new Set(quizzesB.map(q => q.id));
    const leadsA = responses.filter(r => quizIdsA.has(r.quiz_id) && (r.respondent_email || r.respondent_whatsapp)).length;
    const leadsB = responses.filter(r => quizIdsB.has(r.quiz_id) && (r.respondent_email || r.respondent_whatsapp)).length;

    // Paid conversions
    const paidA = (subscriptions || []).filter(s => profileIdsA.has(s.user_id) && s.plan_type !== 'free').length;
    const paidB = (subscriptions || []).filter(s => profileIdsB.has(s.user_id) && s.plan_type !== 'free').length;

    return [
      { label: 'Cadastros', icon: <Users className="h-5 w-5" />, modeA: profilesA.length, modeB: profilesB.length },
      { label: 'Quizzes Criados', icon: <FileText className="h-5 w-5" />, modeA: quizzesA.length, modeB: quizzesB.length },
      { label: 'Quizzes Publicados', icon: <FileText className="h-5 w-5" />, modeA: publishedA, modeB: publishedB },
      { label: 'Leads Gerados', icon: <Target className="h-5 w-5" />, modeA: leadsA, modeB: leadsB },
      { label: 'Conversões Pagas', icon: <CreditCard className="h-5 w-5" />, modeA: paidA, modeB: paidB },
    ];
  }, [profiles, quizzes, responses, subscriptions, modeSwitchDate, currentMode]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentMode !== 'B' || !modeSwitchDate) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            O Modo B nunca foi ativado neste projeto. Ative o Modo B em <strong>Sistema → Configurações</strong> para começar a coletar dados comparativos.
          </p>
          <Badge variant="outline" className="mt-3">Modo atual: A (Free + Paid)</Badge>
        </CardContent>
      </Card>
    );
  }

  const getDelta = (a: number, b: number) => {
    if (a === 0 && b === 0) return 0;
    if (a === 0) return 100;
    return Math.round(((b - a) / a) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Comparação: Modo A vs Modo B</CardTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline">Modo A</Badge>
            <span>até {format(modeSwitchDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            <span>→</span>
            <Badge>Modo B (Atual)</Badge>
            <span>desde {format(modeSwitchDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m, i) => {
          const delta = getDelta(m.modeA, m.modeB);
          return (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted">{m.icon}</div>
                  <span className="font-medium">{m.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Modo A</p>
                    <p className="text-2xl font-bold">{m.modeA.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Modo B</p>
                    <p className="text-2xl font-bold">{m.modeB.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center mt-3 gap-1.5">
                  {delta > 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  ) : delta < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-medium ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {delta > 0 ? '+' : ''}{delta}% {delta > 0 ? 'mais' : delta < 0 ? 'menos' : 'igual'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taxas de Conversão Comparadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Métrica</th>
                  <th className="text-center py-2 font-medium">Modo A</th>
                  <th className="text-center py-2 font-medium">Modo B</th>
                  <th className="text-center py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {metrics.length >= 5 && (
                  <>
                    <tr className="border-b">
                      <td className="py-2">Quizzes / Cadastro</td>
                      <td className="text-center py-2">{metrics[0].modeA > 0 ? (metrics[1].modeA / metrics[0].modeA).toFixed(2) : '0'}</td>
                      <td className="text-center py-2">{metrics[0].modeB > 0 ? (metrics[1].modeB / metrics[0].modeB).toFixed(2) : '0'}</td>
                      <td className="text-center py-2">
                        {(() => {
                          const rA = metrics[0].modeA > 0 ? metrics[1].modeA / metrics[0].modeA : 0;
                          const rB = metrics[0].modeB > 0 ? metrics[1].modeB / metrics[0].modeB : 0;
                          const d = rA > 0 ? Math.round(((rB - rA) / rA) * 100) : 0;
                          return <span className={d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : ''}>{d > 0 ? '+' : ''}{d}%</span>;
                        })()}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Leads / Quiz</td>
                      <td className="text-center py-2">{metrics[1].modeA > 0 ? (metrics[3].modeA / metrics[1].modeA).toFixed(1) : '0'}</td>
                      <td className="text-center py-2">{metrics[1].modeB > 0 ? (metrics[3].modeB / metrics[1].modeB).toFixed(1) : '0'}</td>
                      <td className="text-center py-2">
                        {(() => {
                          const rA = metrics[1].modeA > 0 ? metrics[3].modeA / metrics[1].modeA : 0;
                          const rB = metrics[1].modeB > 0 ? metrics[3].modeB / metrics[1].modeB : 0;
                          const d = rA > 0 ? Math.round(((rB - rA) / rA) * 100) : 0;
                          return <span className={d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : ''}>{d > 0 ? '+' : ''}{d}%</span>;
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">Conversão Paga (%)</td>
                      <td className="text-center py-2">{metrics[0].modeA > 0 ? ((metrics[4].modeA / metrics[0].modeA) * 100).toFixed(1) : '0'}%</td>
                      <td className="text-center py-2">{metrics[0].modeB > 0 ? ((metrics[4].modeB / metrics[0].modeB) * 100).toFixed(1) : '0'}%</td>
                      <td className="text-center py-2">
                        {(() => {
                          const rA = metrics[0].modeA > 0 ? (metrics[4].modeA / metrics[0].modeA) * 100 : 0;
                          const rB = metrics[0].modeB > 0 ? (metrics[4].modeB / metrics[0].modeB) * 100 : 0;
                          const d = rA > 0 ? Math.round(((rB - rA) / rA) * 100) : 0;
                          return <span className={d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : ''}>{d > 0 ? '+' : ''}{d}%</span>;
                        })()}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
