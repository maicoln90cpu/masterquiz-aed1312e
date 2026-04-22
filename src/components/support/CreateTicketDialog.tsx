import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFieldA11y } from "@/components/ui/form-field-a11y";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTicketDialog = ({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) => {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'suggestion' | 'bug' | 'question' | 'feature_request' | 'other'>('suggestion');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t('components.ticket.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        toast.error(t('components.ticket.authRequired'));
        return;
      }

      // Criar ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title,
          category,
          priority,
          status: 'open'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Criar mensagem inicial
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message
        });

      if (messageError) throw messageError;

      toast.success(t('components.ticket.sendSuccess'));
      setTitle('');
      setMessage('');
      setCategory('suggestion');
      setPriority('medium');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      logger.error('Error creating ticket:', error);
      toast.error(t('components.ticket.sendError') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Sugestão/Dúvida
          </DialogTitle>
          <DialogDescription>
            Envie suas sugestões, dúvidas ou reporte problemas. Nossa equipe analisará e responderá em breve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FormFieldA11y label="Categoria" required>
            {(p) => (
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger id={p.id} aria-describedby={p["aria-describedby"]} aria-required={p["aria-required"]}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">💡 Sugestão</SelectItem>
                  <SelectItem value="bug">🐛 Reportar Bug</SelectItem>
                  <SelectItem value="question">❓ Dúvida</SelectItem>
                  <SelectItem value="feature_request">✨ Solicitar Funcionalidade</SelectItem>
                  <SelectItem value="other">📝 Outro</SelectItem>
                </Select>
              </Select>
            )}
          </FormFieldA11y>

          <FormFieldA11y label="Prioridade">
            {(p) => (
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger id={p.id} aria-describedby={p["aria-describedby"]}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="high">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormFieldA11y>

          <FormFieldA11y
            label="Título"
            required
            hint={`${title.length}/200 caracteres`}
            error={title.length > 0 && title.trim().length < 3 ? "Mínimo 3 caracteres" : undefined}
          >
            {(p) => (
              <Input
                {...p}
                placeholder="Ex: Sugestão de melhoria no dashboard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            )}
          </FormFieldA11y>

          <FormFieldA11y
            label="Mensagem"
            required
            hint={`${message.length}/2000 caracteres`}
          >
            {(p) => (
              <Textarea
                {...p}
                placeholder="Descreva sua sugestão, dúvida ou problema em detalhes..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                maxLength={2000}
              />
            )}
          </FormFieldA11y>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Sugestão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
