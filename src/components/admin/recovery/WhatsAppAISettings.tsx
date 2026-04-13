import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Bot, Shield, BookOpen, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppAIKnowledge } from "./WhatsAppAIKnowledge";

interface AISettings {
  id: string;
  is_enabled: boolean;
  system_prompt: string;
  max_history_messages: number;
  rate_limit_per_hour: number;
  fallback_message: string;
  admin_alert_phone: string;
  max_agent_retries: number;
}

export function WhatsAppAISettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_ai_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data as AISettings);
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast.error('Erro ao carregar configurações de IA');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('whatsapp_ai_settings')
        .update({
          is_enabled: settings.is_enabled,
          system_prompt: settings.system_prompt,
          max_history_messages: settings.max_history_messages,
          rate_limit_per_hour: settings.rate_limit_per_hour,
          fallback_message: settings.fallback_message,
          admin_alert_phone: settings.admin_alert_phone || null,
          max_agent_retries: settings.max_agent_retries,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('Configurações de IA salvas!');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Configurações de IA não encontradas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="settings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="settings" className="flex items-center gap-1">
          <Bot className="h-4 w-4" /> Configurações
        </TabsTrigger>
        <TabsTrigger value="knowledge" className="flex items-center gap-1">
          <BookOpen className="h-4 w-4" /> Base de Conhecimento
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chatbot IA WhatsApp
              </CardTitle>
              <CardDescription>
                O bot responde automaticamente quando um usuário responde a uma mensagem de recuperação.
                Usa OpenAI com contexto personalizado do usuário e base de conhecimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bot Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, o bot responde automaticamente às respostas dos templates
                  </p>
                </div>
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instruções base para a IA. O contexto do usuário e artigos da base de conhecimento são adicionados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.system_prompt}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                rows={12}
                placeholder="Defina o comportamento da IA..."
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Limites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Limites e Proteção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Histórico de Mensagens (contexto)</Label>
                  <Input
                    type="number"
                    min={2}
                    max={30}
                    value={settings.max_history_messages}
                    onChange={(e) => setSettings({ ...settings, max_history_messages: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Quantas mensagens anteriores enviar como contexto para a IA
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Limite por Hora (por número)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.rate_limit_per_hour}
                    onChange={(e) => setSettings({ ...settings, rate_limit_per_hour: parseInt(e.target.value) || 30 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo de respostas da IA por hora para cada número
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Fallback (escalação humana)</Label>
                <Textarea
                  value={settings.fallback_message}
                  onChange={(e) => setSettings({ ...settings, fallback_message: e.target.value })}
                  rows={3}
                  placeholder="Mensagem quando a IA encaminha para suporte humano..."
                />
                <p className="text-xs text-muted-foreground">
                  Enviada quando a IA detecta que precisa encaminhar para suporte humano.
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Alerta Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alerta de Intervenção Humana
              </CardTitle>
              <CardDescription>
                Quando você responde manualmente a um usuário, o agente IA para de responder automaticamente
                e envia um alerta no seu número quando o usuário responder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label>Número do Admin (para alertas)</Label>
              <Input
                type="text"
                placeholder="5511999999999"
                value={settings.admin_alert_phone || ''}
                onChange={(e) => setSettings({ ...settings, admin_alert_phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número com DDI+DDD sem espaços. Receberá alertas quando um usuário responder após sua intervenção manual.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving} size="lg">
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Salvar Configurações</>
              )}
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="knowledge">
        <WhatsAppAIKnowledge />
      </TabsContent>
    </Tabs>
  );
}
