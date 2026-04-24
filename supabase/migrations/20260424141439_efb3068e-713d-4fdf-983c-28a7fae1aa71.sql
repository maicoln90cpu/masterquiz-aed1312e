-- 4.2: Consolidated dashboard stats RPC
-- Returns totalQuizzes, activeQuizzes, totalResponses in a single round-trip
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(_user_id uuid)
RETURNS TABLE(
  total_quizzes integer,
  active_quizzes integer,
  total_responses bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the user themselves (or admin) can fetch their stats
  IF _user_id IS NULL OR (_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) AND NOT public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  WITH user_quizzes AS (
    SELECT id, status
    FROM public.quizzes
    WHERE user_id = _user_id
      AND COALESCE(creation_source, 'manual') <> 'express_auto'
  )
  SELECT
    COUNT(*)::int AS total_quizzes,
    COUNT(*) FILTER (WHERE status = 'active')::int AS active_quizzes,
    COALESCE((
      SELECT COUNT(*)::bigint
      FROM public.quiz_responses qr
      WHERE qr.quiz_id IN (SELECT id FROM user_quizzes)
    ), 0) AS total_responses
  FROM user_quizzes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;