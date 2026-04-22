import { logger } from '@/lib/logger';
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Timer, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import { toast } from "sonner";

interface TrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    currentPlan: string;
    originalPlan?: string | null;
    trialEndDate?: string | null;
  } | null;
  onSuccess: () => void;
}

export const TrialModal = ({ open, onOpenChange, user, onSuccess }: TrialModalProps) => {
  const [trialPlan, setTrialPlan] = useState<string>('paid');
  const [trialDays, setTrialDays] = useState<number>(30);
  const [returnPlan, setReturnPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);

  const isInTrial = !!user?.originalPlan;

  const handleActivateTrial = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 🛡️ P18 — facade única (traceId, retry, toast PT-BR embutidos)
      const { data } = await invokeEdgeFunction<any>('admin-update-subscription', {
        user_id: user.id,
        trial_days: trialDays,
        trial_plan_type: trialPlan,
        original_plan_type: returnPlan,
      });
      if (data?.error) throw new Error(data.error);

      const endDate = new Date(data.trial_end_date);
      toast.success(`✅ Trial ativado! ${user.email} agora tem plano ${trialPlan} até ${endDate.toLocaleDateString('pt-BR')}`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      logger.error('Error activating trial:', err);
      toast.error('Erro ao ativar trial: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTrial = async () => {
    if (!user) return;
    if (!confirm(`Cancelar trial de ${user.email}? Voltará para o plano ${user.originalPlan}.`)) return;
    setIsLoading(true);
    try {
      // 🛡️ P18 — facade única
      const { data } = await invokeEdgeFunction<any>('admin-update-subscription', {
        user_id: user.id,
        cancel_trial: true,
      });
      if (data?.error) throw new Error(data.error);

      toast.success(`Trial cancelado. ${user.email} voltou para o plano ${user.originalPlan}`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error('Erro ao cancelar trial: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Plano Temporário (Trial)
          </DialogTitle>
          <DialogDescription>
            {user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Plano atual:</span>
            <Badge variant="outline">{user.currentPlan}</Badge>
            {isInTrial && (
              <>
                <Badge variant="secondary" className="text-xs">
                  ⏱️ Trial ativo
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (volta para {user.originalPlan})
                </span>
              </>
            )}
          </div>

          {isInTrial && user.trialEndDate && (
            <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>
                  Trial expira em{' '}
                  <strong>
                    {Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} dias
                  </strong>
                  {' '}({new Date(user.trialEndDate).toLocaleDateString('pt-BR')})
                </span>
              </div>
            </div>
          )}

          {!isInTrial && (
            <>
              <div className="space-y-2">
                <Label>Plano temporário</Label>
                <Select value={trialPlan} onValueChange={setTrialPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pro</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Plano de retorno (após trial)</Label>
                <Select value={returnPlan} onValueChange={setReturnPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Pro</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                ⚠️ Após {trialDays} dias, o sistema reverterá automaticamente para o plano <strong>{returnPlan}</strong>.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isInTrial ? (
            <Button variant="destructive" onClick={handleCancelTrial} disabled={isLoading}>
              {isLoading ? 'Cancelando...' : 'Cancelar Trial'}
            </Button>
          ) : (
            <Button onClick={handleActivateTrial} disabled={isLoading}>
              {isLoading ? 'Ativando...' : `✅ Ativar Trial (${trialDays}d)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
