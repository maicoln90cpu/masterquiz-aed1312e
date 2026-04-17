-- RPC: verifica se usuário já disparou um evento GTM (dedup global)
CREATE OR REPLACE FUNCTION public.has_user_fired_event(_user_id uuid, _event_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gtm_event_logs
    WHERE user_id = _user_id
      AND event_name = _event_name
    LIMIT 1
  );
$$;

-- Permitir que usuários autenticados consultem (apenas o próprio user_id por boas práticas, mas a RPC é geral)
GRANT EXECUTE ON FUNCTION public.has_user_fired_event(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.has_user_fired_event IS
'Dedup global de eventos GTM: retorna true se já existir registro em gtm_event_logs para o par (user_id, event_name). Substitui dedup baseado em localStorage que falha entre navegadores.';