import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Plus, Plug, Loader2 } from "lucide-react";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      toast({
        title: t('integrations.added'),
        description: t('integrations.addedDesc'),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
    },
    onError: (error) => {
      toast({
        title: t('integrations.errorUpdating'),
        description: error.message,
        variant: "destructive",
      });
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : integrations.length === 0 ? (
          <div id="integrations-list" className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('integrations.noIntegrations', 'Nenhuma integração configurada')}</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              {t('integrations.noIntegrationsDesc', 'Conecte seus quizzes com HubSpot, RD Station, Mailchimp e outras ferramentas')}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('integrations.addFirst', 'Adicionar Primeira Integração')}
            </Button>
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
