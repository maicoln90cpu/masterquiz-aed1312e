
-- Tabela de notificações administrativas para o usuário
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications(user_id, read) WHERE read = false;

-- RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver apenas suas próprias notificações
CREATE POLICY "Users can view own notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Usuário pode marcar suas notificações como lidas
CREATE POLICY "Users can update own notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins e service_role podem inserir notificações para qualquer usuário
CREATE POLICY "Service role can insert notifications"
ON public.admin_notifications
FOR INSERT
TO service_role
WITH CHECK (true);
