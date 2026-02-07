import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  Target, 
  Link2, 
  Globe 
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function PlatformFeatures() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Sparkles,
      title: t('kiwify.platformFeatures.aiCreation'),
      description: t('kiwify.platformFeatures.aiCreationDesc')
    },
    {
      icon: BarChart3,
      title: t('kiwify.platformFeatures.advancedAnalytics'),
      description: t('kiwify.platformFeatures.advancedAnalyticsDesc')
    },
    {
      icon: Users,
      title: t('kiwify.platformFeatures.crmIntegrated'),
      description: t('kiwify.platformFeatures.crmIntegratedDesc')
    },
    {
      icon: Target,
      title: t('kiwify.platformFeatures.customResults'),
      description: t('kiwify.platformFeatures.customResultsDesc')
    },
    {
      icon: Link2,
      title: t('kiwify.platformFeatures.integrations'),
      description: t('kiwify.platformFeatures.integrationsDesc')
    },
    {
      icon: Globe,
      title: t('kiwify.platformFeatures.multiLanguage'),
      description: t('kiwify.platformFeatures.multiLanguageDesc')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('kiwify.platformFeatures.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
