-- =============================================================================
-- ETAPA 1: 6 novos templates + UPDATE subject_b do limit_warning existente
-- Idempotente: guard WHERE NOT EXISTS por category; UPDATE só preenche se NULL/vazio
-- =============================================================================

-- TEMPLATE 1 — Nurture Dia 3
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Nurture — Dia 3 — O que o quiz faz pelo funil',
  'nurture_d3', 3, 5, true,
  '{first_name}, você sabe o que acontece quando um lead chega qualificado?',
  'Quiz no funil: a diferença entre vender e convencer',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">A maioria dos infoprodutores manda o lead direto para o checkout.</p>
  <p style="line-height:1.7">O problema: o lead chega frio. Não sabe se o produto é para ele. Não está convencido. A taxa de conversão sofre.</p>
  <p style="line-height:1.7">Quem usa quiz antes do checkout faz diferente. O lead responde perguntas, se identifica com os resultados — e chega na página de vendas já convencido de que precisa do que você oferece.</p>
  <p style="line-height:1.7">É a diferença entre <strong>vender</strong> e <strong>deixar o lead se convencer sozinho</strong>.</p>
  <p style="line-height:1.7">Você já tem tudo que precisa para montar esse quiz. A IA do MasterQuizz cria as perguntas em 2 minutos — é só descrever seu negócio em uma frase.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/create-quiz"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Criar meu quiz agora →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'nurture_d3');

-- TEMPLATE 2 — Nurture Dia 7
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Nurture — Dia 7 — Prova Social',
  'nurture_d7', 7, 5, true,
  '{first_name}, veja como esse infoprodutor qualifica leads com quiz',
  '7 leads em 22 dias usando quiz no funil — como foi feito',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">Um dos nossos usuários cadastrou no MasterQuizz, criou um quiz sobre o negócio dele e publicou.</p>
  <p style="line-height:1.7">Em 22 dias, recebeu 7 leads qualificados direto no CRM — com nome, email e WhatsApp de cada um.</p>
  <p style="line-height:1.7">No dia 22, assinou o plano pago.</p>
  <p style="line-height:1.7">Não porque recebeu desconto. Não porque viu um anúncio. Porque viu o produto funcionando para o negócio dele.</p>
  <p style="line-height:1.7">O quiz funcionou como filtro: chegaram só as pessoas certas, no momento certo.</p>
  <p style="line-height:1.7">Você pode montar o mesmo funil hoje. Em 2 minutos a IA cria tudo — perguntas, resultados, formulário de captura.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/create-quiz"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Criar meu quiz agora →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'nurture_d7');

-- TEMPLATE 3 — Nurture Dia 14
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Nurture — Dia 14 — Quebra de Objeção',
  'nurture_d14', 14, 5, true,
  '{first_name}, criar quiz é mais simples do que parece',
  'Não tenho tempo para isso — entendo. Mas veja isso.',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">Criar quiz parece trabalhoso. Precisa pensar nas perguntas, nos resultados, no design, na lógica...</p>
  <p style="line-height:1.7">A maioria desiste antes de começar.</p>
  <p style="line-height:1.7">Mas aqui vai o que acontece na prática com o MasterQuizz: você descreve seu negócio ou produto em uma frase. A IA cria as perguntas, os resultados e o formulário de captura automaticamente.</p>
  <p style="line-height:1.7">Você ajusta o que quiser — ou publica do jeito que está.</p>
  <p style="line-height:1.7">O quiz todo fica pronto em menos tempo do que você levou para ler esse email.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/create-quiz"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Testar agora — é gratuito →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'nurture_d14');

-- TEMPLATE 4 — Nurture Dia 21
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Nurture — Dia 21 — Urgência Leve',
  'nurture_d21', 21, 5, true,
  '{first_name}, sua conta gratuita tem tudo que você precisa — por enquanto',
  'Você ainda não criou seu quiz. O que está travando?',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">Você criou sua conta no MasterQuizz há algumas semanas.</p>
  <p style="line-height:1.7">Ainda não criou seu quiz de verdade.</p>
  <p style="line-height:1.7">Não tem problema — acontece com muita gente. Mas quero te lembrar de uma coisa: o plano gratuito tem tudo que você precisa para testar o quiz no seu funil. Sem pagar nada.</p>
  <p style="line-height:1.7">Você pode criar 1 quiz real, receber até 15 leads qualificados e ver com seus próprios olhos se funciona para o seu negócio.</p>
  <p style="line-height:1.7">Depois dos 15 leads, você decide se quer continuar. Sem pressão.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/create-quiz"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Criar meu quiz gratuito agora →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'nurture_d21');

-- TEMPLATE 5 — Pós-Tutorial Dia 7
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Pós-Tutorial — Dia 7 — Trazer Respostas',
  'post_tutorial_d7', 7, 6, true,
  '{first_name}, seu quiz está no ar. Agora vamos trazer as primeiras respostas',
  'Quiz publicado — 3 formas de conseguir os primeiros leads hoje',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">Você criou seu quiz. Isso já coloca você à frente da maioria.</p>
  <p style="line-height:1.7">O próximo passo é simples: levar pessoas para responder.</p>
  <p style="line-height:1.7">Três formas que funcionam mesmo sem verba em anúncio:</p>
  <p style="line-height:1.7"><strong>1. Stories do Instagram</strong><br>
  Mostre o quiz nos stories com um link direto. Funciona especialmente bem se você já tem seguidores engajados.</p>
  <p style="line-height:1.7"><strong>2. Lista de contatos no WhatsApp</strong><br>
  Mande o link para seus contatos com uma mensagem curta: "Criei um quiz sobre [tema] — quero sua opinião, leva 2 minutos."</p>
  <p style="line-height:1.7"><strong>3. Bio do perfil</strong><br>
  Coloque o link do quiz na bio do Instagram ou LinkedIn. Qualquer pessoa que visitar seu perfil vai ver.</p>
  <p style="line-height:1.7">Seu link de quiz está no dashboard. É só copiar e compartilhar.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/dashboard"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Acessar meu dashboard →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'post_tutorial_d7');

-- TEMPLATE 6 — Pós-Tutorial Dia 14
INSERT INTO public.email_recovery_templates (
  name, category, trigger_days, priority, is_active,
  subject, subject_b, html_content
)
SELECT
  'Pós-Tutorial — Dia 14 — Interpretar Dados',
  'post_tutorial_d14', 14, 6, true,
  '{first_name}, como interpretar os primeiros dados do seu quiz',
  'Seu quiz recebeu respostas? Veja o que esses dados dizem',
  $html$<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#222;padding:24px">
  <p>Oi {first_name},</p>
  <p style="line-height:1.7">Se seu quiz já recebeu respostas, parabéns — você tem dados reais sobre o seu público.</p>
  <p style="line-height:1.7">Se ainda não recebeu, não se preocupe — compartilhe o link nos stories ou na bio e as primeiras respostas chegam rápido.</p>
  <p style="line-height:1.7">Para quem já tem dados, aqui está o que observar no CRM do MasterQuizz:</p>
  <p style="line-height:1.7"><strong>Taxa de conclusão:</strong> quantas pessoas começaram vs terminaram o quiz. Se for abaixo de 60%, o quiz pode estar longo demais ou as perguntas confusas.</p>
  <p style="line-height:1.7"><strong>Perfil dos leads:</strong> quais resultados os leads estão recebendo mais. Isso diz quem é o seu público de verdade — pode surpreender.</p>
  <p style="line-height:1.7"><strong>Leads com email e WhatsApp:</strong> esses são os mais quentes. Entre em contato em até 24h — a janela de atenção é curta.</p>
  <p style="margin:28px 0">
    <a href="https://masterquiz.com.br/dashboard"
       style="background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:15px">
      Ver meus dados no CRM →
    </a>
  </p>
  <p style="font-size:13px;color:#888">
    Abraço,<br>Equipe MasterQuizz<br><br>
    <a href="{unsubscribe_link}" style="color:#aaa;font-size:11px">Cancelar inscrição</a>
  </p>
</body>
</html>$html$
WHERE NOT EXISTS (SELECT 1 FROM public.email_recovery_templates WHERE category = 'post_tutorial_d14');

-- UPDATE — preencher subject_b do limit_warning existente (só se vazio, não sobrescreve)
UPDATE public.email_recovery_templates
   SET subject_b = 'Seus leads estão chegando. Faltam poucos para o limite.',
       updated_at = now()
 WHERE category = 'limit_warning'
   AND is_active = true
   AND (subject_b IS NULL OR subject_b = '');