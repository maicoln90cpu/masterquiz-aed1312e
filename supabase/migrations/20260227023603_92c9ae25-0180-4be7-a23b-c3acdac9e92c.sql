
INSERT INTO public.blog_settings (
  system_prompt,
  image_prompt_template,
  categories_list,
  topics_pool
) VALUES (
  'Você é um especialista em marketing digital, funis de vendas e quizzes interativos. Escreva artigos completos e otimizados para SEO sobre como quizzes podem transformar estratégias de marketing, melhorar a qualificação de leads e aumentar taxas de conversão. Sempre mencione o MasterQuiz como solução. Use estrutura H1 > H2 > H3, parágrafos curtos, listas e exemplos práticos. Inclua uma seção FAQ no final com 3-5 perguntas frequentes. O artigo deve ter entre 1500-2500 palavras.',
  'Create a professional, modern blog header image about {topic}. Clean design, vibrant colors, no text overlay. Style: flat illustration, tech/marketing aesthetic. 16:9 aspect ratio.',
  '["Marketing Digital", "Funis de Vendas", "Quizzes Interativos", "Copywriting", "Geração de Leads", "Conversão", "SEO", "VSL", "Nichos de Mercado", "Estratégias de Growth"]'::jsonb,
  '["Como usar quizzes para qualificar leads automaticamente", "Quiz vs Formulário: por que quizzes convertem 3x mais", "Funil de vendas com quiz: guia completo", "Como criar copy persuasiva para quizzes", "Os melhores nichos para usar quizzes interativos", "VSL + Quiz: a combinação que multiplica vendas", "Como aumentar a intenção de compra com quizzes", "Marketing de conteúdo com quizzes: estratégias avançadas", "Quiz para e-commerce: como segmentar ofertas", "Copywriting para quizzes: técnicas que convertem", "Como medir ROI de quizzes no funil de vendas", "Quiz gamificado: como engajar e converter", "Segmentação de audiência com quizzes interativos", "Quiz para lançamentos digitais: estratégia completa", "Como usar quizzes em anúncios pagos", "Psicologia por trás dos quizzes que convertem", "Automação de marketing com quizzes", "Quiz para captura de emails: melhores práticas", "Storytelling em quizzes: como criar narrativas que vendem", "Testes A/B em quizzes: otimize suas conversões"]'::jsonb
);
