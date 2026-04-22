import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { FormFieldA11y } from "@/components/ui/form-field-a11y";
import { PageLoading } from "@/components/ui/page-loading";

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesDialog({ open, onOpenChange }: NotificationPreferencesDialogProps) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    notify_new_responses: true,
    notify_weekly_report: false,
  });

  const { data, isLoading: loading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('notify_new_responses, notify_weekly_report')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? { notify_new_responses: true, notify_weekly_report: false };
    },
    staleTime: 60_000,
  });

  // Hidrata estado local quando a query devolve dados.
  useEffect(() => {
    if (data) {
      setPreferences({
        notify_new_responses: data.notify_new_responses,
        notify_weekly_report: data.notify_weekly_report,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...preferences });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Preferências salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      onOpenChange(false);
    },
    onError: (err) => {
      logger.error('Error saving preferences:', err);
      toast.error('Erro ao salvar preferências');
    },
  });
  const saving = saveMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Notificações</DialogTitle>
          <DialogDescription>
            Escolha como você deseja receber notificações sobre seus quizzes
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <PageLoading variant="spinner" label="Carregando preferências…" />
        ) : (
          <div className="space-y-6 py-4">
            <FormFieldA11y
              label="Novas respostas"
              hint="Receber notificação quando alguém responder seus quizzes"
            >
              {(p) => (
                <Switch
                  id={p.id}
                  aria-describedby={p["aria-describedby"]}
                  checked={preferences.notify_new_responses}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notify_new_responses: checked })
                  }
                />
              )}
            </FormFieldA11y>

            <FormFieldA11y
              label="Relatórios semanais"
              hint="Resumo semanal do desempenho dos seus quizzes"
            >
              {(p) => (
                <Switch
                  id={p.id}
                  aria-describedby={p["aria-describedby"]}
                  checked={preferences.notify_weekly_report}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notify_weekly_report: checked })
                  }
                />
              )}
            </FormFieldA11y>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
