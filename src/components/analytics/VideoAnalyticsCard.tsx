import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Clock, Target, TrendingUp, Video, BarChart3, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface VideoAnalyticsData {
  quiz_id: string;
  quiz_title?: string;
  video_url: string;
  unique_views: number;
  total_plays: number;
  completions: number;
  avg_watch_time: number;
  avg_percentage_watched: number;
  completion_rate: number;
  date: string;
}

interface DropoffData {
  percentage: string;
  count: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const VideoAnalyticsCard = () => {
  const { user } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');

  // Fetch quizzes for filter
  const { data: quizzes } = useQuery({
    queryKey: ['user-quizzes-for-video-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch video analytics
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['video-analytics', selectedQuiz, dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      let query = supabase
        .from('video_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (selectedQuiz !== 'all') {
        query = query.eq('quiz_id', selectedQuiz);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate summary metrics
  const summaryMetrics = analytics ? {
    totalPlays: analytics.filter(e => e.event_type === 'play').length,
    uniqueSessions: new Set(analytics.map(e => e.session_id)).size,
    completions: analytics.filter(e => e.event_type === 'ended').length,
    avgWatchTime: Math.round(
      analytics
        .filter(e => e.event_type === 'ended' && e.watch_time_seconds)
        .reduce((sum, e) => sum + (e.watch_time_seconds || 0), 0) /
      Math.max(analytics.filter(e => e.event_type === 'ended').length, 1)
    ),
    completionRate: analytics.filter(e => e.event_type === 'play').length > 0
      ? Math.round((analytics.filter(e => e.event_type === 'ended').length / 
          analytics.filter(e => e.event_type === 'play').length) * 100)
      : 0,
  } : null;

  // Calculate dropoff data
  const dropoffData: DropoffData[] = analytics ? [
    { percentage: '0-25%', count: analytics.filter(e => e.event_type === 'progress_25').length },
    { percentage: '25-50%', count: analytics.filter(e => e.event_type === 'progress_50').length },
    { percentage: '50-75%', count: analytics.filter(e => e.event_type === 'progress_75').length },
    { percentage: '75-100%', count: analytics.filter(e => e.event_type === 'ended').length },
  ] : [];

  // Calculate daily views
  const dailyViews = analytics ? Object.entries(
    analytics
      .filter(e => e.event_type === 'play')
      .reduce((acc, e) => {
        const date = new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).map(([date, views]) => ({ date, views })).slice(-7) : [];

  // Calculate top videos
  const topVideos = analytics ? Object.entries(
    analytics
      .filter(e => e.event_type === 'play' && e.video_url)
      .reduce((acc, e) => {
        const url = e.video_url || 'Desconhecido';
        acc[url] = (acc[url] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).sort(([, a], [, b]) => b - a).slice(0, 5).map(([url, plays]) => ({
    url: url.length > 40 ? url.substring(0, 40) + '...' : url,
    plays,
  })) : [];

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Analytics de Vídeos
              </CardTitle>
              <CardDescription>
                Métricas de engajamento e visualização dos seus vídeos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione um quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os quizzes</SelectItem>
                  {quizzes?.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="14">Últimos 14 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reproduções</p>
                <p className="text-2xl font-bold">{summaryMetrics?.totalPlays || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Únicas</p>
                <p className="text-2xl font-bold">{summaryMetrics?.uniqueSessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">{summaryMetrics?.completions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{formatTime(summaryMetrics?.avgWatchTime || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conclusão</p>
                <p className="text-2xl font-bold">{summaryMetrics?.completionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visualizações por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyViews.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dropoff Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Retenção de Audiência
            </CardTitle>
            <CardDescription>
              Em qual momento os espectadores param de assistir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dropoffData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dropoffData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="percentage" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-4 w-4" />
            Vídeos Mais Assistidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topVideos.length > 0 ? (
            <div className="space-y-4">
              {topVideos.map((video, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ 
                          width: `${(video.plays / Math.max(...topVideos.map(v => v.plays))) * 100}%`,
                          minWidth: '20px'
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {video.plays} {video.plays === 1 ? 'reprodução' : 'reproduções'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Nenhum vídeo reproduzido ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
