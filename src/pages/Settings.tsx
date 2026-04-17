import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Save, Trash2, User, AlertTriangle, Loader2, Sparkles, Download, Clock, Shield, Settings2, CreditCard, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { NotificationPreferencesDialog } from "@/components/NotificationPreferencesDialog";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { VideoStorageCard } from "@/components/analytics/VideoStorageCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SettingsTour } from "@/components/onboarding/SettingsTour";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingBadge } from "@/components/onboarding/OnboardingBadge";
import { useOnboarding } from "@/hooks/useOnboarding";
const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const { subscription, isLoading: loadingSubscription, planType, quizLimit, responseLimit } = useSubscriptionLimits();
  const { allowFacebookPixel, allowGTM, allowWhiteLabel } = usePlanFeatures();
  const { status: onboardingStatus } = useOnboarding();
  const [formData, setFormData] = useState({
    full_name: "",
    whatsapp: "",
    company_slug: "",
    facebook_pixel_id: "",
    gtm_container_id: "",
  });
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scheduledDeletion, setScheduledDeletion] = useState<{ scheduled_for: string; cancellation_token: string } | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        whatsapp: profile.whatsapp || "",
        company_slug: profile.company_slug || "",
        facebook_pixel_id: profile.facebook_pixel_id || "",
        gtm_container_id: profile.gtm_container_id || "",
      });
    }
  }, [profile]);

  // Verificar se há exclusão agendada
  useEffect(() => {
    const checkScheduledDeletion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('scheduled_deletions')
        .select('scheduled_for, cancellation_token')
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .maybeSingle();

      if (data) {
        setScheduledDeletion(data);
      }
    };
    checkScheduledDeletion();
  }, []);

  // Validar disponibilidade do slug (RPC: reservado + unicidade + formato)
  const [slugReason, setSlugReason] = useState<string | null>(null);
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === profile?.company_slug) {
      setSlugAvailable(null);
      setSlugReason(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('check_slug_available', { _slug: slug });
      if (error) throw error;
      const result = data as { available: boolean; reason: string };
      setSlugAvailable(result.available);
      setSlugReason(result.reason);
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugAvailable(null);
      setSlugReason(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setFormData({ ...formData, company_slug: sanitized });
    const timer = setTimeout(() => checkSlugAvailability(sanitized), 500);
    return () => clearTimeout(timer);
  };

  // Sugerir slug automático baseado no email do usuário
  const suggestSlug = async () => {
    if (!profile?.id) return;
    setCheckingSlug(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('generate_company_slug', {
        p_email: user?.email || '',
        p_user_id: profile.id,
      });
      if (error) throw error;
      const suggested = String(data || '');
      if (suggested) {
        setFormData((prev) => ({ ...prev, company_slug: suggested }));
        await checkSlugAvailability(suggested);
        toast.success(`Sugestão: ${suggested}`);
      }
    } catch (e) {
      console.error('suggestSlug error', e);
      toast.error('Não foi possível gerar uma sugestão.');
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSave = async () => {
    // Validar slug antes de salvar
    if (formData.company_slug && slugAvailable === false) {
      toast.error(t("settings.slugUnavailable"));
      return;
    }

    // Normalizar GTM ID antes de validar/salvar
    const normalizedGTM = formData.gtm_container_id ? formData.gtm_container_id.trim().toUpperCase() : "";

    // Validar formato do GTM se fornecido
    if (normalizedGTM) {
      const GTM_REGEX = /^GTM-[A-Z0-9]{7,10}$/;
      if (!GTM_REGEX.test(normalizedGTM)) {
        toast.error(t("settings.gtmInvalidFormat"));
        return;
      }
    }

    // Normalizar Facebook Pixel ID antes de validar/salvar
    const normalizedPixel = formData.facebook_pixel_id ? formData.facebook_pixel_id.trim() : "";

    // Validar formato do Pixel se fornecido
    if (normalizedPixel) {
      const PIXEL_REGEX = /^[0-9]{15,16}$/;
      if (!PIXEL_REGEX.test(normalizedPixel)) {
        toast.error(t("settings.pixelInvalidFormat"));
        return;
      }
    }

    // Validate profile settings
    const { profileSettingsSchema } = await import("@/lib/validations");
    const validationResult = profileSettingsSchema.safeParse({
      full_name: formData.full_name || "",
      company_slug: formData.company_slug || "",
      whatsapp: formData.whatsapp || "",
      facebook_pixel_id: normalizedPixel,
      gtm_container_id: normalizedGTM,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0].message;
      toast.error(errorMessage);
      return;
    }

    // Validar Facebook Pixel por plano
    if (formData.facebook_pixel_id && !allowFacebookPixel) {
      toast.error(t("settings.pixelNotAllowed"));
      return;
    }

    // Validar GTM por plano
    if (formData.gtm_container_id && !allowGTM) {
      toast.error(t("settings.gtmNotAllowed"));
      return;
    }

    // Salvar com IDs normalizados
    const { data, error } = await updateProfile({
      ...formData,
      gtm_container_id: normalizedGTM,
      facebook_pixel_id: normalizedPixel,
    });
    if (error) {
      const err = error as any;
      if (err?.code === '23505' && err?.message?.includes('company_slug')) {
        toast.error(t("settings.slugUnavailable", "Este slug já está em uso por outro usuário"));
      } else {
        toast.error(t("settings.errorSaving"));
      }
    } else {
      // Atualizar estado local com dados salvos
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          whatsapp: data.whatsapp || "",
          company_slug: data.company_slug || "",
          facebook_pixel_id: data.facebook_pixel_id || "",
          gtm_container_id: data.gtm_container_id || "",
        });
      }
      toast.success(t("settings.changesSaved"));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("nav.logoutSuccess"));
    navigate("/login");
  };

  // LGPD: Exportar dados do usuário
  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t("settings.notAuthenticated"));

      const response = await supabase.functions.invoke('export-user-data', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw new Error(response.error.message);

      const { data, filename } = response.data;
      
      // Download do arquivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t("settings.exportSuccess", "Dados exportados com sucesso!"));
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error(error.message || t("settings.exportError", "Erro ao exportar dados"));
    } finally {
      setExporting(false);
    }
  };

  // LGPD: Agendar exclusão de conta (30 dias de carência)
  const handleScheduleDeletion = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('delete-user-complete', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: 'schedule', reason: 'Solicitado pelo usuário' }
      });

      if (response.error) throw new Error(response.error.message);

      setScheduledDeletion({
        scheduled_for: response.data.scheduled_for,
        cancellation_token: response.data.cancellation_token
      });
      setDeleteDialogOpen(false);
      toast.success(t("settings.deletionScheduled", `Exclusão agendada para ${response.data.days_remaining} dias`));
    } catch (error: any) {
      console.error('Erro ao agendar exclusão:', error);
      toast.error(error.message || t("settings.deletionError", "Erro ao agendar exclusão"));
    }
  };

  // LGPD: Cancelar exclusão agendada
  const handleCancelDeletion = async () => {
    if (!scheduledDeletion?.cancellation_token) return;
    
    setCancellingDeletion(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('delete-user-complete', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: 'cancel', cancellation_token: scheduledDeletion.cancellation_token }
      });

      if (response.error) throw new Error(response.error.message);

      setScheduledDeletion(null);
      toast.success(t("settings.deletionCancelled", "Exclusão cancelada! Sua conta foi reativada."));
    } catch (error: any) {
      console.error('Erro ao cancelar exclusão:', error);
      toast.error(error.message || t("settings.cancelError", "Erro ao cancelar exclusão"));
    } finally {
      setCancellingDeletion(false);
    }
  };

  const handleDeleteAccount = async () => {
    await handleScheduleDeletion();
  };

  const handleRequestUpgrade = async () => {
    setUpgrading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("settings.userNotAuthenticated"));

      // Buscar algum quiz do usuário para validação
      const { data: quizzes } = await supabase.from("quizzes").select("id").eq("user_id", user.id).limit(1);

      if (!quizzes || quizzes.length === 0) {
        toast.error(t("settings.createQuizBeforeUpgrade"));
        setUpgrading(false);
        return;
      }

      // Criar solicitação de validação
      const { error } = await supabase.from("validation_requests").insert({
        user_id: user.id,
        quiz_id: quizzes[0].id,
        validation_url: window.location.origin + "/settings",
        status: "pending",
        notes: t("settings.upgradeRequestNotes"),
      });

      if (error) throw error;

      toast.success(t("settings.upgradeRequestSent"));
      setUpgradeDialogOpen(false);
    } catch (error: any) {
      console.error("Error requesting upgrade:", error);
      toast.error(error.message || t("settings.errorRequestingUpgrade"));
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || loadingSubscription) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {!onboardingStatus.settings_tour_completed && <SettingsTour />}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("settings.title")}</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleSave} className="flex-1 sm:flex-none text-sm">
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">{t("settings.saveChanges")}</span>
              <span className="xs:hidden">Salvar</span>
            </Button>
            <Button onClick={handleLogout} variant="outline" className="flex-1 sm:flex-none text-sm">
              {t("settings.logout")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList id="settings-tabs" className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.profile", "Perfil")}</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2 py-3">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.integrations", "Integrações")}</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2 py-3">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.planTab", "Plano")}</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2 py-3">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.onboardingTab", "Onboarding")}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.privacyTab", "Privacidade")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 animate-fade-up">
            {/* Onboarding Badge */}
            <OnboardingBadge variant="card" />
            
            <Card id="settings-profile">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <div>
                    <CardTitle>{t("settings.profile")}</CardTitle>
                    <CardDescription>{t("settings.profileDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("settings.fullName")}</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">{t("settings.whatsapp")}</Label>
                    <Input
                      id="whatsapp"
                      placeholder={t("settings.whatsappPlaceholder")}
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{t("settings.whatsappDesc")}</p>
                  </div>
                </div>
                <div id="settings-slug" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-slug">{t("settings.companySlug")}</Label>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">masterquiz.com.br/</span>
                      <Input
                        id="company-slug"
                        placeholder={t("settings.slugPlaceholder")}
                        value={formData.company_slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className={
                          formData.company_slug
                            ? slugAvailable === true
                              ? "border-green-500"
                              : slugAvailable === false
                                ? "border-destructive"
                                : ""
                            : ""
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={suggestSlug}
                        disabled={checkingSlug}
                        className="whitespace-nowrap"
                      >
                        Sugerir
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 min-h-[20px]">
                      {checkingSlug && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="animate-spin">⏳</span>
                          <span>{t("settings.checking")}</span>
                        </div>
                      )}
                      {!checkingSlug && slugAvailable === true && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <span>✓</span>
                          <span>{t("settings.available")}</span>
                        </div>
                      )}
                      {!checkingSlug && slugAvailable === false && (
                        <div className="flex items-center gap-1 text-xs text-destructive">
                          <span>✗</span>
                          <span>
                            {slugReason === 'reserved'
                              ? 'Este slug é reservado pelo sistema. Escolha outro.'
                              : slugReason === 'invalid_format'
                                ? 'Formato inválido (use a-z, 0-9, hífens, 2-50 caracteres)'
                                : t("settings.notAvailable")}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("settings.slugOnlyLetters")}</p>
                  </div>

                  {/* URL Preview Card */}
                  {formData.company_slug && slugAvailable === true && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">Preview da URL Personalizada:</p>
                      <div className="flex items-center gap-2 p-2 bg-background rounded border">
                        <code className="text-sm flex-1 text-primary font-mono">
                          {window.location.host}/{formData.company_slug}/
                          <span className="text-muted-foreground">nome-do-quiz</span>
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.protocol}//${window.location.host}/${formData.company_slug}/`
                            );
                            toast.success("URL base copiada!");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seus quizzes ficarão disponíveis em URLs personalizadas como esta
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card id="settings-notifications">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <div>
                    <CardTitle>{t("settings.notifications")}</CardTitle>
                    <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{t("settings.notificationPreferences")}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.notificationPreferencesDesc")}</p>
                  </div>
                  <Button variant="outline" onClick={() => setNotificationDialogOpen(true)}>
                    {t("settings.configure")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Integrações */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Tracking */}
            <Card id="settings-tracking">
              <CardHeader>
                <CardTitle>{t("settings.tracking")}</CardTitle>
                <CardDescription>{t("settings.trackingDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="facebook-pixel">{t("settings.facebookPixel")}</Label>
                    {!allowFacebookPixel && (
                      <Badge variant="secondary" className="text-xs">
                        {t("settings.premium")}
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="facebook-pixel"
                    placeholder={
                      allowFacebookPixel ? t("settings.facebookPixelPlaceholder") : t("settings.facebookPixelDisabled")
                    }
                    value={formData.facebook_pixel_id}
                    onChange={(e) => setFormData({ ...formData, facebook_pixel_id: e.target.value })}
                    disabled={!allowFacebookPixel}
                  />
                  <p className="text-xs text-muted-foreground">
                    {allowFacebookPixel ? t("settings.facebookPixelDesc") : t("settings.facebookPixelUpgrade")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gtm-container">{t("settings.gtmContainer")}</Label>
                    {!allowGTM && (
                      <Badge variant="secondary" className="text-xs">
                        {t("settings.premium")}
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="gtm-container"
                    placeholder={allowGTM ? t("settings.gtmPlaceholder") : t("settings.gtmDisabled")}
                    value={formData.gtm_container_id}
                    onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
                    disabled={!allowGTM}
                  />
                  <p className="text-xs text-muted-foreground">
                    {allowGTM ? t("settings.gtmDesc") : t("settings.gtmUpgrade")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* White Label (Remover Branding) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("settings.whiteLabel")}</CardTitle>
                    <CardDescription>{t("settings.whiteLabelDesc")}</CardDescription>
                  </div>
                  {!allowWhiteLabel && (
                    <Badge variant="secondary" className="text-xs">
                      {t("settings.premium")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{t("settings.removeBranding")}</p>
                    <p className="text-sm text-muted-foreground">
                      {allowWhiteLabel ? t("settings.brandingMessage") : t("settings.brandingAvailable")}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {allowWhiteLabel ? t("settings.brandingActive") : t("settings.brandingUpgrade")}
                  </div>
                </div>
                {!allowWhiteLabel && <p className="text-xs text-muted-foreground mt-2">{t("settings.brandingInfo")}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Plano & Limites */}
          <TabsContent value="plan" className="space-y-6">
            {/* Account Information */}
            <Card id="settings-plan">
              <CardHeader>
                <CardTitle>{t("settings.account")}</CardTitle>
                <CardDescription>{t("settings.accountDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t("settings.planType")}</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{planType}</p>
                      <Badge
                        variant={planType === "partner" ? "default" : planType === "premium" ? "default" : "secondary"}
                      >
                        {planType === "partner"
                          ? t("settings.planPartner")
                          : planType === "premium"
                            ? t("settings.planPremium")
                            : t("settings.planFree")}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t("common.status")}</Label>
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{subscription?.status || "inactive"}</p>
                      <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
                        {subscription?.status === "active" ? t("settings.statusActive") : t("settings.statusInactive")}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t("settings.quizLimit")}</Label>
                    <p className="font-medium text-primary">
                      {quizLimit} {t("settings.quizzes")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t("settings.responseLimit")}</Label>
                    <p className="font-medium text-accent">
                      {responseLimit} {t("settings.responses")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Storage Usage */}
            <VideoStorageCard />

            {/* Plans Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {t("settings.plansTitle")}
                </CardTitle>
                <CardDescription>{t("settings.plansDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t("settings.plansExplore")}</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                  <li>{t("settings.plansFeature1")}</li>
                  <li>{t("settings.plansFeature2")}</li>
                  <li>{t("settings.plansFeature3")}</li>
                  <li>{t("settings.plansFeature4")}</li>
                </ul>
                <Button onClick={() => navigate("/precos")} className="w-full">
                  {t("settings.plansButton")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Onboarding */}
          <TabsContent value="onboarding" className="space-y-6">
            <OnboardingProgress variant="card" />
          </TabsContent>

          {/* Tab: Privacidade */}
          <TabsContent value="privacy" className="space-y-6">
            {/* LGPD: Seus Dados */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{t("settings.yourData", "Seus Dados")}</CardTitle>
                    <CardDescription>{t("settings.yourDataDesc", "Gerencie seus dados pessoais conforme a LGPD")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{t("settings.exportData", "Exportar meus dados")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.exportDataDesc", "Baixe uma cópia de todos os seus dados (1x por dia)")}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleExportData}
                    disabled={exporting}
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {t("settings.export", "Exportar")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{t("settings.privacyPolicy", "Política de Privacidade")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.privacyPolicyDesc", "Saiba como tratamos seus dados")}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => navigate("/privacy-policy")}>
                    {t("settings.view", "Ver")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div>
                    <CardTitle className="text-destructive">{t("settings.dangerZone")}</CardTitle>
                    <CardDescription>{t("settings.dangerZoneDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledDeletion ? (
                  <div className="p-4 border border-amber-500/50 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        {t("settings.deletionPending", "Exclusão agendada")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("settings.deletionPendingDesc", "Sua conta será excluída em")} {new Date(scheduledDeletion.scheduled_for).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelDeletion}
                      disabled={cancellingDeletion}
                      className="w-full"
                    >
                      {cancellingDeletion ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t("settings.cancelDeletion", "Cancelar exclusão e reativar conta")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("settings.deleteAccount")}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("settings.deleteAccountWarning30Days", "Sua conta será desativada imediatamente e excluída permanentemente após 30 dias. Você pode cancelar a qualquer momento.")}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Notification Dialog */}
      <NotificationPreferencesDialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen} />

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("settings.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("settings.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              {t("settings.deleteConfirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Plan Dialog */}
      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.requestUpgradeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.requestUpgradeDesc")}
              <br />
              <br />
              {t("settings.requestUpgradeNote")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={upgrading}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestUpgrade} disabled={upgrading}>
              {upgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.sending")}
                </>
              ) : (
                t("settings.confirmRequest")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Settings;
