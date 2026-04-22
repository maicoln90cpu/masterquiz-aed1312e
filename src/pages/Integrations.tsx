import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Plus, Plug } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { EmptyState } from "@/components/ui/empty-state";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { AddIntegrationDialog } from "@/components/integrations/AddIntegrationDialog";
import { IntegrationLogs } from "@/components/integrations/IntegrationLogs";
import { IntegrationsTour } from "@/components/onboarding/IntegrationsTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { logIntegrationAction } from "@/lib/auditLogger";
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

interface Integration {
  id: string;
  provider: string;
  is_active: boolean;
  last_sync_at: string | null;
  settings: Record<string, unknown>;
  api_key?: string;
  webhook_url?: string;
}

export default function Integrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { status } = useOnboarding();

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["user-integrations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Integration[];
    },
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: async ({ 
      provider, 
      config 
    }: { 
      provider: string; 
      config: { api_key?: string; webhook_url?: string; settings?: Record<string, string> } 
    }) => {
      const { data, error } = await supabase.from("user_integrations").insert({
        user_id: user?.id,
        provider,
        api_key: config.api_key || null,
        webhook_url: config.webhook_url || null,
        settings: config.settings || {},
        is_active: true,
      }).select('id').single();

      if (error) throw error;
      
      // Audit log para criação de integração
      await logIntegrationAction('integration:created', data.id, {
        provider,
        has_api_key: !!config.api_key,
        has_webhook: !!config.webhook_url
      });
      
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      toast({
        title: t('integrations.added'),
        description: t('integrations.addedDesc'),
      });
      
      // 🎯 GTM: integration_connected
      import("@/lib/gtmLogger").then(({ pushGTMEvent }) => {
        pushGTMEvent('integration_connected', {
          provider: variables.provider,
        });
      });
    },
    onError: (error) => {
      toast({
        title: t('integrations.errorAdding'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("user_integrations")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    // Optimistic toggle — switch responde imediatamente
    onMutate: async ({ id, isActive }) => {
      const key = ["user-integrations", user?.id];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Integration[]>(key);
      queryClient.setQueryData<Integration[]>(key, (old) =>
        (old || []).map((i) => (i.id === id ? { ...i, is_active: isActive } : i)),
      );
      return { previous, key };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous && ctx?.key) queryClient.setQueryData(ctx.key, ctx.previous);
      toast({
        title: t('integrations.errorUpdating'),
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Buscar provider antes de deletar para o log
      const integration = integrations.find(i => i.id === id);
      
      const { error } = await supabase
        .from("user_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      // Audit log para exclusão de integração
      await logIntegrationAction('integration:deleted', id, {
        provider: integration?.provider,
        was_active: integration?.is_active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      toast({
        title: t('integrations.removed'),
        description: t('integrations.removedDesc'),
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: t('integrations.errorRemoving'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfigure = (integration: Integration) => {
    // For now, just show a toast - could expand to edit dialog
    toast({
      title: t('integrations.comingSoon'),
      description: t('integrations.comingSoonDesc'),
    });
  };

  return (
    <DashboardLayout>
      {!status.integrations_tour_completed && <IntegrationsTour />}
      
      <div className="space-y-6">
        <div id="integrations-header" className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('integrations.title', 'Integrações')}</h1>
            <p className="text-muted-foreground">
              {t('integrations.subtitle', 'Conecte seus quizzes com CRMs, email marketing e automações')}
            </p>
          </div>
          <Button id="integrations-add-button" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('integrations.newIntegration', 'Nova Integração')}
          </Button>
        </div>

        {isLoading ? (
          <PageLoading variant="skeleton" rows={4} />
        ) : integrations.length === 0 ? (
          <div id="integrations-list">
            <EmptyState
              icon={Plug}
              title={t('integrations.noIntegrations', 'Nenhuma integração configurada')}
              description={t('integrations.noIntegrationsDesc', 'Conecte seus quizzes com HubSpot, RD Station, Mailchimp e outras ferramentas')}
              action={{
                label: t('integrations.addFirst', 'Adicionar Primeira Integração'),
                onClick: () => setShowAddDialog(true),
              }}
              size="lg"
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div id="integrations-list" className="lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConfigure={handleConfigure}
                    onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </div>
            </div>
            <div id="integrations-logs">
              <IntegrationLogs />
            </div>
          </div>
        )}
      </div>

      <AddIntegrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={async (provider, config) => { await addMutation.mutateAsync({ provider, config }); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('integrations.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('integrations.removeDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('integrations.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
