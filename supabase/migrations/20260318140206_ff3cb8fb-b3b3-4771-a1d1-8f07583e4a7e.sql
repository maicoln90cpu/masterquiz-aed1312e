
-- 1) Welcome email trigger on profile creation
CREATE OR REPLACE FUNCTION public.trigger_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  welcome_template_id UUID;
  email_active BOOLEAN;
BEGIN
  -- Check if email system is active
  SELECT is_active INTO email_active FROM email_recovery_settings LIMIT 1;
  IF NOT COALESCE(email_active, false) THEN
    RETURN NEW;
  END IF;

  -- Skip if no email
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  -- Find active welcome template
  SELECT id INTO welcome_template_id
  FROM email_recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority DESC
  LIMIT 1;

  IF welcome_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Queue welcome email immediately
  INSERT INTO email_recovery_contacts (
    user_id, email, status, priority,
    days_inactive_at_contact, scheduled_at, template_id,
    user_plan_at_contact, user_quiz_count, user_lead_count
  ) VALUES (
    NEW.id, NEW.email, 'pending', 100,
    0, now(), welcome_template_id,
    'free', 0, 0
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS on_profile_created_welcome_email ON profiles;
CREATE TRIGGER on_profile_created_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_welcome_email_on_signup();

-- 2) Add unique constraint for email_recovery_contacts to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_recovery_contacts_user_template_unique'
  ) THEN
    ALTER TABLE email_recovery_contacts 
    ADD CONSTRAINT email_recovery_contacts_user_template_unique 
    UNIQUE (user_id, template_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint may already exist or conflict: %', SQLERRM;
END $$;

-- 3) Insert 6 professional email templates
INSERT INTO email_recovery_templates (name, subject, category, trigger_days, is_active, priority, html_content) VALUES
(
  'Boas-vindas ao MasterQuizz',
  '🎉 {first_name}, bem-vindo(a) ao MasterQuizz!',
  'welcome',
  0,
  true,
  100,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bem-vindo ao MasterQuizz</title></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0FA968,#0c8a54);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="180" style="max-width:180px"><h1 style="color:#ffffff;font-size:28px;margin:20px 0 0;font-weight:700">Bem-vindo(a) ao MasterQuizz!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Sua conta foi criada com sucesso! 🚀 Você agora tem acesso à plataforma mais poderosa para criar quizzes interativos e captar leads qualificados.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Veja o que você pode fazer agora:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #0FA968;border-radius:0 8px 8px 0;margin-bottom:8px"><strong style="color:#0F172A">✅ Criar seu primeiro quiz</strong><br><span style="color:#64748b;font-size:14px">Use nosso editor visual intuitivo ou IA</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#f5f3ff;border-left:4px solid #9B30AB;border-radius:0 8px 8px 0"><strong style="color:#0F172A">📊 Captar leads automaticamente</strong><br><span style="color:#64748b;font-size:14px">Formulários integrados em cada quiz</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #0FA968;border-radius:0 8px 8px 0"><strong style="color:#0F172A">📈 Acompanhar resultados em tempo real</strong><br><span style="color:#64748b;font-size:14px">Dashboard com analytics completo</span></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Criar meu primeiro quiz →</a></div><p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0">Se precisar de ajuda, nossa equipe está aqui para você. Basta responder este email ou acessar nossa <a href="{support_link}" style="color:#9B30AB">central de ajuda</a>.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p><p style="color:#94a3b8;font-size:12px;margin:8px 0 0">Você recebeu este email porque criou uma conta no MasterQuizz.</p></td></tr></table></td></tr></table></body></html>'
),
(
  'Check-in — Como está indo?',
  '{first_name}, como está indo com o MasterQuizz? 🤔',
  'check_in',
  3,
  true,
  80,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#9B30AB,#7b2589);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">Tudo bem por aí, {first_name}?</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Notamos que você criou sua conta há alguns dias mas ainda não explorou todo o potencial do MasterQuizz. Sem problemas — estamos aqui para ajudar! 💪</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Sabia que empresas que usam quizzes interativos conseguem <strong style="color:#0FA968">até 3x mais leads</strong> do que formulários tradicionais?</p><div style="background:linear-gradient(135deg,#f0fdf4,#f5f3ff);border-radius:12px;padding:24px;margin:0 0 24px"><h3 style="color:#0F172A;margin:0 0 12px;font-size:18px">🚀 Comece em 3 passos simples:</h3><p style="color:#334155;font-size:15px;margin:4px 0"><strong>1.</strong> Escolha um template ou use IA para gerar perguntas</p><p style="color:#334155;font-size:15px;margin:4px 0"><strong>2.</strong> Personalize cores, logo e formulário de captura</p><p style="color:#334155;font-size:15px;margin:4px 0"><strong>3.</strong> Publique e compartilhe — os leads chegam automaticamente</p></div><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#9B30AB,#7b2589);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(155,48,171,0.4)">Criar meu quiz agora →</a></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),
(
  'Lembrete de Retorno',
  '⏰ {first_name}, seu MasterQuizz está te esperando!',
  'reminder',
  7,
  true,
  60,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0FA968,#0c8a54);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">Sentimos sua falta! 😢</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Faz <strong>{days_inactive} dias</strong> desde sua última visita ao MasterQuizz. Enquanto isso, seus concorrentes podem estar captando leads que poderiam ser seus.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Não deixe essa oportunidade passar! 🎯</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td width="50%" style="padding:16px;background-color:#f0fdf4;border-radius:12px;text-align:center;vertical-align:top"><div style="font-size:32px;margin-bottom:8px">📝</div><strong style="color:#0F172A;font-size:15px">Seus quizzes</strong><div style="color:#0FA968;font-size:28px;font-weight:800;margin:8px 0">{quiz_count}</div></td><td width="16"></td><td width="50%" style="padding:16px;background-color:#f5f3ff;border-radius:12px;text-align:center;vertical-align:top"><div style="font-size:32px;margin-bottom:8px">👥</div><strong style="color:#0F172A;font-size:15px">Seus leads</strong><div style="color:#9B30AB;font-size:28px;font-weight:800;margin:8px 0">{lead_count}</div></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Voltar ao MasterQuizz →</a></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),
(
  'Recuperação — Volte e cresça',
  '🔄 {first_name}, seu potencial no MasterQuizz está parado',
  'recovery',
  14,
  true,
  40,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0F172A,#1e293b);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#0FA968;font-size:24px;margin:20px 0 0;font-weight:700">Seu potencial está esperando</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Já se passaram <strong>{days_inactive} dias</strong> desde sua última visita. Enquanto isso, mais de <strong>500 empresas</strong> estão usando o MasterQuizz para transformar visitantes em clientes.</p><div style="background-color:#fef3c7;border-radius:12px;padding:20px;margin:0 0 24px;border-left:4px solid #f59e0b"><p style="color:#92400e;font-size:15px;margin:0;font-weight:600">⚡ Dado importante:</p><p style="color:#92400e;font-size:14px;margin:8px 0 0">Usuários ativos do MasterQuizz captam em média <strong>47 leads/mês</strong> por quiz publicado. Cada dia parado é uma oportunidade perdida.</p></div><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Você está no plano <strong style="color:#9B30AB">{plan_name}</strong>. Que tal dar o próximo passo?</p><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Reativar minha conta →</a></div><p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0;text-align:center">Precisa de ajuda? <a href="{support_link}" style="color:#9B30AB">Fale conosco</a></p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),
(
  'Oferta Especial — Upgrade com desconto',
  '🎁 {first_name}, presente especial para você voltar!',
  'special_offer',
  21,
  true,
  20,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#9B30AB,#0FA968);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:26px;margin:20px 0 0;font-weight:700">🎁 Oferta Especial para Você</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Sentimos sua falta por aqui! Faz <strong>{days_inactive} dias</strong> que você não acessa o MasterQuizz, e preparamos algo especial para motivar seu retorno:</p><div style="background:linear-gradient(135deg,#f0fdf4,#f5f3ff);border:2px dashed #0FA968;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px"><p style="color:#64748b;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">Oferta exclusiva</p><p style="color:#0FA968;font-size:42px;font-weight:800;margin:0 0 8px">30% OFF</p><p style="color:#0F172A;font-size:18px;font-weight:600;margin:0">no plano Pro por 3 meses</p><p style="color:#94a3b8;font-size:13px;margin:12px 0 0">Válido por 48 horas • Use: <strong style="color:#9B30AB">VOLTA30</strong></p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px"><tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9"><span style="color:#64748b;font-size:14px">✅ Quizzes ilimitados</span></td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9"><span style="color:#64748b;font-size:14px">✅ Remoção da marca MasterQuizz</span></td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9"><span style="color:#64748b;font-size:14px">✅ Integrações avançadas</span></td></tr><tr><td style="padding:10px 0"><span style="color:#64748b;font-size:14px">✅ Suporte prioritário</span></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#9B30AB,#7b2589);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(155,48,171,0.4)">Aproveitar oferta →</a></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),
(
  'Reativação Final',
  '🚀 {first_name}, última chamada — não perca sua conta!',
  'reactivation',
  30,
  true,
  10,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px 40px 30px;text-align:center"><img src="https://masterquiz.lovable.app/lovable-uploads/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">Última Chamada, {first_name}</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Esta é nossa <strong>última tentativa de contato</strong>. Faz <strong>{days_inactive} dias</strong> que você não acessa o MasterQuizz.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Queremos ter certeza: você ainda quer captar leads com quizzes interativos?</p><div style="background-color:#fef2f2;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center"><p style="color:#dc2626;font-size:15px;margin:0;font-weight:600">⚠️ Seus dados e quizzes continuam salvos</p><p style="color:#7f1d1d;font-size:14px;margin:8px 0 0">Mas contas inativas por longos períodos podem ter recursos limitados</p></div><div style="background-color:#f0fdf4;border-radius:12px;padding:24px;margin:0 0 24px"><p style="color:#0F172A;font-size:16px;margin:0 0 12px;font-weight:700">O que acontece quando você volta:</p><p style="color:#334155;font-size:14px;margin:4px 0">🎯 Seus {quiz_count} quizzes continuam prontos para uso</p><p style="color:#334155;font-size:14px;margin:4px 0">👥 Seus {lead_count} leads ainda estão no CRM</p><p style="color:#334155;font-size:14px;margin:4px 0">📊 Todo seu histórico de analytics preservado</p></div><div style="text-align:center;margin:32px 0"><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:18px 56px;border-radius:12px;font-size:18px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Sim, quero voltar! →</a></div><p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;text-align:center">Se não deseja mais receber nossos emails, sem problemas.<br>Responda com "SAIR" e removeremos você da lista.</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
)
ON CONFLICT DO NOTHING;
