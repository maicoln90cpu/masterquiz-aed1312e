import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, HelpCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function KiwifyCancel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-4">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">{t('kiwifyCancel.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t('kiwifyCancel.description')}
          </p>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate('/precos')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('kiwifyCancel.tryAgain')}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('kiwifyCancel.backToDashboard')}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/faq')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {t('kiwifyCancel.helpCenter')}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              {t('kiwifyCancel.problemDuringPayment')}{" "}
              <a 
                href="mailto:suporte@masterquiz.com" 
                className="text-primary hover:underline"
              >
                {t('kiwifyCancel.contactSupport')}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}