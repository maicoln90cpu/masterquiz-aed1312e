-- Tabela para registrar cada login individualmente
CREATE TABLE public.login_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultas por data
CREATE INDEX idx_login_events_logged_in_at ON public.login_events (logged_in_at DESC);
CREATE INDEX idx_login_events_user_id ON public.login_events (user_id);

-- Enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler (via has_role)
CREATE POLICY "Admins can read login_events"
  ON public.login_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Ninguém insere diretamente — só via função SECURITY DEFINER
-- (não precisa de policy INSERT para authenticated)

-- Função unificada: registra login_event + incrementa login_count
CREATE OR REPLACE FUNCTION public.record_login_event(p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Registrar evento individual
  INSERT INTO public.login_events (user_id) VALUES (p_user_id);
  
  -- Manter compatibilidade com login_count no perfil
  UPDATE profiles
  SET login_count = COALESCE(login_count, 0) + 1
  WHERE id = p_user_id;
END;
$$;