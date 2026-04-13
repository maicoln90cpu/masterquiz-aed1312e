import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle, CreditCard, ExternalLink, Info, Copy, TestTube, Send, AlertCircle, ScrollText, BookOpen } from "lucide-react";
import PaymentWebhookLogs from "./PaymentWebhookLogs";
import KiwifySetupGuide from "./KiwifySetupGuide";

interface PaymentSettings {
  kiwify_webhook_token: string;
  kiwify_api_token: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

const WEBHOOK_EVENTS = [
  { value: 'order_paid', label: 'order_paid - Compra aprovada' },
  { value: 'waiting_payment', label: 'waiting_payment - Aguardando pagamento' },
  { value: 'subscription_created', label: 'subscription_created - Assinatura criada' },
  { value: 'subscription_renewed', label: 'subscription_renewed - Assinatura renovada' },
  { value: 'subscription_cancelled', label: 'subscription_cancelled - Cancelamento' },
  { value: 'refund_requested', label: 'refund_requested - Reembolso solicitado' },
  { value: 'chargeback', label: 'chargeback - Chargeback' },
];

export default function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>({
    kiwify_webhook_token: '',
    kiwify_api_token: '',
  });

  // Test webhook state
  const [testEvent, setTestEvent] = useState('order_paid');
  const [testEmail, setTestEmail] = useState('');
  const [testProduct, setTestProduct] = useState('MasterQuizz Pro');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['kiwify_webhook_token', 'kiwify_api_token']);

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach(item => {
        settingsMap[item.setting_key] = item.setting_value || '';
      });

      setSettings({
        kiwify_webhook_token: settingsMap.kiwify_webhook_token || '',
        kiwify_api_token: settingsMap.kiwify_api_token || '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: 'payment_gateway', setting_value: 'kiwify' }, // Sempre Kiwify
        { setting_key: 'kiwify_webhook_token', setting_value: settings.kiwify_webhook_token },
        { setting_key: 'kiwify_api_token', setting_value: settings.kiwify_api_token },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ 
            setting_key: update.setting_key, 
            setting_value: update.setting_value, 
            updated_at: new Date().toISOString() 
          }, { 
            onConflict: 'setting_key' 
          });

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const webhookBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/kiwify-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookBaseUrl);
    toast.success('URL copiada!');
  };

  const sendTestWebhook = async () => {
    if (!testEmail) {
      toast.error('Informe o email do usuário');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    const webhookUrl = webhookBaseUrl;
    
    const payload = {
      order_id: `TEST-${Date.now()}`,
      order_status: testEvent === 'order_paid' ? 'paid' : testEvent,
      product_id: 'test-product-id',
      product_name: testProduct,
      Customer: {
        email: testEmail,
        full_name: 'Usuário Teste',
      },
      Subscription: testEvent.includes('subscription') ? {
        status: testEvent === 'subscription_cancelled' ? 'cancelled' : 'active',
        id: `sub-test-${Date.now()}`,
      } : undefined,
      data: {
        customer: { email: testEmail },
        product: { name: testProduct },
      },
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.kiwify_webhook_token) {
        headers['x-kiwify-token'] = settings.kiwify_webhook_token;
      }

      console.log('[WEBHOOK-TEST] Sending payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          evento: testEvent,
        }),
      });

      const responseData = await response.json();
      console.log('[WEBHOOK-TEST] Response:', responseData);

      setTestResult({
        success: response.ok,
        message: response.ok 
          ? `✅ Webhook processado com sucesso! Status: ${response.status}`
          : `❌ Erro: ${response.status} - ${responseData.error || 'Erro desconhecido'}`,
        details: responseData,
      });

      if (response.ok) {
        toast.success('Webhook de teste enviado com sucesso!');
      } else {
        toast.error('Erro ao processar webhook');
      }
    } catch (error: any) {
      console.error('[WEBHOOK-TEST] Error:', error);
      setTestResult({
        success: false,
        message: `❌ Erro de conexão: ${error.message}`,
        details: { error: error.message },
      });
      toast.error('Erro ao enviar webhook de teste');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🥝</span>
          Configurações Kiwify
        </CardTitle>
        <CardDescription>
          Configure a integração com Kiwify para processar pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="guide"><BookOpen className="h-3 w-3 mr-1" />Guia</TabsTrigger>
            <TabsTrigger value="test"><TestTube className="h-3 w-3 mr-1" />Teste</TabsTrigger>
            <TabsTrigger value="logs"><ScrollText className="h-3 w-3 mr-1" />Logs</TabsTrigger>
          </TabsList>

          {/* Configuração Kiwify */}
          <TabsContent value="config" className="space-y-4 mt-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Sistema configurado para usar <strong>Kiwify</strong> como gateway de pagamento.
                Suporta PIX, boleto e cartão de crédito.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kiwify_webhook_token">Token do Webhook</Label>
                <Input
                  id="kiwify_webhook_token"
                  value={settings.kiwify_webhook_token}
                  onChange={(e) => setSettings({ ...settings, kiwify_webhook_token: e.target.value })}
                  placeholder="Token para validação dos webhooks"
                />
                <p className="text-xs text-muted-foreground">
                  Este token é usado para validar que as requisições vieram da Kiwify
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kiwify_api_token">API Token (Opcional)</Label>
                <Input
                  id="kiwify_api_token"
                  type="password"
                  value={settings.kiwify_api_token}
                  onChange={(e) => setSettings({ ...settings, kiwify_api_token: e.target.value })}
                  placeholder="Token de API para integrações avançadas"
                />
                <p className="text-xs text-muted-foreground">
                  Necessário apenas para funcionalidades avançadas como consulta de assinaturas
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">URL do Webhook</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Configure este URL no painel da Kiwify para receber notificações de compra:
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                    {webhookBaseUrl}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Eventos Suportados</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <code className="bg-muted px-1 rounded">order_paid</code> - Pagamento confirmado</li>
                  <li>• <code className="bg-muted px-1 rounded">subscription_created</code> - Assinatura criada</li>
                  <li>• <code className="bg-muted px-1 rounded">subscription_renewed</code> - Assinatura renovada</li>
                  <li>• <code className="bg-muted px-1 rounded">subscription_cancelled</code> - Assinatura cancelada</li>
                  <li>• <code className="bg-muted px-1 rounded">refund_requested</code> - Reembolso solicitado</li>
                  <li>• <code className="bg-muted px-1 rounded">chargeback</code> - Chargeback</li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Mapeamento de Produtos</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  O nome do produto na Kiwify deve conter uma das palavras-chave:
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Pro</strong> ou <strong>Profissional</strong> → Plano Pro</li>
                  <li>• <strong>Partner</strong> ou <strong>Parceiro</strong> → Plano Partner</li>
                  <li>• <strong>Premium</strong> → Plano Premium</li>
                </ul>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Configurações
              </Button>

              <Button variant="outline" asChild className="w-full">
                <a href="https://dashboard.kiwify.com.br/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Dashboard Kiwify
                </a>
              </Button>
            </div>
          </TabsContent>

          {/* Teste Webhook */}
          <TabsContent value="test" className="space-y-4 mt-4">
            <Alert>
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                Simule webhooks da Kiwify para testar a integração sem fazer compras reais.
                O email deve ser de um usuário existente no sistema.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test_event">Tipo de Evento</Label>
                <Select value={testEvent} onValueChange={setTestEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENTS.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_email">Email do Usuário</Label>
                <Input
                  id="test_email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="usuario@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  O email deve corresponder a um usuário existente no sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_product">Nome do Produto</Label>
                <Input
                  id="test_product"
                  value={testProduct}
                  onChange={(e) => setTestProduct(e.target.value)}
                  placeholder="MasterQuizz Pro"
                />
                <p className="text-xs text-muted-foreground">
                  Use nomes como "Pro", "Partner" ou "Premium" para testar diferentes planos
                </p>
              </div>

              <Button 
                onClick={sendTestWebhook} 
                disabled={testLoading || !testEmail}
                className="w-full"
              >
                {testLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Webhook de Teste
              </Button>

              {testResult && (
                <div className={`rounded-lg border p-4 ${testResult.success ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                  {testResult.details && (
                    <pre className="bg-muted/50 p-3 rounded text-xs overflow-auto max-h-60">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Guia de Configuração */}
          <TabsContent value="guide" className="mt-4">
            <KiwifySetupGuide />
          </TabsContent>

          {/* Logs de Pagamento */}
          <TabsContent value="logs" className="mt-4">
            <PaymentWebhookLogs />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
