import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Mail, Clock, Shield, Send } from "lucide-react";
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
  user_cooldown_days: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
}

export function EmailRecoverySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplateId, setTestTemplateId] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => { loadSettings(); loadTemplates(); }, []);

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
          sender_name: data.sender_name || 'MasterQuiz',
          daily_email_limit: data.daily_email_limit ?? 100,
          hourly_email_limit: data.hourly_email_limit ?? 30,
          batch_size: data.batch_size ?? 10,
          allowed_hours_start: data.allowed_hours_start || '09:00',
          allowed_hours_end: data.allowed_hours_end || '18:00',
          user_cooldown_days: data.user_cooldown_days ?? 14,
        });
      }
    } catch (err) {
      toast.error('Erro ao carregar configurações de email');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const { data } = await supabase.from('email_recovery_templates').select('id, name, category').order('priority', { ascending: false });
    setTemplates(data || []);
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

  const sendTestEmail = async () => {
    if (!testEmail) { toast.error('Informe o email destinatário'); return; }
    if (!testTemplateId) { toast.error('Selecione um template'); return; }
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { to: testEmail, template_id: testTemplateId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.message || 'Email de teste enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar teste');
    } finally {
      setSendingTest(false);
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

      {/* Horários e Cooldown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Horários e Cooldown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Início permitido</Label>
            <Input type="time" value={settings.allowed_hours_start} onChange={e => setSettings({ ...settings, allowed_hours_start: e.target.value })} />
          </div>
          <div>
            <Label>Fim permitido</Label>
            <Input type="time" value={settings.allowed_hours_end} onChange={e => setSettings({ ...settings, allowed_hours_end: e.target.value })} />
          </div>
          <div>
            <Label>Cooldown entre emails (dias)</Label>
            <Input type="number" value={settings.user_cooldown_days} onChange={e => setSettings({ ...settings, user_cooldown_days: Number(e.target.value) })} />
          </div>
        </CardContent>
      </Card>

      {/* Enviar Email de Teste */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Enviar Email de Teste</CardTitle>
          <CardDescription>Envie um email de teste com qualquer template para verificar como fica na caixa de entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Email destinatário</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label>Template</Label>
              <Select value={testTemplateId} onValueChange={setTestTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={sendTestEmail} disabled={sendingTest || !testEmail || !testTemplateId} className="w-full">
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar Teste
              </Button>
            </div>
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
