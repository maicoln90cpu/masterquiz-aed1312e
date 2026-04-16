
-- ═══════════════════════════════════════════════════════════════
-- ETAPA 3 — ICP Tracking: View user_activity_summary + icp_score
-- ═══════════════════════════════════════════════════════════════

-- View agregando todos os sinais de ICP por usuário
CREATE OR REPLACE VIEW public.user_activity_summary
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.email,
  p.full_name,
  p.created_at,
  p.user_stage,
  p.utm_source,
  p.utm_medium,
  p.utm_campaign,
  p.utm_term,
  p.landing_variant_seen,

  -- Métricas Etapa 1 + 2
  p.quiz_shared_count,
  p.paywall_hit_count,
  p.upgrade_clicked_count,
  p.editor_sessions_count,
  p.crm_interactions_count,
  p.ai_used_on_real_quiz,
  p.plan_limit_hit_type,
  p.first_lead_received_at,
  p.form_collection_configured_at,
  p.login_count,

  -- Plano atual
  COALESCE(us.plan_type, 'free') AS plan_type,
  us.payment_confirmed,

  -- Contagens dinâmicas
  COALESCE(qz.quiz_count, 0) AS quiz_count,
  COALESCE(qz.active_quiz_count, 0) AS active_quiz_count,
  COALESCE(qr.lead_count, 0) AS lead_count,

  -- Idade da conta em dias
  EXTRACT(DAY FROM (NOW() - p.created_at))::INT AS days_since_signup,

  -- ═══════════════════════════════════════════════════
  -- ICP SCORE (0-100) — fórmula ponderada
  -- ═══════════════════════════════════════════════════
  -- Sinais de alta intenção (peso maior):
  --   • upgrade_clicked_count → 15 pts cada (cap 30)
  --   • paywall_hit_count → 10 pts cada (cap 20)
  --   • first_lead_received_at → 20 pts (one-shot)
  --   • form_collection_configured_at → 10 pts (one-shot)
  -- Sinais de uso real:
  --   • ai_used_on_real_quiz → 5 pts
  --   • editor_sessions_count → 1 pt cada (cap 10)
  --   • crm_interactions_count → 1 pt cada (cap 10)
  --   • quiz_shared_count → 2 pts cada (cap 10)
  -- Cap final: 100
  LEAST(100,
    LEAST(p.upgrade_clicked_count * 15, 30) +
    LEAST(p.paywall_hit_count * 10, 20) +
    (CASE WHEN p.first_lead_received_at IS NOT NULL THEN 20 ELSE 0 END) +
    (CASE WHEN p.form_collection_configured_at IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN p.ai_used_on_real_quiz THEN 5 ELSE 0 END) +
    LEAST(p.editor_sessions_count, 10) +
    LEAST(p.crm_interactions_count, 10) +
    LEAST(p.quiz_shared_count * 2, 10)
  )::INT AS icp_score

FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON us.user_id = p.id
LEFT JOIN (
  SELECT user_id,
    COUNT(*) AS quiz_count,
    COUNT(*) FILTER (WHERE status = 'active') AS active_quiz_count
  FROM public.quizzes
  GROUP BY user_id
) qz ON qz.user_id = p.id
LEFT JOIN (
  SELECT q.user_id, COUNT(qr.id) AS lead_count
  FROM public.quiz_responses qr
  JOIN public.quizzes q ON q.id = qr.quiz_id
  WHERE qr.respondent_email IS NOT NULL OR qr.respondent_whatsapp IS NOT NULL
  GROUP BY q.user_id
) qr ON qr.user_id = p.id
WHERE p.deleted_at IS NULL;

-- Permissão: a view usa security_invoker, então respeita RLS de profiles.
-- Apenas admins poderão consultar todos os registros (policy "Admins can view all profiles").
GRANT SELECT ON public.user_activity_summary TO authenticated;
