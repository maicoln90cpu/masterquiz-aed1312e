import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings, Clock, MessageSquare, Shield, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AntiSpamSlider } from "./AntiSpamSlider";

interface RecoverySettingsData {
  id: string;
  inactivity_days_trigger: number;
  daily_message_limit: number;
  message_delay_seconds: number;
  delay_max_seconds: number;
  hourly_message_limit: number;
  batch_size: number;
  batch_pause_minutes: number;
  user_cooldown_days: number;
  randomize_delay: boolean;
  allowed_hours_start: string;
  allowed_hours_end: string;
  retry_failed_after_hours: number;
  max_retry_attempts: number;
  auto_campaign_enabled: boolean;
  is_active: boolean;
}

export function RecoverySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RecoverySettingsData | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Garantir valores padrão para novos campos
      if (data) {
        setSettings({
          ...data,
          delay_max_seconds: data.delay_max_seconds ?? 120,
          hourly_message_limit: data.hourly_message_limit ?? 15,
          batch_size: data.batch_size ?? 10,
          batch_pause_minutes: data.batch_pause_minutes ?? 10,
          user_cooldown_days: data.user_cooldown_days ?? 7,
          randomize_delay: data.randomize_delay ?? true,
        });
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('recovery_settings')
        .update({
          inactivity_days_trigger: settings.inactivity_days_trigger,
          daily_message_limit: settings.daily_message_limit,
          message_delay_seconds: settings.message_delay_seconds,
          delay_max_seconds: settings.delay_max_seconds,
          hourly_message_limit: settings.hourly_message_limit,
          batch_size: settings.batch_size,
          batch_pause_minutes: settings.batch_pause_minutes,
          user_cooldown_days: settings.user_cooldown_days,
          randomize_delay: settings.randomize_delay,
          allowed_hours_start: settings.allowed_hours_start,
          allowed_hours_end: settings.allowed_hours_end,
          retry_failed_after_hours: settings.retry_failed_after_hours,
          max_retry_attempts: settings.max_retry_attempts,
          auto_campaign_enabled: settings.auto_campaign_enabled,
          is_active: settings.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof RecoverySettingsData>(field: K, value: RecoverySettingsData[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
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
            Configurações não encontradas. Por favor, recarregue a página.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Ative ou desative o sistema de recuperação de clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sistema Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativo, o sistema enviará mensagens automaticamente
              </p>
            </div>
            <Switch
              checked={settings.is_active}
              onCheckedChange={(checked) => updateField('is_active', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Campanhas Automáticas</Label>
              <p className="text-sm text-muted-foreground">
                Criar campanhas automaticamente para usuários inativos
              </p>
            </div>
            <Switch
              checked={settings.auto_campaign_enabled}
              onCheckedChange={(checked) => updateField('auto_campaign_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Retentativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Retentativas de Falhas
          </CardTitle>
          <CardDescription>
            Configure como o sistema lida com mensagens que falharam. 
            Os dias de inatividade são configurados individualmente em cada template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retry_hours">Re-tentar Falhas Após (horas)</Label>
              <Input
                id="retry_hours"
                type="number"
                min={1}
                max={48}
                value={settings.retry_failed_after_hours}
                onChange={(e) => updateField('retry_failed_after_hours', parseInt(e.target.value) || 4)}
              />
              <p className="text-xs text-muted-foreground">
                Tempo de espera antes de reenviar mensagens que falharam
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_retry">Máximo de Tentativas</Label>
              <Input
                id="max_retry"
                type="number"
                min={1}
                max={10}
                value={settings.max_retry_attempts}
                onChange={(e) => updateField('max_retry_attempts', parseInt(e.target.value) || 3)}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de tentativas para mensagens que falharam
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proteção Anti-Spam Avançada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Proteção Anti-Spam Avançada
          </CardTitle>
          <CardDescription>
            Configure limites inteligentes para evitar bloqueios do WhatsApp. 
            <span className="text-primary font-medium"> Verde = zona ideal recomendada.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Delay com aleatoriedade */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-muted-foreground" />
                <Label>Delay Aleatório Entre Envios</Label>
              </div>
              <Switch
                checked={settings.randomize_delay}
                onCheckedChange={(checked) => updateField('randomize_delay', checked)}
              />
            </div>
            {settings.randomize_delay && (
              <p className="text-xs text-muted-foreground">
                O delay será escolhido aleatoriamente entre o mínimo e máximo, simulando comportamento humano.
              </p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <AntiSpamSlider
              id="delay_min"
              label="Delay Mínimo"
              value={settings.message_delay_seconds}
              min={15}
              max={120}
              idealMin={45}
              idealMax={60}
              unit="s"
              tooltip="Tempo mínimo de espera entre cada mensagem enviada. Valores muito baixos aumentam risco de bloqueio."
              onChange={(value) => updateField('message_delay_seconds', value)}
            />

            <AntiSpamSlider
              id="delay_max"
              label="Delay Máximo"
              value={settings.delay_max_seconds}
              min={30}
              max={300}
              idealMin={90}
              idealMax={120}
              unit="s"
              tooltip="Tempo máximo de espera entre mensagens. Usado para aleatorização. Deve ser maior que o mínimo."
              onChange={(value) => updateField('delay_max_seconds', value)}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <AntiSpamSlider
              id="daily_limit"
              label="Limite Diário"
              value={settings.daily_message_limit}
              min={10}
              max={200}
              idealMin={30}
              idealMax={50}
              unit=" msg"
              tooltip="Número máximo de mensagens enviadas por dia. Valores muito ALTOS aumentam risco de bloqueio."
              onChange={(value) => updateField('daily_message_limit', value)}
              invertLogic={true}
            />

            <AntiSpamSlider
              id="hourly_limit"
              label="Limite por Hora"
              value={settings.hourly_message_limit}
              min={5}
              max={50}
              idealMin={10}
              idealMax={15}
              unit=" msg"
              tooltip="Distribui os envios ao longo do dia. Valores muito ALTOS causam picos suspeitos de atividade."
              onChange={(value) => updateField('hourly_message_limit', value)}
              invertLogic={true}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <AntiSpamSlider
              id="batch_size"
              label="Pausa Após X Envios"
              value={settings.batch_size}
              min={5}
              max={30}
              idealMin={10}
              idealMax={15}
              unit=" msg"
              tooltip="Após enviar este número de mensagens, o sistema faz uma pausa. Valores ALTOS = menos pausas = mais risco."
              onChange={(value) => updateField('batch_size', value)}
              invertLogic={true}
            />

            <AntiSpamSlider
              id="batch_pause"
              label="Duração da Pausa"
              value={settings.batch_pause_minutes}
              min={5}
              max={30}
              idealMin={10}
              idealMax={15}
              unit=" min"
              tooltip="Quanto tempo o sistema pausa após atingir o limite de batch. Valores baixos = menos pausa = mais risco."
              onChange={(value) => updateField('batch_pause_minutes', value)}
            />
          </div>

          <AntiSpamSlider
            id="user_cooldown"
            label="Cooldown por Usuário"
            value={settings.user_cooldown_days}
            min={1}
            max={30}
            idealMin={7}
            idealMax={14}
            unit=" dias"
            tooltip="Intervalo mínimo entre contatos ao mesmo usuário. Evita parecer spam para quem recebe."
            onChange={(value) => updateField('user_cooldown_days', value)}
          />
        </CardContent>
      </Card>

      {/* Horário Permitido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Horário de Envio
          </CardTitle>
          <CardDescription>
            Configure o horário comercial para envio de mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours_start">Horário de Início</Label>
              <Input
                id="hours_start"
                type="time"
                value={settings.allowed_hours_start}
                onChange={(e) => updateField('allowed_hours_start', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_end">Horário de Término</Label>
              <Input
                id="hours_end"
                type="time"
                value={settings.allowed_hours_end}
                onChange={(e) => updateField('allowed_hours_end', e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            ⚠️ Mensagens só serão enviadas dentro deste intervalo. Fora do horário, ficam na fila.
          </p>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
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
  );
}
