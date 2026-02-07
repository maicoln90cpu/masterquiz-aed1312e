import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, LayoutDashboard, PlusCircle, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export function QuickStart() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: LayoutDashboard,
      title: t('kiwify.quickStart.accessDashboard'),
      description: t('kiwify.quickStart.accessDashboardDesc'),
      action: () => navigate("/dashboard"),
      variant: "default" as const
    },
    {
      icon: PlusCircle,
      title: t('kiwify.quickStart.createFirstQuiz'),
      description: t('kiwify.quickStart.createFirstQuizDesc'),
      action: () => navigate("/create-quiz"),
      variant: "outline" as const
    },
    {
      icon: Settings,
      title: t('kiwify.quickStart.configureProfile'),
      description: t('kiwify.quickStart.configureProfileDesc'),
      action: () => navigate("/settings"),
      variant: "outline" as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{t('kiwify.quickStart.title')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={action.action}
          >
            <action.icon className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
