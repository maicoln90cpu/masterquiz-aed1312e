-- Etapa 4.4 — Otimizar load_quiz_public
-- 1. Marcar get_quiz_for_display como STABLE (permite cache de plano de execução)
-- 2. Simplificar agregação de translations (remover DISTINCT desnecessário, já que existe UNIQUE constraint em quiz_id+language_code)
-- 3. Adicionar índices compostos cobrindo ORDER BY para evitar sort em runtime

-- Índices compostos para cobrir ORDER BY order_number (evita sort)
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id_order
  ON public.quiz_results (quiz_id, order_number);

CREATE INDEX IF NOT EXISTS idx_custom_form_fields_quiz_id_order
  ON public.custom_form_fields (quiz_id, order_number);

-- Recriar RPC marcada como STABLE + simplificações
CREATE OR REPLACE FUNCTION public.get_quiz_for_display(
  p_company_slug text DEFAULT NULL::text,
  p_quiz_slug text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  quiz_user_id UUID;
  quiz_record RECORD;
  result_data JSONB;
BEGIN
  IF p_quiz_slug IS NULL OR p_quiz_slug = '' THEN
    RETURN jsonb_build_object('error', 'slug_required');
  END IF;

  IF p_company_slug IS NOT NULL AND p_company_slug != '' THEN
    SELECT id INTO quiz_user_id
    FROM profiles
    WHERE company_slug = p_company_slug
    LIMIT 1;

    IF quiz_user_id IS NULL THEN
      RETURN jsonb_build_object('error', 'company_not_found');
    END IF;
  END IF;

  SELECT * INTO quiz_record
  FROM quizzes q
  WHERE q.slug = p_quiz_slug
    AND q.is_public = true
    AND q.status = 'active'
    AND (quiz_user_id IS NULL OR q.user_id = quiz_user_id)
  LIMIT 1;

  IF quiz_record IS NULL THEN
    RETURN jsonb_build_object('error', 'quiz_not_found');
  END IF;

  SELECT jsonb_build_object(
    'quiz', to_jsonb(quiz_record),
    'questions', (
      SELECT COALESCE(jsonb_agg(to_jsonb(qq) ORDER BY qq.order_number), '[]'::jsonb)
      FROM quiz_questions qq
      WHERE qq.quiz_id = quiz_record.id
    ),
    'results', (
      SELECT COALESCE(jsonb_agg(to_jsonb(qr) ORDER BY qr.order_number), '[]'::jsonb)
      FROM quiz_results qr
      WHERE qr.quiz_id = quiz_record.id
    ),
    'formConfig', (
      SELECT to_jsonb(qf)
      FROM quiz_form_config qf
      WHERE qf.quiz_id = quiz_record.id
      LIMIT 1
    ),
    'customFields', (
      SELECT COALESCE(jsonb_agg(to_jsonb(cf) ORDER BY cf.order_number), '[]'::jsonb)
      FROM custom_form_fields cf
      WHERE cf.quiz_id = quiz_record.id
    ),
    'ownerProfile', (
      SELECT jsonb_build_object(
        'facebook_pixel_id', p.facebook_pixel_id,
        'gtm_container_id', p.gtm_container_id
      )
      FROM profiles p
      WHERE p.id = quiz_record.user_id
      LIMIT 1
    ),
    'translations', (
      -- DISTINCT removido: UNIQUE(quiz_id, language_code) já garante unicidade
      SELECT COALESCE(jsonb_agg(qt.language_code), '[]'::jsonb)
      FROM quiz_translations qt
      WHERE qt.quiz_id = quiz_record.id
    )
  ) INTO result_data;

  RETURN result_data;
END;
$function$;