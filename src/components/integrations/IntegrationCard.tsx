import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Trash2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Integration {
  id: string;
  provider: string;
  is_active: boolean;
  last_sync_at: string | null;
  settings: Record<string, unknown>;
}

interface IntegrationCardProps {
  integration: Integration;
  onConfigure: (integration: Integration) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const providerInfo: Record<string, { name: string; icon: string; color: string; description: string }> = {
  hubspot: {
    name: "HubSpot",
    icon: "🟠",
    color: "bg-orange-500/10 text-orange-500",
    description: "CRM completo com automação de marketing",
  },
  rdstation: {
    name: "RD Station",
    icon: "🟣",
    color: "bg-purple-500/10 text-purple-500",
    description: "Automação de marketing brasileiro",
  },
  pipedrive: {
    name: "Pipedrive",
    icon: "🟢",
    color: "bg-green-500/10 text-green-500",
    description: "CRM focado em vendas e pipeline",
  },
  mailchimp: {
    name: "Mailchimp",
    icon: "🐵",
    color: "bg-yellow-500/10 text-yellow-500",
    description: "Email marketing e automações",
  },
  activecampaign: {
    name: "ActiveCampaign",
    icon: "🔵",
    color: "bg-blue-500/10 text-blue-500",
    description: "Automação avançada de email",
  },
  zapier: {
    name: "Zapier",
    icon: "⚡",
    color: "bg-orange-400/10 text-orange-400",
    description: "Conecte com 5000+ apps via webhook",
  },
  make: {
    name: "Make (Integromat)",
    icon: "🔗",
    color: "bg-indigo-500/10 text-indigo-500",
    description: "Automações visuais avançadas",
  },
  n8n: {
    name: "n8n",
    icon: "🔄",
    color: "bg-pink-500/10 text-pink-500",
    description: "Automação open-source",
  },
};

export function IntegrationCard({ integration, onConfigure, onToggle, onDelete }: IntegrationCardProps) {
  const { t } = useTranslation();
  const [isToggling, setIsToggling] = useState(false);
  
  const info = providerInfo[integration.provider] || {
    name: integration.provider,
    icon: "📦",
    color: "bg-muted text-muted-foreground",
    description: "Integração personalizada",
  };

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    await onToggle(integration.id, checked);
    setIsToggling(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca sincronizado";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <CardTitle className="text-lg">{info.name}</CardTitle>
              <CardDescription className="text-sm">{info.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={integration.is_active}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={info.color}>
            {integration.is_active ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Inativo
              </>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(integration.last_sync_at)}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigure(integration)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(integration.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
