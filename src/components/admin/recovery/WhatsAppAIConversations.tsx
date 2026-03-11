import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, MessageCircle, User, Bot, ChevronLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  phone_number: string;
  user_name: string | null;
  last_message: string;
  last_at: string;
  message_count: number;
}

interface Message {
  id: string;
  role: string;
  content: string;
  tokens_used: number;
  created_at: string;
}

export function WhatsAppAIConversations() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Get distinct phone numbers with latest message
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('phone_number, content, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Group by phone number
      const grouped = new Map<string, Conversation>();
      for (const msg of data || []) {
        if (!grouped.has(msg.phone_number)) {
          grouped.set(msg.phone_number, {
            phone_number: msg.phone_number,
            user_name: null,
            last_message: msg.content.substring(0, 80),
            last_at: msg.created_at,
            message_count: 1,
          });
        } else {
          grouped.get(msg.phone_number)!.message_count++;
        }
      }

      // Try to get user names
      const phones = Array.from(grouped.keys());
      if (phones.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('full_name, whatsapp')
          .in('whatsapp', phones);

        for (const p of profiles || []) {
          if (p.whatsapp && grouped.has(p.whatsapp)) {
            grouped.get(p.whatsapp)!.user_name = p.full_name;
          }
        }
      }

      setConversations(Array.from(grouped.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (phone: string) => {
    setSelectedPhone(phone);
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('id, role, content, tokens_used, created_at')
        .eq('phone_number', phone)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.phone_number.includes(q) ||
      c.user_name?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Message detail view
  if (selectedPhone) {
    const conv = conversations.find((c) => c.phone_number === selectedPhone);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPhone(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-base">
                  {conv?.user_name || selectedPhone}
                </CardTitle>
                <CardDescription>{selectedPhone}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">{messages.length} msgs</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {msg.role === 'assistant' ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {msg.role === 'assistant' && msg.tokens_used > 0 && (
                          <span className="text-xs opacity-50">• {msg.tokens_used} tokens</span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // Conversation list view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversas do Bot IA
            </CardTitle>
            <CardDescription>
              {conversations.length} conversa{conversations.length !== 1 ? 's' : ''} registrada{conversations.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadConversations}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por telefone ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {filteredConversations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {conversations.length === 0
              ? 'Nenhuma conversa ainda. Ative o bot e aguarde respostas dos usuários.'
              : 'Nenhuma conversa encontrada para esta busca.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.phone_number}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => loadMessages(conv.phone_number)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {conv.user_name || conv.phone_number}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {conv.message_count} msgs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 ml-2">
                  {new Date(conv.last_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
