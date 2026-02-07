import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateTicketDialog = ({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) => {
  const { t } = useTranslation();
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
      const { data: { user } } = await supabase.auth.getUser();
      
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
      console.error('Error creating ticket:', error);
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
          {/* Categoria */}
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggestion">💡 Sugestão</SelectItem>
                <SelectItem value="bug">🐛 Reportar Bug</SelectItem>
                <SelectItem value="question">❓ Dúvida</SelectItem>
                <SelectItem value="feature_request">✨ Solicitar Funcionalidade</SelectItem>
                <SelectItem value="other">📝 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Baixa</SelectItem>
                <SelectItem value="medium">🟡 Média</SelectItem>
                <SelectItem value="high">🔴 Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Sugestão de melhoria no dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/200 caracteres</p>
          </div>

          {/* Mensagem */}
          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Descreva sua sugestão, dúvida ou problema em detalhes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/2000 caracteres</p>
          </div>
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
