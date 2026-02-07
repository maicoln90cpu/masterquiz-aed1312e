import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MessageSquare, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  sender?: {
    full_name: string | null;
  };
}

export const UserTicketsList = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadTickets();
    getUserId();
  }, []);

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as any);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error(t('components.ticket.authRequired'));
        return;
      }

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: reply
      });

      if (error) throw error;

      toast.success(t('components.ticket.replySuccess'));
      setReply('');
      loadMessages(selectedTicket.id);
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(t('components.ticket.replyError') + ': ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      open: 'default',
      in_progress: 'secondary',
      resolved: 'outline',
      closed: 'outline'
    };

    const labels: Record<string, string> = {
      open: '🟢 Aberto',
      in_progress: '🟡 Em Análise',
      resolved: '✅ Resolvido',
      closed: '🔒 Fechado'
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Você ainda não tem tickets abertos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de tickets */}
      <div className="lg:col-span-1 space-y-2">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            className={`cursor-pointer hover:bg-accent transition-colors ${
              selectedTicket?.id === ticket.id ? 'border-primary' : ''
            }`}
            onClick={() => {
              setSelectedTicket(ticket);
              loadMessages(ticket.id);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-sm flex-1">{ticket.title}</h4>
                {getStatusBadge(ticket.status)}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversa do ticket */}
      <div className="lg:col-span-2">
        {selectedTicket ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedTicket.title}</CardTitle>
                  <CardDescription>
                    Categoria: {selectedTicket.category} | Prioridade: {selectedTicket.priority}
                  </CardDescription>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensagens */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.sender_id === userId
                        ? 'bg-primary/10 ml-8'
                        : 'bg-accent mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {msg.sender_id === userId ? 'Você' : 'Suporte'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Campo de resposta (apenas se não estiver fechado) */}
              {selectedTicket.status !== 'closed' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Digite sua resposta..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleReply} disabled={!reply.trim() || sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                    Enviar Resposta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um ticket para visualizar a conversa</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
