import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QueryFallback } from './QueryFallback';

const QueueMonitorPanel = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['system-monitor-queue'],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Email recovery contacts as queue
      const [pendingRes, processingRes, sentRes, failedRes] = await Promise.all([
        supabase.from('email_recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('email_recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
        supabase.from('email_recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', last24h),
        supabase.from('email_recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'error').gte('updated_at', last24h),
      ]);

      // WhatsApp recovery contacts
      const [whPendingRes, whSentRes] = await Promise.all([
        supabase.from('recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('recovery_contacts').select('id', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', last24h),
      ]);

      return {
        email: {
          pending: pendingRes.count ?? 0,
          processing: processingRes.count ?? 0,
          sent24h: sentRes.count ?? 0,
          failed24h: failedRes.count ?? 0,
        },
        whatsapp: {
          pending: whPendingRes.count ?? 0,
          sent24h: whSentRes.count ?? 0,
        },
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const email = data?.email ?? { pending: 0, processing: 0, sent24h: 0, failed24h: 0 };
  const whatsapp = data?.whatsapp ?? { pending: 0, sent24h: 0 };

  return (
    <div className="space-y-4 p-4">
      <QueryFallback
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
      >
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <span className="text-2xl font-bold">{email.pending + whatsapp.pending}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Processando</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <span className="text-2xl font-bold">{email.processing}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Concluídas (24h)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <span className="text-2xl font-bold">{email.sent24h + whatsapp.sent24h}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Falhas (24h)</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <span className="text-2xl font-bold">{email.failed24h}</span>
          </CardContent>
        </Card>
        </div>

        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Pendentes</TableHead>
            <TableHead>Enviados (24h)</TableHead>
            <TableHead>Falhas (24h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-muted-foreground">1</TableCell>
            <TableCell><Badge variant="outline">Email (E-goi)</Badge></TableCell>
            <TableCell>{email.pending}</TableCell>
            <TableCell>{email.sent24h}</TableCell>
            <TableCell>{email.failed24h > 0 ? <Badge variant="destructive">{email.failed24h}</Badge> : '0'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-muted-foreground">2</TableCell>
            <TableCell><Badge variant="outline">WhatsApp</Badge></TableCell>
            <TableCell>{whatsapp.pending}</TableCell>
            <TableCell>{whatsapp.sent24h}</TableCell>
            <TableCell>-</TableCell>
          </TableRow>
        </TableBody>
        </Table>
        </>
      </QueryFallback>
    </div>
  );
};

export default QueueMonitorPanel;
