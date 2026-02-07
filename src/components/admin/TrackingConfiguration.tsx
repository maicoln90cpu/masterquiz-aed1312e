import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, Shield, ShieldOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

interface TrackingSettings {
  gtm_container_id: string;
  facebook_pixel_id: string;
  require_cookie_consent: boolean;
}

export const TrackingConfiguration = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TrackingSettings>({
    gtm_container_id: "",
    facebook_pixel_id: "",
    require_cookie_consent: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["gtm_container_id", "facebook_pixel_id", "require_cookie_consent"]);

      if (error) throw error;

      const settingsObj: TrackingSettings = {
        gtm_container_id: "",
        facebook_pixel_id: "",
        require_cookie_consent: true,
      };

      data?.forEach((item) => {
        if (item.setting_key === "gtm_container_id") {
          settingsObj.gtm_container_id = item.setting_value || "";
        } else if (item.setting_key === "facebook_pixel_id") {
          settingsObj.facebook_pixel_id = item.setting_value || "";
        } else if (item.setting_key === "require_cookie_consent") {
          settingsObj.require_cookie_consent = item.setting_value !== "false";
        }
      });

      setSettings(settingsObj);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: t('tracking.loadError', 'Erro ao carregar configurações'),
        description: t('tracking.loadErrorDesc', 'Não foi possível carregar as configurações de tracking.'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // ✅ Normalizar GTM ID
      const normalizedGTM = settings.gtm_container_id 
        ? settings.gtm_container_id.trim().toUpperCase() 
        : '';

      // ✅ Validar formato do GTM se fornecido
      if (normalizedGTM) {
        const GTM_REGEX = /^GTM-[A-Z0-9]{7,10}$/;
        if (!GTM_REGEX.test(normalizedGTM)) {
          toast({
            title: t('tracking.invalidFormat', 'Formato inválido'),
            description: t('tracking.gtmFormatError', 'GTM Container ID deve seguir o formato: GTM-XXXXXXX (7-10 caracteres alfanuméricos)'),
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      // ✅ Normalizar Facebook Pixel ID
      const normalizedPixel = settings.facebook_pixel_id 
        ? settings.facebook_pixel_id.trim() 
        : '';

      // ✅ Validar formato do Pixel se fornecido
      if (normalizedPixel) {
        const PIXEL_REGEX = /^[0-9]{15,16}$/;
        if (!PIXEL_REGEX.test(normalizedPixel)) {
          toast({
            title: t('tracking.invalidFormat', 'Formato inválido'),
            description: t('tracking.pixelFormatError', 'Facebook Pixel ID deve ter 15-16 dígitos numéricos'),
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      // Upsert GTM ID
      const { error: gtmError } = await supabase
        .from("system_settings")
        .upsert({
          setting_key: "gtm_container_id",
          setting_value: normalizedGTM,
        }, {
          onConflict: "setting_key",
        });

      if (gtmError) throw gtmError;

      // Upsert Facebook Pixel ID
      const { error: pixelError } = await supabase
        .from("system_settings")
        .upsert({
          setting_key: "facebook_pixel_id",
          setting_value: normalizedPixel,
        }, {
          onConflict: "setting_key",
        });

      if (pixelError) throw pixelError;

      // Upsert Cookie Consent Setting
      const { error: consentError } = await supabase
        .from("system_settings")
        .upsert({
          setting_key: "require_cookie_consent",
          setting_value: settings.require_cookie_consent ? "true" : "false",
        }, {
          onConflict: "setting_key",
        });

      if (consentError) throw consentError;

      // ✅ Atualizar estado local com valores normalizados
      setSettings({
        gtm_container_id: normalizedGTM,
        facebook_pixel_id: normalizedPixel,
        require_cookie_consent: settings.require_cookie_consent,
      });

      toast({
        title: t('tracking.saved', 'Configurações salvas'),
        description: t('tracking.savedDesc', 'As configurações de tracking foram atualizadas. Recarregue a página para aplicar.'),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t('tracking.saveError', 'Erro ao salvar'),
        description: t('tracking.saveErrorDesc', 'Não foi possível salvar as configurações.'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('tracking.configureInfo', 'Configure os IDs de tracking centralizadamente. Após salvar, recarregue a página para aplicar as mudanças.')}
        </AlertDescription>
      </Alert>

      {/* Cookie Consent Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.require_cookie_consent ? (
              <Shield className="h-5 w-5 text-primary" />
            ) : (
              <ShieldOff className="h-5 w-5 text-destructive" />
            )}
            {t('tracking.cookieConsent.title', 'Consentimento de Cookies (LGPD)')}
          </CardTitle>
          <CardDescription>
            {t('tracking.cookieConsent.description', 'Controle se o site deve exigir consentimento antes de carregar scripts de tracking')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <Label className="font-medium">{t('tracking.cookieConsent.requireLabel', 'Exigir consentimento de cookies')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('tracking.cookieConsent.requireDesc', 'Quando ativado, o banner de cookies aparece e GTM só carrega após aceite')}
              </p>
            </div>
            <Switch 
              checked={settings.require_cookie_consent}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, require_cookie_consent: checked })
              }
            />
          </div>
          
          {settings.require_cookie_consent ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                ✅ <strong>{t('tracking.cookieConsent.lgpdActive', 'Modo LGPD ativo:')}</strong> {t('tracking.cookieConsent.lgpdActiveDesc', 'Banner de cookies aparece para visitantes. GTM/Pixel só carrega após usuário aceitar cookies de analytics/marketing.')}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ <strong>{t('tracking.cookieConsent.warning', 'ATENÇÃO:')}</strong> {t('tracking.cookieConsent.warningDesc', 'Desativar o consentimento pode violar a LGPD. GTM/Pixel carregarão imediatamente para todos os visitantes. Use apenas se tiver outra forma de obter consentimento ou se seu site não opera no Brasil.')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tracking.gtm.title', 'Google Tag Manager')}</CardTitle>
          <CardDescription>
            {t('tracking.gtm.description', 'Configure o ID do container GTM (formato: GTM-XXXXXXX)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gtm_id">{t('tracking.gtm.containerIdLabel', 'Container ID do GTM')}</Label>
            <Input
              id="gtm_id"
              placeholder="GTM-XXXXXXX"
              value={settings.gtm_container_id}
              onChange={(e) =>
                setSettings({ ...settings, gtm_container_id: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              {t('tracking.gtm.findId', 'Encontre seu ID em: Google Tag Manager → Admin → Container ID')}
            </p>
          </div>

          {settings.gtm_container_id && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('tracking.gtm.configured', 'GTM configurado:')} {settings.gtm_container_id}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('tracking.pixel.title', 'Facebook Pixel')}</CardTitle>
          <CardDescription>
            {t('tracking.pixel.description', 'Configure o ID do Facebook Pixel (apenas números)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fb_pixel_id">{t('tracking.pixel.pixelIdLabel', 'Pixel ID')}</Label>
            <Input
              id="fb_pixel_id"
              placeholder="1234567890123456"
              value={settings.facebook_pixel_id}
              onChange={(e) =>
                setSettings({ ...settings, facebook_pixel_id: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              {t('tracking.pixel.findId', 'Encontre seu ID em: Meta Business Suite → Eventos → Pixels')}
            </p>
          </div>

          {settings.facebook_pixel_id && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('tracking.pixel.configured', 'Facebook Pixel configurado:')} {settings.facebook_pixel_id}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('tracking.saveButton', 'Salvar Configurações')}
        </Button>
      </div>
    </div>
  );
};
