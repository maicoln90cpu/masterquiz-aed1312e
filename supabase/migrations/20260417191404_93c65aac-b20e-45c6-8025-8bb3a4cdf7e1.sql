-- Substitui a policy antiga (só admin) por uma que aceita admin OU master_admin
DROP POLICY IF EXISTS "Admins can read login_events" ON public.login_events;

CREATE POLICY "Admins and master admins can read login_events"
ON public.login_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'master_admin'::public.app_role)
);

COMMENT ON POLICY "Admins and master admins can read login_events" ON public.login_events IS
'Permite leitura para roles admin e master_admin. Necessário para cards de métricas no painel admin (ex.: Logins x Cadastros).';