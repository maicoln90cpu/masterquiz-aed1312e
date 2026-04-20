import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, TestTube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const WebhookSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowWebhook, isLoading: loadingPlan } = usePlanFeatures();
  const { user } = useCurrentUser();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('user_webhooks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setWebhookUrl(data.webhook_url);
        setWebhookSecret(data.webhook_secret || '');
        setIsActive(data.is_active);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!allowWebhook) {
      toast.error(t('webhookSettings.premiumOnly'));
      return;
    }

    if (!webhookUrl) {
      toast.error(t('webhookSettings.urlRequired'));
      return;
    }

    setSaving(true);
    try {
      if (!user) throw new Error(t('webhookSettings.notAuthenticated'));

      const { error } = await supabase
        .from('user_webhooks')
        .upsert({
          user_id: user.id,
          webhook_url: webhookUrl,
          webhook_secret: webhookSecret || null,
          is_active: isActive
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      toast.success(t('webhookSettings.savedSuccess'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error(t('webhookSettings.configureFirst'));
      return;
    }

    setTesting(true);
    try {
      const testPayload = {
        event: 'quiz.response.completed',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'Este é um webhook de teste do MasterQuiz'
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast.success(t('webhookSettings.testSuccess'));
      } else {
        toast.error(t('webhookSettings.testError', { status: response.status }));
      }
    } catch (error: any) {
      toast.error(t('webhookSettings.testFailed', { error: error.message }));
    } finally {
      setTesting(false);
    }
  };

  if (loadingPlan) {
    return <div className="flex items-center justify-center min-h-screen">{t('webhookSettings.loading')}</div>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">{t('webhookSettings.title')}</h1>
        {!allowWebhook && (
          <Card className="mb-6 border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t('webhookSettings.upgradeTitle')}
              </CardTitle>
              <CardDescription>
                {t('webhookSettings.upgradeDesc')}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('webhookSettings.description')}</CardTitle>
            <CardDescription>
              {t('webhookSettings.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">{t('webhookSettings.webhookUrl')}</Label>
              <Input
                id="webhook-url"
                placeholder={t('webhookSettings.webhookUrlPlaceholder')}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={!allowWebhook}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">{t('webhookSettings.webhookSecret')}</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder={t('webhookSettings.webhookSecretPlaceholder')}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                disabled={!allowWebhook}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={!allowWebhook}
              />
              <Label>{t('webhookSettings.activeWebhook')}</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                onClick={handleSave}
                disabled={saving || !allowWebhook}
                className="w-full sm:flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? t('webhookSettings.saving') : t('webhookSettings.save')}
              </Button>
              <Button
                onClick={handleTest}
                disabled={testing || !webhookUrl || !allowWebhook}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? t('webhookSettings.testing') : t('webhookSettings.test')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('webhookSettings.payloadExample')}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "event": "quiz.response.completed",
  "timestamp": "2025-01-04T12:30:00Z",
  "data": {
    "response_id": "uuid-da-resposta",
    "quiz_id": "uuid-do-quiz",
    "quiz_title": "Meu Quiz",
    "quiz_slug": "meu-quiz",
    "respondent_name": "João Silva",
    "respondent_email": "joao@example.com",
    "respondent_whatsapp": "(11) 99999-9999",
    "answers": { "question_id": "answer_value" },
    "custom_field_data": { "campo": "valor" },
    "completed_at": "2025-01-04T12:30:00Z"
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WebhookSettings;
