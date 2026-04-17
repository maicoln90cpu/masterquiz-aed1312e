-- Etapa 1: Inserir 4 templates de email novos para automações permanentes
-- Categorias: zombie, no_response, draft_abandoned, upgrade_nudge

-- Template 1: Zombie
INSERT INTO public.email_recovery_templates (
  name, category, subject, subject_b, trigger_days, priority, is_active, html_content
) VALUES (
  'Zombie — Crie Seu Primeiro Quiz Real',
  'zombie',
  '{first_name}, sua conta está esperando por você',
  'Em 2 minutos a IA cria seu quiz — quer ver?',
  30,
  8,
  true,
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:600px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Oi {first_name},</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Você criou sua conta no MasterQuizz há um tempo, mas ainda não criou seu primeiro quiz de verdade.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">A IA do MasterQuizz monta tudo pra você em 2 minutos — é só descrever seu negócio em uma frase.</p>
<p style="margin:0 0 24px;text-align:center;"><a href="https://masterquiz.com.br/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Criar meu quiz agora →</a></p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#64748b;">Qualquer dúvida é só responder este email.</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#64748b;">Abraço,<br>Equipe MasterQuizz</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:12px;text-align:center;color:#94a3b8;"><a href="{unsubscribe_link}" style="color:#94a3b8;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr></table></td></tr></table></body></html>'
);

-- Template 2: Quiz Sem Resposta
INSERT INTO public.email_recovery_templates (
  name, category, subject, subject_b, trigger_days, priority, is_active, html_content
) VALUES (
  'Quiz Publicado — Sem Resposta',
  'no_response',
  '{first_name}, seu quiz está publicado mas ainda sem respostas',
  '3 formas rápidas de divulgar seu quiz hoje',
  7,
  8,
  true,
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:600px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Oi {first_name},</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Seu quiz está publicado — isso é ótimo. Mas ele ainda não recebeu nenhuma resposta.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Aqui estão 3 formas rápidas de divulgá-lo hoje, mesmo sem verba em anúncio:</p>
<ol style="margin:0 0 24px;padding-left:20px;font-size:16px;line-height:1.8;color:#334155;">
<li>Compartilhe o link nos stories do Instagram</li>
<li>Envie para sua lista de contatos no WhatsApp</li>
<li>Cole o link na bio do seu perfil</li>
</ol>
<p style="margin:0 0 24px;text-align:center;"><a href="https://masterquiz.com.br/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Acessar meu quiz →</a></p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#64748b;">Abraço,<br>Equipe MasterQuizz</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:12px;text-align:center;color:#94a3b8;"><a href="{unsubscribe_link}" style="color:#94a3b8;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr></table></td></tr></table></body></html>'
);

-- Template 3: Rascunho Abandonado
INSERT INTO public.email_recovery_templates (
  name, category, subject, subject_b, trigger_days, priority, is_active, html_content
) VALUES (
  'Rascunho Abandonado — IA Finaliza',
  'draft_abandoned',
  '{first_name}, seu quiz ainda está como rascunho',
  'A IA pode finalizar seu quiz em 2 minutos',
  7,
  10,
  true,
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:600px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Oi {first_name},</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Você começou a criar um quiz aqui no MasterQuizz — e ele ainda está como rascunho.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">A IA pode gerar todas as perguntas pra você agora. É só acessar e confirmar o tema — em 2 minutos o quiz está pronto pra publicar.</p>
<p style="margin:0 0 24px;text-align:center;"><a href="https://masterquiz.com.br/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Finalizar meu quiz →</a></p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#64748b;">Qualquer dúvida é só responder este email.</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#64748b;">Abraço,<br>Equipe MasterQuizz</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:12px;text-align:center;color:#94a3b8;"><a href="{unsubscribe_link}" style="color:#94a3b8;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr></table></td></tr></table></body></html>'
);

-- Template 4: Upgrade Nudge
INSERT INTO public.email_recovery_templates (
  name, category, subject, subject_b, trigger_days, priority, is_active, html_content
) VALUES (
  'Upgrade Nudge — Limite de Leads Atingido',
  'upgrade_nudge',
  '{first_name}, seus leads estão chegando — mas o limite foi atingido',
  'Você atingiu 15 leads. Os próximos estão sendo perdidos.',
  0,
  15,
  true,
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:32px;max-width:600px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px;color:#0f172a;">Oi {first_name},</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Boa notícia: seu quiz está funcionando e os leads estão chegando.</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">A má notícia: você atingiu o limite de <strong>15 leads do plano gratuito</strong>. Os próximos leads que responderem seu quiz não serão capturados.</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">Para continuar recebendo sem perder nenhum contato:</p>
<p style="margin:0 0 24px;text-align:center;"><a href="https://masterquiz.com.br/planos" style="display:inline-block;background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Ver planos e fazer upgrade →</a></p>
<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#64748b;">Dúvidas? Responda este email.</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#64748b;">Abraço,<br>Equipe MasterQuizz</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
<p style="margin:0;font-size:12px;text-align:center;color:#94a3b8;"><a href="{unsubscribe_link}" style="color:#94a3b8;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr></table></td></tr></table></body></html>'
);