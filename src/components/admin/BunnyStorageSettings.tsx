import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Cloud, Zap, CheckCircle2, AlertTriangle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const BunnyStorageSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBunnyEnabled, setIsBunnyEnabled] = useState(false);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalSizeMb: 0,
    usersWithVideos: 0
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load video provider setting
      const { data: providerData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'video_provider')
        .single();

      setIsBunnyEnabled(providerData?.setting_value === 'bunny');

      // Load video stats
      const { data: videosData } = await supabase
        .from('bunny_videos')
        .select('id, size_mb, user_id')
        .eq('status', 'ready');

      if (videosData) {
        const uniqueUsers = new Set(videosData.map(v => v.user_id));
        setStats({
          totalVideos: videosData.length,
          totalSizeMb: videosData.reduce((acc, v) => acc + (v.size_mb || 0), 0),
          usersWithVideos: uniqueUsers.size
        });
      }

    } catch (error) {
      logger.error('Error loading Bunny settings:', error);
      toast.error(t('bunnyStorage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'video_provider',
          setting_value: isBunnyEnabled ? 'bunny' : 'supabase',
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast.success(t('bunnyStorage.saveSuccess'));
    } catch (error) {
      logger.error('Error saving Bunny settings:', error);
      toast.error(t('bunnyStorage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <CardTitle>{t('bunnyStorage.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('bunnyStorage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">{t('bunnyStorage.useBunny')}</Label>
                {isBunnyEnabled && (
                  <Badge variant="default" className="bg-primary">
                    <Zap className="h-3 w-3 mr-1" />
                    {t('bunnyStorage.active')}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isBunnyEnabled 
                  ? t('bunnyStorage.enabledDesc')
                  : t('bunnyStorage.disabledDesc')
                }
              </p>
            </div>
            <Switch
              checked={isBunnyEnabled}
              onCheckedChange={setIsBunnyEnabled}
            />
          </div>

          {/* Benefits when enabled */}
          {isBunnyEnabled && (
            <Alert className="border-primary/30 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>{t('bunnyStorage.benefits')}</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>{t('bunnyStorage.benefitGlobal')}</li>
                  <li>{t('bunnyStorage.benefitSize')}</li>
                  <li>{t('bunnyStorage.benefitStreaming')}</li>
                  <li>{t('bunnyStorage.benefitCost')}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning when not configured */}
          {!isBunnyEnabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('bunnyStorage.warningDisabled')}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={saveSettings} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('bunnyStorage.saveSettings')}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{t('bunnyStorage.statsTitle')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">{stats.totalVideos}</p>
              <p className="text-sm text-muted-foreground">{t('bunnyStorage.videosInCdn')}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">
                {(stats.totalSizeMb / 1024).toFixed(2)} GB
              </p>
              <p className="text-sm text-muted-foreground">{t('bunnyStorage.storageUsed')}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">{stats.usersWithVideos}</p>
              <p className="text-sm text-muted-foreground">{t('bunnyStorage.usersWithVideos')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      {stats.totalSizeMb > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('bunnyStorage.costEstimate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('bunnyStorage.storageMonthly')}</p>
                <p className="text-xl font-bold">
                  ${((stats.totalSizeMb / 1024) * 0.01).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{t('bunnyStorage.perGb')}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('bunnyStorage.bandwidthEstimate')}</p>
                <p className="text-xl font-bold">
                  ${((stats.totalSizeMb / 1024) * 0.01 * 10).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{t('bunnyStorage.bandwidthMultiplier')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
