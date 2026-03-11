
-- Table to store WhatsApp AI conversation history
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  template_context_id uuid REFERENCES public.recovery_contacts(id) ON DELETE SET NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by phone
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number, created_at DESC);
CREATE INDEX idx_whatsapp_conversations_user ON public.whatsapp_conversations(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Only admins can view conversations
CREATE POLICY "Admins view all whatsapp conversations"
  ON public.whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- Service role can insert (edge functions)
CREATE POLICY "Service can manage whatsapp conversations"
  ON public.whatsapp_conversations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Table for AI chatbot settings
CREATE TABLE public.whatsapp_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  system_prompt text,
  max_history_messages integer NOT NULL DEFAULT 10,
  rate_limit_per_hour integer NOT NULL DEFAULT 30,
  fallback_message text DEFAULT 'Vou encaminhar sua dúvida para nosso suporte humano. Em breve alguém entrará em contato!',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai settings"
  ON public.whatsapp_ai_settings
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) 
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- Insert default settings
INSERT INTO public.whatsapp_ai_settings (is_enabled, system_prompt, max_history_messages, rate_limit_per_hour)
VALUES (
  false,
  'Você é o assistente virtual do MasterQuiz, uma plataforma de quizzes interativos para infoprodutores e profissionais de marketing digital.

Seu papel:
- Responder dúvidas sobre funcionalidades do MasterQuiz (criar quizzes, coletar leads, analytics, integrações)
- Dar dicas de marketing digital, funis de vendas e infoprodutos
- Ser amigável, objetivo e profissional
- Usar emojis com moderação para tornar a conversa mais humana

Regras:
- Se não souber a resposta ou o tema for muito técnico/específico, diga que vai encaminhar para suporte humano
- Nunca invente funcionalidades que não existem
- Respostas curtas e diretas (máximo 3 parágrafos)
- Sempre em português brasileiro',
  10,
  30
);
