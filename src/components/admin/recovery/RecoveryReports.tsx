import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Users, Send, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface ReportData {
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  delivered_real_count: number;
  delivered_assumed_count: number;
  read_count: number;
  responded_count: number;
  reactivated_count: number;
  failed_count: number;
  delivery_rate: number;
  read_rate: number;
  response_rate: number;
  reactivation_rate: number;
  template_performance: Array<{ name: string; sent: number; responded: number; rate: number }>;
  daily_stats: Array<{ date: string; sent: number; delivered: number; responded: number }>;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export function RecoveryReports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      // Carregar todos os contatos para calcular estatísticas
      const { data: contacts, error } = await supabase
        .from('recovery_contacts')
        .select(`
          status,
          reactivated,
          sent_at,
          delivery_assumed,
          template_id,
          recovery_templates:template_id (name)
        `);

      if (error) throw error;

      const total = contacts?.length || 0;
      const sent = contacts?.filter(c => ['sent', 'delivered', 'read', 'responded'].includes(c.status)).length || 0;
      const delivered = contacts?.filter(c => ['delivered', 'read', 'responded'].includes(c.status)).length || 0;
      const deliveredReal = contacts?.filter(c => ['delivered', 'read', 'responded'].includes(c.status) && !c.delivery_assumed).length || 0;
      const deliveredAssumed = contacts?.filter(c => c.delivery_assumed).length || 0;
      const read = contacts?.filter(c => ['read', 'responded'].includes(c.status)).length || 0;
      const responded = contacts?.filter(c => c.status === 'responded').length || 0;
      const reactivated = contacts?.filter(c => c.reactivated).length || 0;
      const failed = contacts?.filter(c => c.status === 'failed').length || 0;

      // Template performance
      const templateMap = new Map<string, { name: string; sent: number; responded: number }>();
      contacts?.forEach(c => {
        const name = c.recovery_templates?.name || 'Sem template';
        if (!templateMap.has(name)) {
          templateMap.set(name, { name, sent: 0, responded: 0 });
        }
        const entry = templateMap.get(name)!;
        if (['sent', 'delivered', 'read', 'responded'].includes(c.status)) {
          entry.sent++;
        }
        if (c.status === 'responded') {
          entry.responded++;
        }
      });

      const templatePerformance = Array.from(templateMap.values()).map(t => ({
        ...t,
        rate: t.sent > 0 ? Math.round((t.responded / t.sent) * 100) : 0
      }));

      // Daily stats (last 7 days)
      const dailyMap = new Map<string, { sent: number; delivered: number; responded: number }>();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        dailyMap.set(date, { sent: 0, delivered: 0, responded: 0 });
      });

      contacts?.forEach(c => {
        if (c.sent_at) {
          const date = c.sent_at.split('T')[0];
          if (dailyMap.has(date)) {
            const entry = dailyMap.get(date)!;
            if (['sent', 'delivered', 'read', 'responded'].includes(c.status)) entry.sent++;
            if (['delivered', 'read', 'responded'].includes(c.status)) entry.delivered++;
            if (c.status === 'responded') entry.responded++;
          }
        }
      });

      const dailyStats = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ...stats
      }));

      setData({
        total_contacts: total,
        sent_count: sent,
        delivered_count: delivered,
        delivered_real_count: deliveredReal,
        delivered_assumed_count: deliveredAssumed,
        read_count: read,
        responded_count: responded,
        reactivated_count: reactivated,
        failed_count: failed,
        delivery_rate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
        read_rate: delivered > 0 ? Math.round((read / delivered) * 100) : 0,
        response_rate: delivered > 0 ? Math.round((responded / delivered) * 100) : 0,
        reactivation_rate: total > 0 ? Math.round((reactivated / total) * 100) : 0,
        template_performance: templatePerformance,
        daily_stats: dailyStats,
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Erro ao carregar dados. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const funnelData = [
    { name: 'Enviadas', value: data.sent_count, color: '#3b82f6' },
    { name: 'Entregues', value: data.delivered_count, color: '#10b981' },
    { name: 'Lidas', value: data.read_count, color: '#8b5cf6' },
    { name: 'Respondidas', value: data.responded_count, color: '#f59e0b' },
    { name: 'Reativadas', value: data.reactivated_count, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                <p className="text-2xl font-bold">{data.delivery_rate}%</p>
              </div>
              <div className={`p-2 rounded-full ${data.delivery_rate >= 80 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                <Send className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.delivered_count} de {data.sent_count} enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Leitura</p>
                <p className="text-2xl font-bold">{data.read_rate}%</p>
              </div>
              <div className={`p-2 rounded-full ${data.read_rate >= 50 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.read_count} de {data.delivered_count} entregues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                <p className="text-2xl font-bold">{data.response_rate}%</p>
              </div>
              <div className={`p-2 rounded-full ${data.response_rate >= 20 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.responded_count} respostas recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Reativação</p>
                <p className="text-2xl font-bold text-green-600">{data.reactivation_rate}%</p>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.reactivated_count} clientes retornaram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Funil */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Recuperação</CardTitle>
            <CardDescription>
              Conversão em cada etapa do processo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Template Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Template</CardTitle>
            <CardDescription>
              Taxa de resposta de cada template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.template_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" name="Enviadas" fill="#3b82f6" />
                <Bar dataKey="responded" name="Respondidas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência Diária (Últimos 7 dias)</CardTitle>
          <CardDescription>
            Volume de mensagens e engajamento ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" name="Enviadas" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="delivered" name="Entregues" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="responded" name="Respondidas" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-blue-500">{data.total_contacts}</p>
              <p className="text-sm text-muted-foreground">Total de Contatos</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-green-500">{data.sent_count}</p>
              <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-purple-500">{data.responded_count}</p>
              <p className="text-sm text-muted-foreground">Respostas</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-emerald-500">{data.reactivated_count}</p>
              <p className="text-sm text-muted-foreground">Reativados</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-red-500">{data.failed_count}</p>
              <p className="text-sm text-muted-foreground">Falhas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
