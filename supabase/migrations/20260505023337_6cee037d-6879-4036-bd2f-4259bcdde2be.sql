-- 1. Adiciona coluna first_published_at
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Trigger function
CREATE OR REPLACE FUNCTION public.set_first_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active'
     AND (OLD.status IS DISTINCT FROM 'active')
     AND NEW.first_published_at IS NULL THEN
    NEW.first_published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quizzes_first_published_at ON public.quizzes;
CREATE TRIGGER trg_quizzes_first_published_at
  BEFORE UPDATE OF status ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_first_published_at();

-- 3. Backfill
UPDATE public.quizzes
SET first_published_at = updated_at
WHERE status = 'active'
  AND COALESCE(creation_source, 'manual') != 'express_auto'
  AND first_published_at IS NULL;

-- 4. Template de ativação 24h pós-publicação
INSERT INTO public.email_recovery_templates (name, subject, category, html_content, is_active, priority, trigger_days)
VALUES (
  'Ativação 24h — Divulgue seu quiz',
  '{first_name}, hora de divulgar seu quiz 🚀',
  'activation',
  $html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:600px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:24px;color:#0f172a;">🎉 Parabéns, {first_name}!</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Seu quiz foi publicado com sucesso ontem. Agora vem a parte mais importante: <strong>colocá-lo na frente das pessoas certas.</strong></p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Um quiz só gera leads quando recebe visitantes. E as primeiras 48h após a publicação são o momento de maior tração — vale começar hoje.</p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#0f172a;">3 formas rápidas de divulgar agora</h2>
<ol style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:1.8;color:#334155;">
<li><strong>WhatsApp:</strong> envie para sua lista de contatos e grupos do nicho</li>
<li><strong>Bio do Instagram:</strong> cole o link e mencione no perfil</li>
<li><strong>Stories:</strong> publique 2–3 stories convidando para responder o quiz</li>
</ol>
<p style="margin:0 0 24px;text-align:center;"><a href="https://masterquiz.com.br/dashboard" style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Copiar link do meu quiz →</a></p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748b;">Dica: comece pelo canal onde você já tem audiência. Os primeiros leads costumam vir das pessoas mais próximas.</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#64748b;">Vamos juntos,<br>Equipe MasterQuizz</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:12px;text-align:center;color:#94a3b8;"><a href="{unsubscribe_link}" style="color:#94a3b8;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr></table></td></tr></table></body></html>$html$,
  true,
  10,
  1
)
ON CONFLICT DO NOTHING;