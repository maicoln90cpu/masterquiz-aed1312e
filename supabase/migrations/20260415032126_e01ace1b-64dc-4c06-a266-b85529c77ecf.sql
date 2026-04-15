-- Insert new Bold Flat Infographic image prompt
INSERT INTO public.blog_image_prompts (name, prompt_template, style_description, is_active)
VALUES (
  'Bold Flat Infographic',
  'Generate an image: A bold, modern infographic-style hero image for a blog about "{{topic}}". STYLE: Clean SaaS blog cover. Think HubSpot, Stripe, or Notion blog visuals. BACKGROUND: Single bold gradient — deep blue (#1E40AF) to electric blue (#3B82F6), or vibrant purple (#7C3AED) to pink (#EC4899), or warm orange (#EA580C) to yellow (#F59E0B). ELEMENTS: Flat 2D vector-style icons and shapes — bar charts, pie charts, arrows, funnels, target icons, checkmarks, speech bubbles, dashboard mockups. Arranged in a balanced, editorial composition. LAYOUT: Central composition with 2-3 main visual elements surrounded by smaller floating icons. Clean whitespace between elements. Slight 3D depth with subtle shadows. COLOR: High contrast. White and light-colored icons/shapes against the bold gradient background. Accent colors complementary to the gradient. TYPOGRAPHY: NO text, NO words, NO letters. All communication through visual metaphor only. ABSOLUTE RULES: NO text, NO words, NO watermarks, NO logos anywhere. NO photographs, NO people, NO faces. ONLY clean vector/flat illustration style. Must feel modern, SaaS-like, professional. Shapes must be geometric and precise, NOT hand-drawn. 16:9 aspect ratio, high resolution.',
  'Estilo flat infográfico com fundos coloridos em gradiente, ícones 2D vetoriais e visual SaaS moderno inspirado em HubSpot/Stripe/Notion.',
  true
);

-- Update blog_settings topics_pool to include new themes
UPDATE public.blog_settings
SET topics_pool = COALESCE(topics_pool, '[]'::jsonb) || '[
  "Relatório de tráfego do funil: como interpretar dados do quiz",
  "Métricas de quiz: taxa de início vs conclusão e como melhorar",
  "Análise de cada etapa do funil com quizzes interativos",
  "Dashboard de performance: como medir ROI do seu quiz",
  "Automação no WhatsApp e CRM com quizzes de qualificação",
  "Prompts de IA para criar quizzes de alta conversão",
  "Tempo de resposta no quiz: impacto direto na conversão"
]'::jsonb
WHERE id = (SELECT id FROM public.blog_settings LIMIT 1);