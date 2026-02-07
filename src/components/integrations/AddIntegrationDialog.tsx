import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Loader2 } from "lucide-react";

type ProviderType = "hubspot" | "rdstation" | "pipedrive" | "mailchimp" | "activecampaign" | "zapier" | "make" | "n8n";

interface AddIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (provider: ProviderType, config: IntegrationConfig) => Promise<void>;
}

interface IntegrationConfig {
  api_key?: string;
  api_secret?: string;
  webhook_url?: string;
  settings?: Record<string, string>;
}

const providers: { id: ProviderType; name: string; icon: string; category: "crm" | "email" | "automation"; docUrl: string }[] = [
  { id: "hubspot", name: "HubSpot", icon: "🟠", category: "crm", docUrl: "https://developers.hubspot.com/docs/api/private-apps" },
  { id: "rdstation", name: "RD Station", icon: "🟣", category: "crm", docUrl: "https://developers.rdstation.com/pt-BR/reference/contacts" },
  { id: "pipedrive", name: "Pipedrive", icon: "🟢", category: "crm", docUrl: "https://developers.pipedrive.com/docs/api/v1" },
  { id: "mailchimp", name: "Mailchimp", icon: "🐵", category: "email", docUrl: "https://mailchimp.com/developer/marketing/api/" },
  { id: "activecampaign", name: "ActiveCampaign", icon: "🔵", category: "email", docUrl: "https://developers.activecampaign.com/reference" },
  { id: "zapier", name: "Zapier", icon: "⚡", category: "automation", docUrl: "https://zapier.com/apps/webhook/integrations" },
  { id: "make", name: "Make", icon: "🔗", category: "automation", docUrl: "https://www.make.com/en/help/tools/webhooks" },
  { id: "n8n", name: "n8n", icon: "🔄", category: "automation", docUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" },
];

export function AddIntegrationDialog({ open, onOpenChange, onAdd }: AddIntegrationDialogProps) {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<IntegrationConfig>({});

  const handleSubmit = async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    try {
      await onAdd(selectedProvider, config);
      setSelectedProvider(null);
      setConfig({});
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderForm = () => {
    if (!selectedProvider) return null;

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return null;

    if (provider.category === "automation") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              placeholder="https://hooks.zapier.com/..."
              value={config.webhook_url || ""}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL do webhook gerada no {provider.name}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api_key">API Key / Token</Label>
          <Input
            id="api_key"
            type="password"
            placeholder="Sua API key..."
            value={config.api_key || ""}
            onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
          />
        </div>

        {selectedProvider === "activecampaign" && (
          <div className="space-y-2">
            <Label htmlFor="account_url">URL da Conta</Label>
            <Input
              id="account_url"
              type="url"
              placeholder="https://suaconta.api-us1.com"
              value={config.settings?.account_url || ""}
              onChange={(e) => setConfig({ 
                ...config, 
                settings: { ...config.settings, account_url: e.target.value }
              })}
            />
          </div>
        )}

        {selectedProvider === "mailchimp" && (
          <div className="space-y-2">
            <Label htmlFor="list_id">ID da Lista/Audiência</Label>
            <Input
              id="list_id"
              placeholder="abc123def"
              value={config.settings?.list_id || ""}
              onChange={(e) => setConfig({ 
                ...config, 
                settings: { ...config.settings, list_id: e.target.value }
              })}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em Audience → Settings → Audience name and defaults
            </p>
          </div>
        )}

        {selectedProvider === "pipedrive" && (
          <div className="space-y-2">
            <Label htmlFor="pipeline_id">ID do Pipeline (opcional)</Label>
            <Input
              id="pipeline_id"
              placeholder="1"
              value={config.settings?.pipeline_id || ""}
              onChange={(e) => setConfig({ 
                ...config, 
                settings: { ...config.settings, pipeline_id: e.target.value }
              })}
            />
          </div>
        )}

        <a 
          href={provider.docUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Como obter a API Key
        </a>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedProvider ? `Configurar ${providers.find(p => p.id === selectedProvider)?.name}` : "Adicionar Integração"}
          </DialogTitle>
          <DialogDescription>
            {selectedProvider 
              ? "Insira as credenciais para conectar sua conta"
              : "Escolha uma plataforma para integrar com seus quizzes"
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedProvider ? (
          <Tabs defaultValue="crm" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crm">CRMs</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="automation">Automação</TabsTrigger>
            </TabsList>

            {(["crm", "email", "automation"] as const).map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {providers
                    .filter(p => p.category === category)
                    .map((provider) => (
                      <Button
                        key={provider.id}
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setSelectedProvider(provider.id)}
                      >
                        <span className="text-2xl">{provider.icon}</span>
                        <span>{provider.name}</span>
                      </Button>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-6 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProvider(null);
                setConfig({});
              }}
            >
              ← Voltar
            </Button>

            {renderProviderForm()}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || (!config.api_key && !config.webhook_url)}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Conectar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
