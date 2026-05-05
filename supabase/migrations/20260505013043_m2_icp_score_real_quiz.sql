-- M2: ICP Score ganha +15pts quando o usuário tem quiz REAL ativo
-- - JOIN de quizzes passa a excluir Express (creation_source='express_auto')
--   e exigir is_public=true para contar como "ativo real"
-- - Cap de 100 mantido
DROP VIEW IF EXISTS public.user_activity_summary;

CREATE VIEW public.user_activity_summary AS
SELECT p.id AS user_id,
    p.email,
    p.full_name,
    p.created_at,
    p.user_stage,
    p.utm_source,
    p.utm_medium,
    p.utm_campaign,
    p.utm_term,
    p.landing_variant_seen,
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
    COALESCE(us.plan_type, 'free'::plan_type) AS plan_type,
    us.payment_confirmed,
    COALESCE(qz.quiz_count, 0::bigint) AS quiz_count,
    COALESCE(qz.active_quiz_count, 0::bigint) AS active_quiz_count,
    COALESCE(qr.lead_count, 0::bigint) AS lead_count,
    EXTRACT(day FROM now() - p.created_at)::integer AS days_since_signup,
    p.is_icp_profile,
    LEAST(100,
      LEAST(p.upgrade_clicked_count * 15, 30)
      + LEAST(p.paywall_hit_count * 10, 20)
      + CASE WHEN p.first_lead_received_at IS NOT NULL THEN 20 ELSE 0 END
      + CASE WHEN p.form_collection_configured_at IS NOT NULL THEN 10 ELSE 0 END
      + CASE WHEN p.ai_used_on_real_quiz THEN 5 ELSE 0 END
      + LEAST(p.editor_sessions_count, 10)
      + LEAST(p.crm_interactions_count, 10)
      + LEAST(p.quiz_shared_count * 2, 10)
      + CASE WHEN p.is_icp_profile = TRUE THEN 30 ELSE 0 END
      + CASE WHEN COALESCE(qz.active_quiz_count, 0) > 0 THEN 15 ELSE 0 END
    ) AS icp_score
   FROM profiles p
     LEFT JOIN user_subscriptions us ON us.user_id = p.id
     LEFT JOIN (
       SELECT quizzes.user_id,
              count(*) AS quiz_count,
              count(*) FILTER (
                WHERE quizzes.status = 'active'::quiz_status
                  AND COALESCE(quizzes.creation_source, 'manual') <> 'express_auto'
                  AND quizzes.is_public = true
              ) AS active_quiz_count
       FROM quizzes
       GROUP BY quizzes.user_id
     ) qz ON qz.user_id = p.id
     LEFT JOIN (
       SELECT q.user_id,
              count(qr_1.id) AS lead_count
       FROM quiz_responses qr_1
         JOIN quizzes q ON q.id = qr_1.quiz_id
       WHERE qr_1.respondent_email IS NOT NULL OR qr_1.respondent_whatsapp IS NOT NULL
       GROUP BY q.user_id
     ) qr ON qr.user_id = p.id
  WHERE p.deleted_at IS NULL;
