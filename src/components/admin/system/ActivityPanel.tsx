import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ActivityPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-activity'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [responsesRes, analyticsRes, quizzesRes] = await Promise.all([
        supabase.from('quiz_responses').select('id, quiz_id, completed_at, respondent_email').order('completed_at', { ascending: false }).limit(20),
        supabase.from('quiz_analytics').select('quiz_id, views, starts, completions, date').eq('date', today).limit(50),
        supabase.from('quizzes').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(10),
      ]);

      const totalViewsToday = (analyticsRes.data ?? []).reduce((sum, a) => sum + (a.views ?? 0), 0);
      const totalStartsToday = (analyticsRes.data ?? []).reduce((sum, a) => sum + (a.starts ?? 0), 0);
      const totalCompletionsToday = (analyticsRes.data ?? []).reduce((sum, a) => sum + (a.completions ?? 0), 0);

      return {
        recentResponses: responsesRes.data ?? [],
        totalViewsToday,
        totalStartsToday,
        totalCompletionsToday,
        recentQuizzes: quizzesRes.data ?? [],
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Views Hoje</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3"><span className="text-2xl font-bold">{data?.totalViewsToday ?? 0}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Inícios Hoje</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3"><span className="text-2xl font-bold">{data?.totalStartsToday ?? 0}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Conclusões Hoje</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3"><span className="text-2xl font-bold">{data?.totalCompletionsToday ?? 0}</span></CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Últimos Leads Recebidos</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Quiz ID</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.recentResponses ?? []).slice(0, 10).map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="text-xs">{r.respondent_email || <span className="text-muted-foreground">Anônimo</span>}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[100px]">{r.quiz_id?.slice(0, 8)}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.completed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </TableCell>
              </TableRow>
            ))}
            {(data?.recentResponses ?? []).length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhuma resposta recente.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ActivityPanel;
