import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Save, Sparkles, FileText, Upload, Info, DollarSign, Users, BarChart3, RefreshCw, TrendingUp, Brain, Coins } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, Tooltip } from "recharts";

export const AISettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    ai_model: 'google/gemini-2.5-flash',
    ai_system_prompt_form: '',
    ai_system_prompt_pdf: '',
    ai_prompt_form: '',
    ai_prompt_pdf: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'ai_model', 
          'ai_system_prompt_form', 
          'ai_system_prompt_pdf',
          'ai_prompt_form', 
          'ai_prompt_pdf'
        ]);

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      setSettings({
        ai_model: settingsObj.ai_model || 'google/gemini-2.5-flash',
        ai_system_prompt_form: settingsObj.ai_system_prompt_form || '',
        ai_system_prompt_pdf: settingsObj.ai_system_prompt_pdf || '',
        ai_prompt_form: settingsObj.ai_prompt_form || '',
        ai_prompt_pdf: settingsObj.ai_prompt_pdf || ''
      });
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast.error('Erro ao carregar configurações de IA');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: 'ai_model', setting_value: settings.ai_model },
        { setting_key: 'ai_system_prompt_form', setting_value: settings.ai_system_prompt_form },
        { setting_key: 'ai_system_prompt_pdf', setting_value: settings.ai_system_prompt_pdf },
        { setting_key: 'ai_prompt_form', setting_value: settings.ai_prompt_form },
        { setting_key: 'ai_prompt_pdf', setting_value: settings.ai_prompt_pdf }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'setting_key' });
        
        if (error) throw error;
      }

      toast.success('✅ Configurações de IA salvas com sucesso!');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Erro ao salvar configurações de IA');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configurações de IA
          </CardTitle>
          <CardDescription>
            Carregando configurações...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Configurações
        </TabsTrigger>
        <TabsTrigger value="costs" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Custos IA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        <SettingsTab settings={settings} setSettings={setSettings} saveSettings={saveSettings} saving={saving} />
      </TabsContent>

      <TabsContent value="costs" className="space-y-6">
        <CostsTab />
      </TabsContent>
    </Tabs>
  );
};

// Componente da aba Configurações
const SettingsTab = ({ settings, setSettings, saveSettings, saving }: any) => (
  <div className="space-y-6">
    {/* Header Card */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Configurações Globais de IA - Geração de Quizzes
        </CardTitle>
        <CardDescription>
          Configure o modelo e os prompts específicos para cada modo de criação.
          Estas configurações são aplicadas globalmente para todos os planos que têm geração de IA habilitada.
        </CardDescription>
      </CardHeader>
    </Card>

    {/* Modelo de IA */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Modelo de IA Global</CardTitle>
        <CardDescription>
          Escolha o modelo que será usado para gerar quizzes em todos os modos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai_model">Modelo</Label>
          <Select
            value={settings.ai_model}
            onValueChange={(value) => setSettings({ ...settings, ai_model: value })}
          >
            <SelectTrigger id="ai_model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash">
                <div className="flex flex-col">
                  <span className="font-semibold">Gemini 2.5 Flash</span>
                  <span className="text-xs text-muted-foreground">Rápido e balanceado - Recomendado</span>
                </div>
              </SelectItem>
              <SelectItem value="google/gemini-2.5-flash-lite">
                <div className="flex flex-col">
                  <span className="font-semibold">Gemini 2.5 Flash Lite</span>
                  <span className="text-xs text-muted-foreground">Mais rápido, ideal para alto volume</span>
                </div>
              </SelectItem>
              <SelectItem value="google/gemini-2.5-pro">
                <div className="flex flex-col">
                  <span className="font-semibold">Gemini 2.5 Pro</span>
                  <span className="text-xs text-muted-foreground">Máxima qualidade, mais lento</span>
                </div>
              </SelectItem>
              <SelectItem value="google/gemini-3-pro-preview">
                <div className="flex flex-col">
                  <span className="font-semibold">Gemini 3 Pro Preview</span>
                  <span className="text-xs text-muted-foreground">Próxima geração (beta)</span>
                </div>
              </SelectItem>
              <SelectItem value="openai/gpt-5">
                <div className="flex flex-col">
                  <span className="font-semibold">GPT-5</span>
                  <span className="text-xs text-muted-foreground">OpenAI - Alta qualidade</span>
                </div>
              </SelectItem>
              <SelectItem value="openai/gpt-5-mini">
                <div className="flex flex-col">
                  <span className="font-semibold">GPT-5 Mini</span>
                  <span className="text-xs text-muted-foreground">OpenAI - Custo/benefício</span>
                </div>
              </SelectItem>
              <SelectItem value="openai/gpt-5-nano">
                <div className="flex flex-col">
                  <span className="font-semibold">GPT-5 Nano</span>
                  <span className="text-xs text-muted-foreground">OpenAI - Máxima velocidade</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Este modelo será usado por todos os usuários com geração de IA habilitada
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Prompt - Modo Formulário */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Prompt - Modo Formulário Guiado</CardTitle>
        </div>
        <CardDescription>
          Usado quando o usuário preenche o formulário com detalhes do produto/serviço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Prompt - Formulário */}
        <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <Label htmlFor="ai_system_prompt_form" className="font-semibold">
              System Prompt (Instruções do Sistema)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Define o comportamento, personalidade e regras gerais da IA. Não use variáveis aqui.
          </p>
          <Textarea
            id="ai_system_prompt_form"
            value={settings.ai_system_prompt_form}
            onChange={(e) => setSettings({ ...settings, ai_system_prompt_form: e.target.value })}
            rows={10}
            placeholder="Você é um especialista em criação de quizzes de qualificação de leads..."
            className="font-mono text-xs"
          />
        </div>

        {/* User Prompt - Formulário */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="ai_prompt_form" className="font-semibold">
              User Prompt (Template com Variáveis)
            </Label>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Variáveis disponíveis:</strong> Serão substituídas automaticamente pelos dados do usuário
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="font-mono text-xs">{'{productName}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{problemSolved}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{targetAudience}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{desiredAction}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{numberOfQuestions}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{quizIntent}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{companyName}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{industry}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{tone}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{leadTemperature}'}</Badge>
              </div>
            </AlertDescription>
          </Alert>

          <Textarea
            id="ai_prompt_form"
            value={settings.ai_prompt_form}
            onChange={(e) => setSettings({ ...settings, ai_prompt_form: e.target.value })}
            rows={12}
            placeholder="Crie um quiz de qualificação para: {productName}..."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            💡 Este prompt recebe os dados do usuário e é enviado após o System Prompt
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Prompt - Modo PDF */}
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Prompt - Modo Upload de PDF</CardTitle>
        </div>
        <CardDescription>
          Usado quando o usuário faz upload de um documento PDF para extrair conteúdo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Prompt - PDF */}
        <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <Label htmlFor="ai_system_prompt_pdf" className="font-semibold">
              System Prompt (Instruções do Sistema)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Define o comportamento e regras gerais da IA para análise de PDFs. Não use variáveis aqui.
          </p>
          <Textarea
            id="ai_system_prompt_pdf"
            value={settings.ai_system_prompt_pdf}
            onChange={(e) => setSettings({ ...settings, ai_system_prompt_pdf: e.target.value })}
            rows={10}
            placeholder="Você é um especialista em criar quizzes educacionais baseados em documentos..."
            className="font-mono text-xs"
          />
        </div>

        {/* User Prompt - PDF */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="ai_prompt_pdf" className="font-semibold">
              User Prompt (Template com Variáveis)
            </Label>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Variáveis disponíveis:</strong> Serão substituídas automaticamente
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="font-mono text-xs">{'{pdfContent}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{pdfFileName}'}</Badge>
                <Badge variant="secondary" className="font-mono text-xs">{'{numberOfQuestions}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{quizIntent}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{focusTopics}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{difficultyLevel}'}</Badge>
                <Badge variant="outline" className="font-mono text-xs text-primary">{'{targetAudiencePdf}'}</Badge>
              </div>
            </AlertDescription>
          </Alert>

          <Textarea
            id="ai_prompt_pdf"
            value={settings.ai_prompt_pdf}
            onChange={(e) => setSettings({ ...settings, ai_prompt_pdf: e.target.value })}
            rows={12}
            placeholder="Analise o documento e crie um quiz baseado no conteúdo..."
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            💡 Este prompt recebe o conteúdo do PDF e é enviado após o System Prompt
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Botão Salvar */}
    <div className="flex justify-end">
      <Button 
        onClick={saveSettings} 
        disabled={saving}
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Configurações
          </>
        )}
      </Button>
    </div>

    {/* Informação adicional */}
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Como funciona
        </h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            <span><strong>Prompts Específicos:</strong> Cada modo (formulário/PDF) usa seu próprio prompt otimizado</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            <span><strong>Substituição Automática:</strong> As variáveis entre chaves são substituídas pelos dados do usuário</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            <span><strong>Formato JSON:</strong> Sempre instrua a IA a retornar JSON válido com a estrutura esperada</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            <span><strong>Aplicação Global:</strong> Mudanças aqui afetam todos os usuários com geração de IA habilitada</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            <span><strong>Limites por Plano:</strong> Configure quantas gerações mensais cada plano pode usar na aba "Planos"</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Componente da aba Custos IA
const CostsTab = () => {
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Query para estatísticas gerais
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['ai-costs-stats'],
    queryFn: async () => {
      // Total de gerações
      const { count: totalGenerations } = await supabase
        .from('ai_quiz_generations')
        .select('*', { count: 'exact', head: true });

      // Gerações este mês
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { count: monthGenerations } = await supabase
        .from('ai_quiz_generations')
        .select('*', { count: 'exact', head: true })
        .gte('generation_month', `${currentMonth}-01`);

      // Total de perguntas e tokens e custo
      const { data: aggregateData } = await supabase
        .from('ai_quiz_generations')
        .select('questions_generated, total_tokens, estimated_cost_usd');
      
      const totalQuestions = aggregateData?.reduce((sum, row) => sum + (row.questions_generated || 0), 0) || 0;
      const totalTokens = aggregateData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;
      const totalCostUsd = aggregateData?.reduce((sum, row) => sum + (Number(row.estimated_cost_usd) || 0), 0) || 0;

      // Custo este mês
      const { data: monthData } = await supabase
        .from('ai_quiz_generations')
        .select('estimated_cost_usd, total_tokens')
        .gte('generation_month', `${currentMonth}-01`);
      
      const monthCostUsd = monthData?.reduce((sum, row) => sum + (Number(row.estimated_cost_usd) || 0), 0) || 0;
      const monthTokens = monthData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;

      // Usuários únicos que usaram IA
      const { data: uniqueUsers } = await supabase
        .from('ai_quiz_generations')
        .select('user_id');
      
      const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

      return {
        totalGenerations: totalGenerations || 0,
        monthGenerations: monthGenerations || 0,
        totalQuestions,
        uniqueUserCount,
        totalTokens,
        totalCostUsd,
        monthCostUsd,
        monthTokens
      };
    }
  });

  // Query para gerações por mês (últimos 6 meses)
  const { data: monthlyData } = useQuery({
    queryKey: ['ai-costs-monthly'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_quiz_generations')
        .select('generation_month, questions_generated, total_tokens, estimated_cost_usd')
        .order('generation_month', { ascending: true });

      // Agrupar por mês
      const grouped: Record<string, { generations: number; questions: number; tokens: number; cost: number }> = {};
      data?.forEach(row => {
        const month = row.generation_month?.slice(0, 7) || 'unknown';
        if (!grouped[month]) {
          grouped[month] = { generations: 0, questions: 0, tokens: 0, cost: 0 };
        }
        grouped[month].generations++;
        grouped[month].questions += row.questions_generated || 0;
        grouped[month].tokens += row.total_tokens || 0;
        grouped[month].cost += Number(row.estimated_cost_usd) || 0;
      });

      // Converter para array e pegar últimos 6 meses
      return Object.entries(grouped)
        .map(([month, data]) => ({
          month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
          generations: data.generations,
          questions: data.questions,
          tokens: data.tokens,
          cost: data.cost
        }))
        .slice(-6);
    }
  });

  // Query para distribuição por modelo
  const { data: modelData } = useQuery({
    queryKey: ['ai-costs-models'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_quiz_generations')
        .select('model_used, total_tokens, estimated_cost_usd');

      // Contar por modelo
      const counts: Record<string, { count: number; tokens: number; cost: number }> = {};
      data?.forEach(row => {
        const model = row.model_used || 'unknown';
        if (!counts[model]) {
          counts[model] = { count: 0, tokens: 0, cost: 0 };
        }
        counts[model].count++;
        counts[model].tokens += row.total_tokens || 0;
        counts[model].cost += Number(row.estimated_cost_usd) || 0;
      });

      return Object.entries(counts)
        .map(([name, data]) => ({
          name: name.replace('google/', '').replace('openai/', ''),
          value: data.count,
          tokens: data.tokens,
          cost: data.cost,
          fullName: name
        }))
        .sort((a, b) => b.value - a.value);
    }
  });

  // Query para top usuários
  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['ai-costs-users'],
    queryFn: async () => {
      const { data: generations } = await supabase
        .from('ai_quiz_generations')
        .select('user_id, model_used, questions_generated, total_tokens, estimated_cost_usd, created_at');

      // Agrupar por usuário
      const userStats: Record<string, { 
        generations: number; 
        questions: number; 
        tokens: number;
        cost: number;
        models: Set<string>;
        lastUsed: string;
      }> = {};

      generations?.forEach(row => {
        const userId = row.user_id;
        if (!userStats[userId]) {
          userStats[userId] = { generations: 0, questions: 0, tokens: 0, cost: 0, models: new Set(), lastUsed: '' };
        }
        userStats[userId].generations++;
        userStats[userId].questions += row.questions_generated || 0;
        userStats[userId].tokens += row.total_tokens || 0;
        userStats[userId].cost += Number(row.estimated_cost_usd) || 0;
        userStats[userId].models.add(row.model_used);
        if (!userStats[userId].lastUsed || row.created_at > userStats[userId].lastUsed) {
          userStats[userId].lastUsed = row.created_at || '';
        }
      });

      // Buscar emails dos usuários (via profiles não temos email, então mostramos ID abreviado)
      return Object.entries(userStats)
        .map(([userId, data]) => ({
          userId,
          userIdShort: userId.substring(0, 8) + '...',
          generations: data.generations,
          questions: data.questions,
          tokens: data.tokens,
          cost: data.cost,
          modelsUsed: data.models.size,
          lastUsed: data.lastUsed ? format(new Date(data.lastUsed), 'dd/MM/yy HH:mm') : '-'
        }))
        .sort((a, b) => b.cost - a.cost) // Ordenar por custo
        .slice(0, 10);
    }
  });

  const chartConfig = {
    generations: { label: "Gerações", color: "hsl(var(--primary))" },
    questions: { label: "Perguntas", color: "hsl(var(--chart-2))" },
    cost: { label: "Custo (USD)", color: "hsl(var(--chart-3))" },
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(4)}`;
  };

  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Dashboard de Custos IA
              </CardTitle>
              <CardDescription>
                Acompanhe o uso de IA para geração de quizzes em todo o sistema
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de resumo - Linha 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `$${stats?.totalCostUsd.toFixed(4)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custo Este Mês</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `$${stats?.monthCostUsd.toFixed(4)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Coins className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatTokens(stats?.totalTokens || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Coins className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tokens Este Mês</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatTokens(stats?.monthTokens || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de resumo - Linha 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gerações</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.totalGenerations.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gerações Este Mês</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.monthGenerations.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perguntas Geradas</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.totalQuestions.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.uniqueUserCount.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de custo por mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo por Mês (USD)</CardTitle>
            <CardDescription>Evolução de custos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData && monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />} 
                      formatter={(value: number) => [`$${value.toFixed(4)}`, 'Custo']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-3))" }}
                      name="Custo" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - Gerações por mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gerações por Mês</CardTitle>
            <CardDescription>Últimos 6 meses de atividade</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData && monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="generations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Gerações" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de custo por modelo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custo por Modelo</CardTitle>
          <CardDescription>Distribuição de custos entre os modelos de IA utilizados</CardDescription>
        </CardHeader>
        <CardContent>
          {modelData && modelData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Gerações</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Custo (USD)</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelData.map((model, index) => {
                  const totalCost = modelData.reduce((sum, m) => sum + m.cost, 0);
                  const percentage = totalCost > 0 ? (model.cost / totalCost) * 100 : 0;
                  return (
                    <TableRow key={model.fullName}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{model.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{model.value}</TableCell>
                      <TableCell className="text-right">{formatTokens(model.tokens)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">${model.cost.toFixed(4)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de top usuários por custo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Usuários por Custo</CardTitle>
          <CardDescription>Usuários que mais gastaram com geração de quizzes por IA</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : topUsers && topUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Gerações</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Custo (USD)</TableHead>
                  <TableHead>Último uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user, index) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <Badge variant={index === 0 ? "default" : index < 3 ? "secondary" : "outline"}>
                        {index + 1}º
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.userIdShort}</TableCell>
                    <TableCell className="text-right">{user.generations}</TableCell>
                    <TableCell className="text-right">{formatTokens(user.tokens)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">${user.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.lastUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum uso de IA registrado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sobre custos */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sobre os custos:</strong> Os valores são estimativas baseadas nos tokens reportados pela API e nas tabelas de preço públicas dos modelos. 
          Os custos reais podem variar. Gerações anteriores a esta atualização mostrarão $0.00 pois não tinham tracking de tokens.
        </AlertDescription>
      </Alert>
    </div>
  );
};