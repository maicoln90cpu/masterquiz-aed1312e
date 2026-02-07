import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, ExternalLink, Settings, Webhook, Link2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = "https://otabjwhvrwtixlyebkvm.supabase.co/functions/v1/kiwify-webhook";
const SUCCESS_URL = "https://masterquiz.lovable.app/kiwify/success";
const CANCEL_URL = "https://masterquiz.lovable.app/kiwify/cancel";

export default function KiwifySetupGuide() {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Siga este guia passo-a-passo para configurar a integração completa com a Kiwify.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full" defaultValue="step-1">
        {/* Step 1: Webhook Configuration */}
        <AccordionItem value="step-1">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground">1</Badge>
              <Webhook className="h-4 w-4" />
              <span>Configurar Webhook na Kiwify</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <ol className="space-y-4 ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.1</span>
                <div>
                  <p>Acesse o painel da Kiwify e vá em <strong>Configurações → Webhooks</strong></p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="https://dashboard.kiwify.com.br/settings/webhooks" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Configurações de Webhook
                    </a>
                  </Button>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.2</span>
                <div className="flex-1">
                  <p>Clique em <strong>"Adicionar Webhook"</strong> e cole a URL abaixo:</p>
                  <div className="flex gap-2 mt-2">
                    <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                      {WEBHOOK_URL}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(WEBHOOK_URL, "URL do Webhook")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.3</span>
                <div>
                  <p>Selecione os eventos que deseja receber:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />order_paid</Badge>
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />subscription_created</Badge>
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />subscription_renewed</Badge>
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />subscription_cancelled</Badge>
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />refund_requested</Badge>
                    <Badge variant="outline" className="justify-start"><CheckCircle className="h-3 w-3 mr-1 text-green-500" />chargeback</Badge>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">1.4</span>
                <p>Salve o webhook</p>
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* Step 2: Token Configuration */}
        <AccordionItem value="step-2">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground">2</Badge>
              <ShieldCheck className="h-4 w-4" />
              <span>Configurar Token de Segurança</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <ol className="space-y-4 ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.1</span>
                <div>
                  <p>Na mesma página de webhooks da Kiwify, localize o campo <strong>"Token de Segurança"</strong></p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.2</span>
                <div>
                  <p>Crie um token seguro (recomendado: 32+ caracteres alfanuméricos)</p>
                  <p className="text-xs text-muted-foreground mt-1">Exemplo: <code className="bg-muted px-1 rounded">meuToken123SecretoParaKiwify</code></p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.3</span>
                <div>
                  <p>Cole o <strong>mesmo token</strong> na aba "Kiwify" deste painel (campo "Token do Webhook")</p>
                  <p className="text-xs text-muted-foreground mt-1">Os tokens devem ser idênticos para a validação funcionar</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">2.4</span>
                <p>Salve as configurações em ambos os locais</p>
              </li>
            </ol>

            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                ⚠️ Se os tokens não coincidirem, os webhooks serão rejeitados com erro 401.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        {/* Step 3: Return URLs */}
        <AccordionItem value="step-3">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground">3</Badge>
              <Link2 className="h-4 w-4" />
              <span>Configurar URLs de Retorno</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Configure as URLs para onde o usuário será redirecionado após o pagamento:
            </p>

            <ol className="space-y-4 ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.1</span>
                <div className="flex-1">
                  <p>Acesse as configurações do seu <strong>Produto</strong> na Kiwify</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.2</span>
                <div className="flex-1">
                  <p><strong>URL de Sucesso</strong> (após pagamento aprovado):</p>
                  <div className="flex gap-2 mt-2">
                    <code className="flex-1 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 p-2 rounded text-xs break-all">
                      {SUCCESS_URL}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(SUCCESS_URL, "URL de Sucesso")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.3</span>
                <div className="flex-1">
                  <p><strong>URL de Cancelamento</strong> (se desistir do pagamento):</p>
                  <div className="flex gap-2 mt-2">
                    <code className="flex-1 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 p-2 rounded text-xs break-all">
                      {CANCEL_URL}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(CANCEL_URL, "URL de Cancelamento")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">3.4</span>
                <p>Salve as configurações do produto</p>
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* Step 4: Testing */}
        <AccordionItem value="step-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground">4</Badge>
              <ArrowRight className="h-4 w-4" />
              <span>Testar a Integração</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <ol className="space-y-4 ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.1</span>
                <div>
                  <p>Use a aba <strong>"Teste Webhook"</strong> deste painel para simular eventos</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.2</span>
                <div>
                  <p>Ou use o botão <strong>"Testar Webhook"</strong> no painel da Kiwify</p>
                  <p className="text-xs text-muted-foreground mt-1">Selecione o evento desejado e clique em testar</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.3</span>
                <div>
                  <p>Verifique os logs na aba <strong>"Logs de Pagamento"</strong></p>
                  <p className="text-xs text-muted-foreground mt-1">Os webhooks recebidos devem aparecer com status "Sucesso"</p>
                </div>
              </li>

              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">4.4</span>
                <div>
                  <p>Faça uma compra de teste para validar o fluxo completo</p>
                  <p className="text-xs text-muted-foreground mt-1">Use o modo de teste da Kiwify se disponível</p>
                </div>
              </li>
            </ol>

            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                ✅ Quando um pagamento for aprovado, o plano do usuário será atualizado automaticamente.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Mapeamento de Planos</h4>
        <p className="text-sm text-muted-foreground mb-3">
          O nome do produto na Kiwify é usado para determinar qual plano ativar:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Plano Pro</p>
            <p className="text-xs text-muted-foreground">Nome contém: "Pro" ou "Profissional"</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Plano Partner</p>
            <p className="text-xs text-muted-foreground">Nome contém: "Partner" ou "Parceiro"</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">Plano Premium</p>
            <p className="text-xs text-muted-foreground">Nome contém: "Premium"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
