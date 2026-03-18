import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Mail, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSettings {
  id: string;
  is_active: boolean;
  sender_email: string;
  sender_name: string;
  daily_email_limit: number;
  hourly_email_limit: number;
  batch_size: number;
  allowed_hours_start: string;
  allowed_hours_end: string;
  inactivity_days_trigger: number;
  user_cooldown_days: number;
}

export function EmailRecoverySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings | null>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_recovery_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          is_active: data.is_active ?? false,
          sender_email: data.sender_email || '',
          sender_name: data.sender_name || 'MasterQuizz',
          daily_email_limit: data.daily_email_limit ?? 100,
          hourly_email_limit: data.hourly_email_limit ?? 30,
          batch_size: data.batch_size ?? 10,
          allowed_hours_start: data.allowed_hours_start || '09:00',
          allowed_hours_end: data.allowed_hours_end || '18:00',
          inactivity_days_trigger: data.inactivity_days_trigger ?? 7,
          user_cooldown_days: data.user_cooldown_days ?? 14,
        });
      }
    } catch (err) {
      toast.error('Erro ao carregar configurações de email');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_recovery_settings')
        .update({
          is_active: settings.is_active,
          sender_email: settings.sender_email,
          sender_name: settings.sender_name,
          daily_email_limit: settings.daily_email_limit,
          hourly_email_limit: settings.hourly_email_limit,
          batch_size: settings.batch_size,
          allowed_hours_start: settings.allowed_hours_start,
          allowed_hours_end: settings.allowed_hours_end,
          inactivity_days_trigger: settings.inactivity_days_trigger,
          user_cooldown_days: settings.user_cooldown_days,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);
      if (error) throw error;
      toast.success('Configurações de email salvas');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!settings) return <p className="text-muted-foreground text-center py-8">Configurações não encontradas</p>;

  return (
    <div className="space-y-6">
      {/* Ativar/Desativar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Sistema de Email Recovery</CardTitle>
          <CardDescription>Ative/desative o envio de emails de recuperação via E-goi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={settings.is_active} onCheckedChange={v => setSettings({ ...settings, is_active: v })} />
            <span className="text-sm">{settings.is_active ? 'Ativo' : 'Inativo'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Remetente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Remetente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Email do remetente</Label>
            <Input value={settings.sender_email} onChange={e => setSettings({ ...settings, sender_email: e.target.value })} placeholder="noreply@seudominio.com" />
          </div>
          <div>
            <Label>Nome do remetente</Label>
            <Input value={settings.sender_name} onChange={e => setSettings({ ...settings, sender_name: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Limites de Envio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Limite diário</Label>
            <Input type="number" value={settings.daily_email_limit} onChange={e => setSettings({ ...settings, daily_email_limit: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Limite por hora</Label>
            <Input type="number" value={settings.hourly_email_limit} onChange={e => setSettings({ ...settings, hourly_email_limit: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Tamanho do lote</Label>
            <Input type="number" value={settings.batch_size} onChange={e => setSettings({ ...settings, batch_size: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      {/* Horários e Segmentação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Horários e Segmentação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Início permitido</Label>
            <Input type="time" value={settings.allowed_hours_start} onChange={e => setSettings({ ...settings, allowed_hours_start: e.target.value })} />
          </div>
          <div>
            <Label>Fim permitido</Label>
            <Input type="time" value={settings.allowed_hours_end} onChange={e => setSettings({ ...settings, allowed_hours_end: e.target.value })} />
          </div>
          <div>
            <Label>Dias de inatividade (trigger)</Label>
            <Input type="number" value={settings.inactivity_days_trigger} onChange={e => setSettings({ ...settings, inactivity_days_trigger: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Cooldown entre emails (dias)</Label>
            <Input type="number" value={settings.user_cooldown_days} onChange={e => setSettings({ ...settings, user_cooldown_days: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
