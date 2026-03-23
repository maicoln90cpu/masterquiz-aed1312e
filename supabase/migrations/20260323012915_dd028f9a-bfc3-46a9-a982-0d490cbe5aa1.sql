CREATE POLICY "Admins view all AI generations"
ON public.ai_quiz_generations FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);