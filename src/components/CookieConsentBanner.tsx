import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, Settings, Shield, BarChart3, Megaphone } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const { 
    consent, 
    showBanner, 
    setShowBanner, 
    acceptAll, 
    rejectAll, 
    savePreferences,
    isLoading 
  } = useCookieConsent();
  
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  });

  if (isLoading || !showBanner) return null;

  const handleSavePreferences = async () => {
    await savePreferences({
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <Card className="max-w-4xl mx-auto shadow-2xl border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t('cookies.title', 'Usamos cookies')}
                </CardTitle>
                <CardDescription>
                  {t('cookies.description', 'Para melhorar sua experiência e personalizar conteúdo')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDetails ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('cookies.summary', 'Utilizamos cookies para análises, funcionalidades e marketing. Você pode aceitar todos, recusar ou personalizar suas preferências.')}
                  {' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    {t('cookies.learnMore', 'Saiba mais')}
                  </Link>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDetails(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {t('cookies.customize', 'Personalizar')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={rejectAll}
                  >
                    {t('cookies.rejectAll', 'Recusar')}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={acceptAll}
                    className="gap-2"
                  >
                    {t('cookies.acceptAll', 'Aceitar todos')}
                  </Button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                {/* Cookie Funcional - Sempre ativo */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">
                        {t('cookies.functional', 'Funcionais')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('cookies.functionalDesc', 'Essenciais para o funcionamento do site')}
                      </p>
                    </div>
                  </div>
                  <Switch checked disabled className="opacity-50" />
                </div>

                {/* Cookie Analytics */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="font-medium">
                        {t('cookies.analytics', 'Analytics')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('cookies.analyticsDesc', 'Nos ajudam a entender como você usa o site')}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => setPreferences(p => ({ ...p, analytics: checked }))}
                  />
                </div>

                {/* Cookie Marketing */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className="font-medium">
                        {t('cookies.marketing', 'Marketing')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('cookies.marketingDesc', 'Permitem anúncios personalizados')}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => setPreferences(p => ({ ...p, marketing: checked }))}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    {t('cookies.back', 'Voltar')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={rejectAll}
                  >
                    {t('cookies.rejectAll', 'Recusar todos')}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSavePreferences}
                  >
                    {t('cookies.savePreferences', 'Salvar preferências')}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
