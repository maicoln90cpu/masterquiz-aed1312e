import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PlanDetailsProps {
  planName: string;
  planType: string;
  features?: string[];
}

export function PlanDetails({ planName, planType, features = [] }: PlanDetailsProps) {
  const { t } = useTranslation();

  const getDefaultFeatures = (type: string): string[] => {
    switch (type) {
      case 'paid':
        return [
          t('kiwify.planDetails.features.paid.f1'),
          t('kiwify.planDetails.features.paid.f2'),
          t('kiwify.planDetails.features.paid.f3'),
          t('kiwify.planDetails.features.paid.f4'),
        ];
      case 'partner':
        return [
          t('kiwify.planDetails.features.partner.f1'),
          t('kiwify.planDetails.features.partner.f2'),
          t('kiwify.planDetails.features.partner.f3'),
          t('kiwify.planDetails.features.partner.f4'),
          t('kiwify.planDetails.features.partner.f5'),
        ];
      case 'premium':
        return [
          t('kiwify.planDetails.features.premium.f1'),
          t('kiwify.planDetails.features.premium.f2'),
          t('kiwify.planDetails.features.premium.f3'),
          t('kiwify.planDetails.features.premium.f4'),
          t('kiwify.planDetails.features.premium.f5'),
        ];
      default:
        return [
          t('kiwify.planDetails.features.paid.f1'),
          t('kiwify.planDetails.features.paid.f2'),
          t('kiwify.planDetails.features.paid.f3'),
          t('kiwify.planDetails.features.paid.f4'),
        ];
    }
  };

  const planFeatures = features.length > 0 ? features : getDefaultFeatures(planType);

  const getPlanIcon = () => {
    if (planType === 'premium') return <Crown className="h-5 w-5 text-warning" />;
    return null;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getPlanIcon()}
          <CardTitle className="text-lg">{t('kiwify.planDetails.title')}</CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          {planName || planType.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {planFeatures.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-success flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
