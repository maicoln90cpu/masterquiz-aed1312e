import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { MessageSquare, Loader2, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketUser {
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  user_id: string;
  user?: TicketUser;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

export const SupportTicketsManager = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  useEffect(() => {
    if (selectedTicket) {
      const channel = supabase
        .channel('ticket-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`
          },
          () => loadMessages(selectedTicket.id)
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('status', filter as any)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Buscar dados dos usuários em paralelo
      const userIds = [...new Set((data as any[]).map((t: any) => t.user_id).filter(Boolean))];
      
      let profilesMap = new Map<string, TicketUser>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, whatsapp')
          .in('id', userIds);
        
        profiles?.forEach((p) => {
          profilesMap.set(p.id, {
            full_name: p.full_name,
            email: p.email,
            whatsapp: p.whatsapp,
          });
        });
      }

      const ticketsWithUsers = (data as any[]).map((t: any) => ({
        ...t,
        user: profilesMap.get(t.user_id) || null,
      }));

      setTickets(ticketsWithUsers);
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
        toast.error("Você precisa estar autenticado");
        return;
      }

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: reply
      });

      if (error) throw error;

      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
      }

      toast.success("Resposta enviada com sucesso!");
      setReply('');
      loadMessages(selectedTicket.id);
      loadTickets();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error("Erro ao enviar resposta: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleChangeStatus = async (ticketId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    } else if (newStatus === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success("Status atualizado com sucesso!");
    loadTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: Lista de tickets */}
        <div className="lg:col-span-1 space-y-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">🟢 Abertos</SelectItem>
              <SelectItem value="in_progress">🟡 Em Análise</SelectItem>
              <SelectItem value="resolved">✅ Resolvidos</SelectItem>
              <SelectItem value="closed">🔒 Fechados</SelectItem>
            </SelectContent>
          </Select>

          <div className="space-y-2">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>Nenhum ticket encontrado</p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
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
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{ticket.title}</h4>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    {ticket.user?.full_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        {ticket.user.full_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Coluna direita: Conversa do ticket */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle>{selectedTicket.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Categoria: {selectedTicket.category} | Prioridade: {selectedTicket.priority}
                    </p>
                    {/* Dados do usuário */}
                    {selectedTicket.user && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {selectedTicket.user.full_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {selectedTicket.user.full_name}
                          </span>
                        )}
                        {selectedTicket.user.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {selectedTicket.user.email}
                          </span>
                        )}
                        {selectedTicket.user.whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {selectedTicket.user.whatsapp}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) => handleChangeStatus(selectedTicket.id, v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">🟢 Aberto</SelectItem>
                      <SelectItem value="in_progress">🟡 Em Análise</SelectItem>
                      <SelectItem value="resolved">✅ Resolvido</SelectItem>
                      <SelectItem value="closed">🔒 Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.sender_id === selectedTicket.user_id
                          ? 'bg-accent'
                          : 'bg-primary/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">
                          {msg.sender_id === selectedTicket.user_id ? 'Usuário' : 'Suporte'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                </div>

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
    </div>
  );
};

export default SupportTicketsManager;
