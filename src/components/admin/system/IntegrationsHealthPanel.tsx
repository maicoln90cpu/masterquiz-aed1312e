import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const IntegrationsHealthPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-integrations'],
    queryFn: async () => {
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('id, user_id, provider, is_active, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      const providerMap = new Map<string, { total: number; active: number; lastCheck: string }>();
      for (const intg of integrations ?? []) {
        const provider = intg.provider;
        const existing = providerMap.get(provider) ?? { total: 0, active: 0, lastCheck: '' };
        existing.total++;
        if (intg.is_active) existing.active++;
        if (intg.updated_at > existing.lastCheck) existing.lastCheck = intg.updated_at;
        providerMap.set(provider, existing);
      }

      return {
        raw: integrations ?? [],
        byProvider: Array.from(providerMap.entries()).map(([provider, stats]) => ({ provider, ...stats })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const providers = data?.byProvider ?? [];

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {providers.map(p => {
          const Icon = p.active === p.total ? CheckCircle : XCircle;
          return (
            <Card key={p.provider}>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase text-muted-foreground">{p.provider}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${p.active === p.total ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-sm">{p.active}/{p.total} ativos</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Última Atualização</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.raw ?? []).slice(0, 20).map((intg, i) => (
            <TableRow key={intg.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{intg.provider}</TableCell>
              <TableCell>
                <Badge variant={intg.is_active ? 'default' : 'secondary'} className="text-xs">
                  {intg.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[100px]">{intg.user_id?.slice(0, 8)}</TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(intg.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </TableCell>
            </TableRow>
          ))}
          {(data?.raw ?? []).length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma integração registrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default IntegrationsHealthPanel;
