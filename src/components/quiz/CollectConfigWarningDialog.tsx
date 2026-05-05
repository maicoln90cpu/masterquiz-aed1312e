import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { pushGTMEvent } from '@/lib/gtmLogger';

export interface CollectFields {
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId?: string | null;
  onConfirmAndPublish: (fields: CollectFields) => void;
  onPublishAnyway: () => void;
}

/**
 * Modal de aviso B2 — só aparece quando usuário tenta publicar quiz REAL
 * sem nenhum campo de coleta configurado. Combate o gargalo de quizzes
 * publicados que não geram leads.
 */
export const CollectConfigWarningDialog = ({
  open,
  onOpenChange,
  quizId,
  onConfirmAndPublish,
  onPublishAnyway,
}: Props) => {
  const [fields, setFields] = useState<CollectFields>({
    collectName: false,
    collectEmail: true, // sugerido por padrão
    collectWhatsapp: false,
  });

  useEffect(() => {
    if (open) {
      pushGTMEvent('quiz_collect_config_shown', { quiz_id: quizId });
      // reset toggles cada vez que abre
      setFields({ collectName: false, collectEmail: true, collectWhatsapp: false });
    }
  }, [open, quizId]);

  const anySelected = fields.collectName || fields.collectEmail || fields.collectWhatsapp;

  const handleConfirm = () => {
    const enabled: string[] = [];
    if (fields.collectName) enabled.push('name');
    if (fields.collectEmail) enabled.push('email');
    if (fields.collectWhatsapp) enabled.push('whatsapp');
    pushGTMEvent('quiz_collect_config_saved', { quiz_id: quizId, fields: enabled });
    onConfirmAndPublish(fields);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Seu quiz não vai capturar leads</DialogTitle>
          </div>
          <DialogDescription>
            Você não configurou a coleta de Nome, Email ou WhatsApp. Seu quiz
            funcionará normalmente, mas nenhum dado dos visitantes será salvo
            no seu CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ToggleRow
            id="collect-name"
            label="Nome"
            checked={fields.collectName}
            onChange={(v) => setFields((f) => ({ ...f, collectName: v }))}
          />
          <ToggleRow
            id="collect-email"
            label="Email"
            badge="recomendado"
            checked={fields.collectEmail}
            onChange={(v) => setFields((f) => ({ ...f, collectEmail: v }))}
          />
          <ToggleRow
            id="collect-whatsapp"
            label="WhatsApp"
            checked={fields.collectWhatsapp}
            onChange={(v) => setFields((f) => ({ ...f, collectWhatsapp: v }))}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleConfirm} disabled={!anySelected} className="w-full">
            Configurar e publicar
          </Button>
          <div className="w-full">
            <Button
              variant="outline"
              onClick={onPublishAnyway}
              className="w-full"
            >
              Publicar sem coleta
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Você não receberá leads no CRM
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ToggleRow = ({
  id,
  label,
  badge,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  badge?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
    <Label htmlFor={id} className="cursor-pointer flex items-center gap-2">
      {label}
      {badge && (
        <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
    </Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);

export default CollectConfigWarningDialog;