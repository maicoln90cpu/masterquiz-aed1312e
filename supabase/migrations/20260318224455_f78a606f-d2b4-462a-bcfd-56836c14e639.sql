
-- =====================================================
-- Etapa 1: 12 novos templates de email + triggers
-- =====================================================

-- 1) Insert 12 new email templates
INSERT INTO email_recovery_templates (name, subject, category, trigger_days, is_active, priority, html_content) VALUES

-- MILESTONE: 10 leads
(
  'Marco — 10 Leads Captados',
  '🎉 {first_name}, parabéns! Você atingiu 10 leads!',
  'milestone',
  0,
  true,
  90,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0FA968,#0c8a54);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:26px;margin:20px 0 0;font-weight:700">🎉 10 Leads Captados!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Parabéns! Você acabou de captar seu <strong style="color:#0FA968">10º lead</strong> no MasterQuizz! 🚀</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Isso é só o começo. Veja como acelerar seus resultados:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #0FA968;border-radius:0 8px 8px 0;margin-bottom:8px"><strong style="color:#0F172A">📊 Analise suas respostas</strong><br><span style="color:#64748b;font-size:14px">Descubra padrões nos seus leads para melhorar a conversão</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#f5f3ff;border-left:4px solid #9B30AB;border-radius:0 8px 8px 0"><strong style="color:#0F172A">🎯 Crie mais quizzes</strong><br><span style="color:#64748b;font-size:14px">Cada quiz é um novo canal de captação de leads</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#f0fdf4;border-left:4px solid #0FA968;border-radius:0 8px 8px 0"><strong style="color:#0F172A">🔗 Integre com suas ferramentas</strong><br><span style="color:#64748b;font-size:14px">WhatsApp, Pixel, GTM — potencialize seu funil</span></td></tr></table><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#0FA968" color2="#0c8a54" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Ver meus leads →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Ver meus leads →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- MILESTONE: 50 leads
(
  'Marco — 50 Leads Captados',
  '🔥 {first_name}, 50 leads! Você está voando!',
  'milestone',
  0,
  true,
  90,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#9B30AB,#7b2589);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:26px;margin:20px 0 0;font-weight:700">🔥 50 Leads! Incrível!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Você atingiu <strong style="color:#9B30AB">50 leads captados</strong>! Isso coloca você entre os top 20% dos usuários do MasterQuizz. 🏆</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Agora é hora de escalar:</p><div style="background:linear-gradient(135deg,#f5f3ff,#f0fdf4);border-radius:12px;padding:24px;margin:0 0 24px"><h3 style="color:#0F172A;margin:0 0 12px;font-size:18px">🚀 Próximos passos para escalar:</h3><p style="color:#334155;font-size:15px;margin:4px 0">• <strong>Teste A/B</strong> — Crie variantes para otimizar conversão</p><p style="color:#334155;font-size:15px;margin:4px 0">• <strong>Segmente leads</strong> — Use o CRM para qualificar</p><p style="color:#334155;font-size:15px;margin:4px 0">• <strong>Automatize follow-up</strong> — Integre com WhatsApp</p></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#9B30AB" color2="#7b2589" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Escalar resultados →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#9B30AB,#7b2589);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(155,48,171,0.4)">Escalar resultados →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- MILESTONE: 100 leads
(
  'Marco — 100 Leads Captados',
  '🏆 {first_name}, 100 leads! Você é uma máquina de conversão!',
  'milestone',
  0,
  true,
  90,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:26px;margin:20px 0 0;font-weight:700">🏆 100 Leads! Lendário!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Você atingiu a marca de <strong style="color:#f59e0b">100 leads captados</strong>! 🎯 Isso é simplesmente incrível.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Você está aproveitando todo o potencial da plataforma. Para ir ainda mais longe, considere:</p><div style="background-color:#fffbeb;border-radius:12px;padding:24px;margin:0 0 24px;border:2px solid #fbbf24"><p style="color:#92400e;font-size:16px;margin:0 0 8px;font-weight:700">💎 Dica de quem capta 100+ leads:</p><p style="color:#78350f;font-size:15px;margin:0">Usuários que fazem upgrade para o plano Pro captam em média <strong>3x mais leads</strong> com funcionalidades avançadas como remoção de branding e integrações ilimitadas.</p></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#f59e0b" color2="#d97706" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Continuar crescendo →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(245,158,11,0.4)">Continuar crescendo →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- MILESTONE: 500 leads
(
  'Marco — 500 Leads Captados',
  '👑 {first_name}, 500 leads! Você é um verdadeiro mestre!',
  'milestone',
  0,
  true,
  90,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0F172A,#1e293b);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#fbbf24;font-size:26px;margin:20px 0 0;font-weight:700">👑 500 Leads! Você é MESTRE!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Você alcançou <strong style="color:#fbbf24">500 leads captados</strong>! 👑 Você está entre os <strong>top 1%</strong> dos usuários do MasterQuizz.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Com esse volume, seu negócio tem um ativo valiosíssimo. Certifique-se de estar aproveitando ao máximo:</p><div style="background:linear-gradient(135deg,#0F172A,#1e293b);border-radius:12px;padding:24px;margin:0 0 24px"><p style="color:#fbbf24;font-size:15px;margin:4px 0">✨ Segmentação avançada de leads no CRM</p><p style="color:#fbbf24;font-size:15px;margin:4px 0">✨ Teste A/B para maximizar conversão</p><p style="color:#fbbf24;font-size:15px;margin:4px 0">✨ Relatórios e exportação de dados</p><p style="color:#fbbf24;font-size:15px;margin:4px 0">✨ Integração com todas as suas ferramentas</p></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#0FA968" color2="#0c8a54" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Acessar meu painel →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Acessar meu painel →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- TUTORIAL: 3 days after first quiz
(
  'Tutorial — Otimize seu Quiz',
  '📚 {first_name}, 3 dicas para turbinar seu quiz!',
  'tutorial',
  3,
  true,
  85,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">📚 Tutorial: Otimize seu Quiz</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Você criou seu primeiro quiz há 3 dias! 🎉 Agora vamos garantir que ele esteja <strong>otimizado para converter</strong>.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Aqui vão 3 dicas que nossos melhores usuários aplicam:</p><div style="margin:0 0 16px"><div style="background-color:#eff6ff;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#1e40af;margin:0 0 8px;font-size:16px">1️⃣ Personalize os resultados</h3><p style="color:#334155;font-size:14px;margin:0">Resultados personalizados geram <strong>78% mais compartilhamentos</strong>. Adicione textos específicos por perfil de resposta.</p></div><div style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#166534;margin:0 0 8px;font-size:16px">2️⃣ Ative o formulário de captura</h3><p style="color:#334155;font-size:14px;margin:0">Configure nome + email + WhatsApp para captar leads completos. Coloque <strong>antes do resultado</strong> para maior conversão.</p></div><div style="background-color:#f5f3ff;border-radius:12px;padding:20px"><h3 style="color:#6b21a8;margin:0 0 8px;font-size:16px">3️⃣ Compartilhe em múltiplos canais</h3><p style="color:#334155;font-size:14px;margin:0">Use o link do quiz em redes sociais, email marketing, WhatsApp e site. Cada canal traz um público diferente.</p></div></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#3b82f6" color2="#2563eb" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Otimizar meu quiz →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(59,130,246,0.4)">Otimizar meu quiz →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- SURVEY: 30 days after signup
(
  'Pesquisa de Satisfação',
  '💬 {first_name}, sua opinião vale muito para nós!',
  'survey',
  30,
  true,
  50,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#06b6d4,#0891b2);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">💬 Sua Opinião Importa!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Você está conosco há <strong>30 dias</strong>! 🎂 Nesse tempo, você criou <strong>{quiz_count} quizzes</strong> e captou <strong>{lead_count} leads</strong>.</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Gostaríamos muito de saber: <strong>como está sendo sua experiência?</strong></p><div style="text-align:center;margin:0 0 24px"><p style="color:#334155;font-size:16px;margin:0 0 16px">De 0 a 10, qual a chance de recomendar o MasterQuizz?</p><table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fef2f2;color:#dc2626;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">0</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fef2f2;color:#dc2626;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">1</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fef2f2;color:#dc2626;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">2</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fefce8;color:#ca8a04;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">3</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fefce8;color:#ca8a04;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">4</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fefce8;color:#ca8a04;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">5</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#fefce8;color:#ca8a04;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">6</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#f0fdf4;color:#16a34a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">7</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#f0fdf4;color:#16a34a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">8</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#f0fdf4;color:#16a34a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">9</a></td><td style="padding:4px"><a href="{login_link}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;background:#f0fdf4;color:#16a34a;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">10</a></td></tr></table></div><p style="color:#94a3b8;font-size:14px;text-align:center;margin:0">Clique no número para responder (leva menos de 1 minuto)</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- PLAN_COMPARE: 14 days on free
(
  'Comparativo de Planos',
  '📊 {first_name}, veja o que você está perdendo no plano Free',
  'plan_compare',
  14,
  true,
  45,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#9B30AB,#0FA968);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">Free vs Pro — A Comparação</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Você está no plano <strong>Free</strong> há 14 dias. Com {quiz_count} quizzes e {lead_count} leads, veja o que o plano <strong style="color:#9B30AB">Pro</strong> desbloquearia:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr style="background-color:#f8fafc"><td style="padding:12px 16px;font-weight:700;color:#0F172A;font-size:14px;border-bottom:1px solid #e2e8f0">Recurso</td><td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:14px;text-align:center;border-bottom:1px solid #e2e8f0">Free</td><td style="padding:12px 16px;font-weight:700;color:#9B30AB;font-size:14px;text-align:center;border-bottom:1px solid #e2e8f0">Pro ⭐</td></tr><tr><td style="padding:12px 16px;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9">Quizzes</td><td style="padding:12px 16px;text-align:center;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9">3</td><td style="padding:12px 16px;text-align:center;color:#0FA968;font-size:14px;font-weight:700;border-bottom:1px solid #f1f5f9">Ilimitados ✅</td></tr><tr><td style="padding:12px 16px;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9">Remover branding</td><td style="padding:12px 16px;text-align:center;color:#dc2626;font-size:14px;border-bottom:1px solid #f1f5f9">❌</td><td style="padding:12px 16px;text-align:center;color:#0FA968;font-size:14px;font-weight:700;border-bottom:1px solid #f1f5f9">✅</td></tr><tr><td style="padding:12px 16px;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9">Geração com IA</td><td style="padding:12px 16px;text-align:center;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9">1/mês</td><td style="padding:12px 16px;text-align:center;color:#0FA968;font-size:14px;font-weight:700;border-bottom:1px solid #f1f5f9">Ilimitado ✅</td></tr><tr><td style="padding:12px 16px;color:#334155;font-size:14px">Teste A/B</td><td style="padding:12px 16px;text-align:center;color:#dc2626;font-size:14px">❌</td><td style="padding:12px 16px;text-align:center;color:#0FA968;font-size:14px;font-weight:700">✅</td></tr></table><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#9B30AB" color2="#7b2589" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Ver planos →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#9B30AB,#7b2589);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(155,48,171,0.4)">Ver planos →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- INTEGRATION_GUIDE: 7 days without integrations
(
  'Guia de Integração',
  '🔗 {first_name}, conecte suas ferramentas ao MasterQuizz!',
  'integration_guide',
  7,
  true,
  55,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">🔗 Potencialize com Integrações</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Notamos que você ainda não configurou nenhuma integração. Sabia que integrações podem <strong style="color:#8b5cf6">triplicar seus resultados</strong>?</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Veja como conectar suas ferramentas favoritas em minutos:</p><div style="margin:0 0 24px"><div style="background-color:#f5f3ff;border-radius:12px;padding:20px;margin:0 0 12px;display:flex"><div><h3 style="color:#7c3aed;margin:0 0 8px;font-size:16px">📱 WhatsApp</h3><p style="color:#334155;font-size:14px;margin:0">Receba notificações de novos leads direto no WhatsApp. Responda em tempo real e aumente a conversão.</p></div></div><div style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#166534;margin:0 0 8px;font-size:16px">📊 Google Tag Manager</h3><p style="color:#334155;font-size:14px;margin:0">Rastreie eventos de conversão e otimize suas campanhas de marketing digital.</p></div><div style="background-color:#eff6ff;border-radius:12px;padding:20px"><h3 style="color:#1e40af;margin:0 0 8px;font-size:16px">📈 Facebook Pixel</h3><p style="color:#334155;font-size:14px;margin:0">Configure pixel por quiz para remarketing preciso e públicos personalizados.</p></div></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#8b5cf6" color2="#7c3aed" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Configurar integrações →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(139,92,246,0.4)">Configurar integrações →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- RE-ENGAGEMENT 1 of 3: 21 days
(
  'Reengajamento Educativo 1/3',
  '📖 {first_name}, 5 erros fatais que matam a conversão do seu quiz',
  're_engagement',
  21,
  true,
  35,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0FA968,#0c8a54);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:22px;margin:20px 0 0;font-weight:700">📖 Email 1 de 3 — Série Educativa</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Mesmo que você não esteja usando o MasterQuizz agora, queremos compartilhar conteúdo educativo que pode te ajudar quando decidir voltar.</p><p style="color:#334155;font-size:18px;line-height:1.6;margin:0 0 24px;font-weight:700">5 Erros Fatais que Matam a Conversão do seu Quiz:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;margin-bottom:8px"><strong style="color:#dc2626">1. Perguntas demais</strong><br><span style="color:#64748b;font-size:14px">Quizzes com mais de 10 perguntas perdem 60% dos respondentes</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0"><strong style="color:#dc2626">2. Não pedir dados de contato</strong><br><span style="color:#64748b;font-size:14px">Sem formulário de captura = visitantes que somem para sempre</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0"><strong style="color:#dc2626">3. Resultados genéricos</strong><br><span style="color:#64748b;font-size:14px">Personalização nos resultados aumenta compartilhamento em 78%</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0"><strong style="color:#dc2626">4. Não promover o quiz</strong><br><span style="color:#64748b;font-size:14px">Um quiz sem divulgação é como uma loja sem vitrine</span></td></tr><tr><td style="height:8px"></td></tr><tr><td style="padding:12px 16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0"><strong style="color:#dc2626">5. Ignorar os dados</strong><br><span style="color:#64748b;font-size:14px">Analytics revela exatamente onde os respondentes desistem</span></td></tr></table><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#0FA968" color2="#0c8a54" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Corrigir meu quiz →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Corrigir meu quiz →</a><!--<![endif]--></div><p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">📩 Em 3 dias enviaremos o email 2/3 desta série</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- RE-ENGAGEMENT 2 of 3: 24 days
(
  'Reengajamento Educativo 2/3',
  '📖 {first_name}, como criar um quiz que converte em 10 minutos',
  're_engagement',
  24,
  true,
  34,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#9B30AB,#7b2589);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:22px;margin:20px 0 0;font-weight:700">📖 Email 2 de 3 — Série Educativa</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">No email anterior falamos dos 5 erros fatais. Agora vamos ao <strong>passo a passo para criar um quiz que converte</strong> em apenas 10 minutos!</p><p style="color:#334155;font-size:18px;line-height:1.6;margin:0 0 24px;font-weight:700">Guia Rápido: Quiz que Converte em 10 min</p><div style="margin:0 0 24px"><div style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#166534;margin:0 0 8px;font-size:16px">⏱️ Minutos 1-3: Escolha o tema</h3><p style="color:#334155;font-size:14px;margin:0">Use IA para gerar perguntas sobre seu nicho. Selecione um template pronto ou comece do zero.</p></div><div style="background-color:#f5f3ff;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#6b21a8;margin:0 0 8px;font-size:16px">⏱️ Minutos 4-6: Personalize</h3><p style="color:#334155;font-size:14px;margin:0">Adicione seu logo, ajuste cores, configure 5-7 perguntas objetivas. Menos é mais!</p></div><div style="background-color:#eff6ff;border-radius:12px;padding:20px;margin:0 0 12px"><h3 style="color:#1e40af;margin:0 0 8px;font-size:16px">⏱️ Minutos 7-8: Formulário de captura</h3><p style="color:#334155;font-size:14px;margin:0">Ative nome + email + WhatsApp. Coloque ANTES do resultado para máxima conversão.</p></div><div style="background-color:#f0fdf4;border-radius:12px;padding:20px"><h3 style="color:#166534;margin:0 0 8px;font-size:16px">⏱️ Minutos 9-10: Publique e divulgue</h3><p style="color:#334155;font-size:14px;margin:0">Copie o link e compartilhe em redes sociais, WhatsApp e email marketing.</p></div></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#9B30AB" color2="#7b2589" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Criar meu quiz agora →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#9B30AB,#7b2589);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(155,48,171,0.4)">Criar meu quiz agora →</a><!--<![endif]--></div><p style="color:#94a3b8;font-size:13px;text-align:center;margin:0">📩 Em 3 dias: email 3/3 — Cases de sucesso reais</p></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- RE-ENGAGEMENT 3 of 3: 27 days
(
  'Reengajamento Educativo 3/3',
  '📖 {first_name}, como empresas reais captam leads com quizzes',
  're_engagement',
  27,
  true,
  33,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#0F172A,#1e293b);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#0FA968;font-size:22px;margin:20px 0 0;font-weight:700">📖 Email 3 de 3 — Série Educativa</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 16px">Este é o último email da nossa série educativa. Hoje mostramos <strong>como empresas reais usam quizzes</strong> para captar leads:</p><div style="margin:0 0 24px"><div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin:0 0 16px"><h3 style="color:#166534;margin:0 0 8px;font-size:16px">🏢 Caso 1: Consultoria Financeira</h3><p style="color:#334155;font-size:14px;margin:0 0 8px">Quiz "Qual seu perfil de investidor?" — <strong>320 leads em 30 dias</strong></p><p style="color:#64748b;font-size:13px;margin:0">Resultado: 47% dos leads agendaram consultoria gratuita</p></div><div style="background-color:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:24px;margin:0 0 16px"><h3 style="color:#6b21a8;margin:0 0 8px;font-size:16px">🏋️ Caso 2: Personal Trainer</h3><p style="color:#334155;font-size:14px;margin:0 0 8px">Quiz "Qual treino ideal para você?" — <strong>180 leads em 2 semanas</strong></p><p style="color:#64748b;font-size:13px;margin:0">Resultado: 23% fecharam plano mensal</p></div><div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px"><h3 style="color:#1e40af;margin:0 0 8px;font-size:16px">🎓 Caso 3: Escola de Idiomas</h3><p style="color:#334155;font-size:14px;margin:0 0 8px">Quiz "Qual seu nível de inglês?" — <strong>520 leads em 1 mês</strong></p><p style="color:#64748b;font-size:13px;margin:0">Resultado: 31% se matricularam no curso</p></div></div><div style="background-color:#f0fdf4;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center"><p style="color:#0F172A;font-size:16px;margin:0;font-weight:700">Seu negócio pode ser o próximo case de sucesso! 🚀</p></div><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:320px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#0FA968" color2="#0c8a54" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Criar meu quiz de sucesso →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#0FA968,#0c8a54);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(15,169,104,0.4)">Criar meu quiz de sucesso →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
),

-- WEBINAR: Manual trigger
(
  'Convite para Webinar/Live',
  '🎥 {first_name}, você está convidado(a) para nossa live!',
  'webinar',
  0,
  true,
  70,
  '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:40px 40px 30px;text-align:center"><img src="https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png" alt="MasterQuizz" width="150" style="max-width:150px"><h1 style="color:#ffffff;font-size:24px;margin:20px 0 0;font-weight:700">🎥 LIVE — Você está convidado!</h1></td></tr><tr><td style="padding:40px"><p style="color:#0F172A;font-size:16px;line-height:1.6;margin:0 0 16px">Olá <strong>{first_name}</strong>,</p><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 24px">Preparamos uma live exclusiva para usuários do MasterQuizz! Vamos mostrar como criar quizzes de alta conversão ao vivo.</p><div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border:2px solid #fca5a5;border-radius:16px;padding:32px;text-align:center;margin:0 0 24px"><p style="color:#dc2626;font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;font-weight:700">🔴 AO VIVO</p><p style="color:#0F172A;font-size:22px;font-weight:800;margin:0 0 8px">Como Captar 100+ Leads com Quizzes</p><p style="color:#64748b;font-size:16px;margin:0 0 4px">📅 Data: Em breve</p><p style="color:#64748b;font-size:16px;margin:0">⏰ Horário: 20h (Brasília)</p></div><p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 8px;font-weight:700">O que você vai aprender:</p><p style="color:#334155;font-size:15px;margin:4px 0">✅ Estratégias de quiz que mais convertem</p><p style="color:#334155;font-size:15px;margin:4px 0">✅ Como usar IA para criar perguntas perfeitas</p><p style="color:#334155;font-size:15px;margin:4px 0">✅ Dicas de distribuição e promoção</p><p style="color:#334155;font-size:15px;margin:4px 0 24px">✅ Sessão de perguntas e respostas</p><div style="text-align:center;margin:32px 0"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{login_link}" style="height:52px;v-text-anchor:middle;width:280px" arcsize="23%" fill="true" stroke="false"><v:fill type="gradient" color="#dc2626" color2="#b91c1c" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">Garantir minha vaga →</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="{login_link}" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(220,38,38,0.4)">Garantir minha vaga →</a><!--<![endif]--></div></td></tr><tr><td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0"><p style="color:#94a3b8;font-size:12px;margin:0">© 2025 MasterQuizz. Todos os direitos reservados.</p></td></tr></table></td></tr></table></body></html>'
)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 2) Trigger: Lead Milestone emails
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_lead_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_owner_id uuid;
  v_total_leads bigint;
  v_milestone int;
  v_milestones int[] := ARRAY[10, 50, 100, 500];
  v_template_id uuid;
  v_owner_email text;
  v_owner_name text;
  v_milestone_name text;
BEGIN
  -- Get quiz owner
  SELECT user_id INTO v_quiz_owner_id
  FROM quizzes WHERE id = NEW.quiz_id;

  IF v_quiz_owner_id IS NULL THEN RETURN NEW; END IF;

  -- Count total leads for this owner
  SELECT count(*) INTO v_total_leads
  FROM quiz_responses qr
  JOIN quizzes q ON q.id = qr.quiz_id
  WHERE q.user_id = v_quiz_owner_id
    AND (qr.respondent_email IS NOT NULL OR qr.respondent_whatsapp IS NOT NULL);

  -- Check each milestone
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_total_leads >= v_milestone THEN
      -- Build milestone name for matching
      v_milestone_name := 'Marco — ' || v_milestone || ' Leads Captados';

      -- Get template
      SELECT id INTO v_template_id
      FROM email_recovery_templates
      WHERE name = v_milestone_name AND is_active = true
      LIMIT 1;

      IF v_template_id IS NOT NULL THEN
        -- Check if already sent for this milestone
        IF NOT EXISTS (
          SELECT 1 FROM email_recovery_contacts
          WHERE user_id = v_quiz_owner_id
            AND template_id = v_template_id
            AND status IN ('pending', 'sent', 'opened', 'clicked')
        ) THEN
          -- Get owner email
          SELECT email, full_name INTO v_owner_email, v_owner_name
          FROM profiles WHERE id = v_quiz_owner_id;

          IF v_owner_email IS NOT NULL THEN
            INSERT INTO email_recovery_contacts (
              user_id, email, template_id, status, priority,
              days_inactive_at_contact, user_plan_at_contact,
              user_quiz_count, user_lead_count, scheduled_at
            ) VALUES (
              v_quiz_owner_id, v_owner_email, v_template_id, 'pending', v_milestone,
              0, 'free',
              (SELECT count(*) FROM quizzes WHERE user_id = v_quiz_owner_id),
              v_total_leads,
              now()
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop if exists, then create trigger
DROP TRIGGER IF EXISTS trigger_lead_milestone ON quiz_responses;
CREATE TRIGGER trigger_lead_milestone
  AFTER INSERT ON quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION check_lead_milestone();

-- =====================================================
-- 3) Trigger: Tutorial email 3 days after first quiz
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_first_quiz_tutorial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_count bigint;
  v_template_id uuid;
  v_owner_email text;
BEGIN
  -- Count quizzes for this user (including the new one)
  SELECT count(*) INTO v_quiz_count
  FROM quizzes WHERE user_id = NEW.user_id;

  -- Only trigger on first quiz
  IF v_quiz_count = 1 THEN
    -- Get tutorial template
    SELECT id INTO v_template_id
    FROM email_recovery_templates
    WHERE category = 'tutorial' AND is_active = true
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
      -- Get user email
      SELECT email INTO v_owner_email
      FROM profiles WHERE id = NEW.user_id;

      IF v_owner_email IS NOT NULL THEN
        -- Check not already scheduled
        IF NOT EXISTS (
          SELECT 1 FROM email_recovery_contacts
          WHERE user_id = NEW.user_id AND template_id = v_template_id
        ) THEN
          INSERT INTO email_recovery_contacts (
            user_id, email, template_id, status, priority,
            days_inactive_at_contact, user_quiz_count, user_lead_count,
            scheduled_at
          ) VALUES (
            NEW.user_id, v_owner_email, v_template_id, 'pending', 85,
            0, 1, 0,
            now() + interval '3 days'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_first_quiz_tutorial ON quizzes;
CREATE TRIGGER trigger_first_quiz_tutorial
  AFTER INSERT ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION check_first_quiz_tutorial();
