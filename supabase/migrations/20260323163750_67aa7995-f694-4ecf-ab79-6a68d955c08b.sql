CREATE POLICY "Anon can update own session responses"
ON public.quiz_responses FOR UPDATE
TO anon
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);