
-- Knowledge base table for WhatsApp AI agent
CREATE TABLE public.whatsapp_ai_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'funcionalidades',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.whatsapp_ai_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage knowledge base"
  ON public.whatsapp_ai_knowledge
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Service can read knowledge base"
  ON public.whatsapp_ai_knowledge
  FOR SELECT
  TO service_role
  USING (true);

-- Seed with comprehensive platform knowledge
INSERT INTO public.whatsapp_ai_knowledge (category, title, content, keywords) VALUES

-- FUNCIONALIDADES
('funcionalidades', 'Vídeos no Quiz', 
'O MasterQuiz suporta vídeos nativos em perguntas e resultados. Formatos aceitos: MP4, WebM (upload direto), YouTube (cole o link), Vimeo (cole o link) e Bunny CDN (para usuários com plano que inclui vídeo). Os vídeos podem ser adicionados como bloco de conteúdo dentro de qualquer pergunta ou na tela de resultado. Para adicionar, basta clicar em "Adicionar Bloco" > "Vídeo" no editor de perguntas.',
ARRAY['video', 'vídeo', 'mp4', 'youtube', 'vimeo', 'bunny', 'upload', 'mídia', 'media']),

('funcionalidades', 'Tipos de Blocos de Conteúdo',
'O editor de perguntas suporta diversos blocos de conteúdo: Texto (formatação rica), Imagem (upload ou URL), Vídeo (MP4, YouTube, Vimeo, Bunny), Áudio, Galeria de imagens, Embed (iframe), Botão com link, Bloco de Preço, Countdown (contagem regressiva), Depoimento/Testimonial, Slider/Carrossel, NPS (Net Promoter Score), Accordion (FAQ expansível). Cada pergunta pode ter múltiplos blocos combinados.',
ARRAY['bloco', 'blocos', 'conteúdo', 'editor', 'texto', 'imagem', 'áudio', 'audio', 'galeria', 'embed', 'botão', 'preço', 'countdown', 'depoimento', 'slider', 'nps', 'accordion', 'faq']),

('funcionalidades', 'Criação de Quiz',
'Para criar um quiz: Dashboard > "Criar Quiz". Opções: criar do zero (manual), usar template pronto, ou gerar por IA (informando tema, público-alvo e objetivos). O editor visual permite arrastar e reorganizar perguntas, adicionar blocos de conteúdo, configurar lógica condicional (branching) e personalizar cores/fontes. Formatos de resposta: múltipla escolha, escolha única, texto livre, escala/rating, NPS, data, número.',
ARRAY['criar', 'criação', 'quiz', 'novo', 'editor', 'pergunta', 'perguntas', 'como criar', 'começar', 'inicio']),

('funcionalidades', 'Geração de Quiz por IA',
'A IA pode gerar quizzes completos automaticamente. Basta informar: tema/assunto, público-alvo, objetivo (qualificação, educação, entretenimento), número de perguntas desejado e perfis de resultado. A IA cria perguntas, opções de resposta, lógica de pontuação e textos de resultado. Modelos usados: GPT-4o (OpenAI) com fallback para Gemini (Google). Limites de geração variam por plano.',
ARRAY['ia', 'inteligência artificial', 'gerar', 'geração', 'automático', 'automática', 'ai', 'gpt', 'gemini']),

('funcionalidades', 'Resultados Personalizados',
'Cada quiz pode ter múltiplos resultados personalizados. Tipos: resultado padrão (por faixa de pontuação), calculadora (fórmulas matemáticas com variáveis das respostas), condicional (baseado em respostas específicas). Cada resultado pode incluir: texto formatado, imagem, vídeo, botão com link de redirecionamento (ex: página de vendas), URL de redirect automático. Ideal para segmentar leads por perfil.',
ARRAY['resultado', 'resultados', 'pontuação', 'score', 'calculadora', 'fórmula', 'redirect', 'redirecionamento', 'personalizado']),

('funcionalidades', 'Coleta de Leads (Formulário)',
'O quiz pode coletar dados dos respondentes: nome, email e WhatsApp. A coleta pode ser configurada para aparecer ANTES do quiz (gate) ou DEPOIS (antes de mostrar o resultado). Também é possível adicionar campos customizados (texto, seleção, data, número). Os leads ficam disponíveis no CRM integrado e podem ser exportados em CSV/Excel.',
ARRAY['lead', 'leads', 'formulário', 'form', 'email', 'nome', 'whatsapp', 'coleta', 'coletar', 'dados', 'contato', 'captura']),

('funcionalidades', 'CRM de Leads',
'O MasterQuiz possui um CRM integrado com visualização Kanban. Os leads são organizados por status: Novo, Contatado, Qualificado, Convertido, Perdido. É possível: mover leads entre colunas, adicionar notas, filtrar por quiz/data/status, exportar dados, ver detalhes completos (respostas, resultado, data, dispositivo). O CRM é acessado via Dashboard > CRM.',
ARRAY['crm', 'kanban', 'gestão', 'gerenciar', 'leads', 'pipeline', 'funil', 'status', 'contato']),

('funcionalidades', 'Analytics e Relatórios',
'O painel de analytics mostra: visualizações, inicios, completações, taxa de conversão, tempo médio de conclusão, heatmap de respostas (quais opções são mais escolhidas), funil de abandono (em qual pergunta os respondentes desistem), analytics por período. Disponível por quiz individual ou visão geral de todos os quizzes.',
ARRAY['analytics', 'análise', 'relatório', 'relatórios', 'estatísticas', 'métricas', 'dados', 'heatmap', 'funil', 'conversão', 'taxa']),

('funcionalidades', 'Personalização Visual',
'Cada quiz pode ser personalizado visualmente: templates de design (Moderno, Minimalista, Colorido, Gradiente, etc.), cores primárias e de fundo, logo próprio, mostrar/ocultar título, descrição, número da pergunta, barra de progresso (contador, barra, percentual). Planos pagos permitem remover a marca MasterQuiz (white-label).',
ARRAY['design', 'visual', 'template', 'cor', 'cores', 'logo', 'personalizar', 'personalização', 'aparência', 'estilo', 'white-label', 'marca']),

('funcionalidades', 'Lógica Condicional (Branching)',
'O MasterQuiz suporta lógica condicional avançada: pular perguntas com base na resposta anterior, mostrar perguntas diferentes por caminho, direcionar para resultados específicos baseado em combinações de respostas. Configurável no editor visual sem necessidade de código. Disponível em planos pagos.',
ARRAY['condicional', 'branching', 'lógica', 'condição', 'pular', 'saltar', 'ramificação', 'fluxo']),

('funcionalidades', 'Publicação e Compartilhamento',
'Quizzes podem ser publicados de 3 formas: 1) Link público direto (URL única do quiz), 2) Embed em site/blog (código iframe para copiar e colar), 3) QR Code gerado automaticamente. O link segue o formato: masterquiz.lovable.app/empresa/slug-do-quiz. O quiz precisa estar com status "Ativo" e "Público" para ser acessível.',
ARRAY['publicar', 'publicação', 'compartilhar', 'link', 'url', 'embed', 'incorporar', 'qr', 'qr code', 'site', 'blog']),

('funcionalidades', 'Biblioteca de Mídia',
'O MasterQuiz possui uma biblioteca de mídia integrada para gerenciar imagens e vídeos. Upload de imagens via arrastar e soltar ou seleção de arquivo. Suporte a JPEG, PNG, GIF, WebP. Para vídeos: upload direto de MP4/WebM ou integração com Bunny CDN para streaming otimizado. As mídias ficam armazenadas e podem ser reutilizadas em diferentes quizzes.',
ARRAY['mídia', 'media', 'biblioteca', 'upload', 'imagem', 'imagens', 'arquivo', 'foto', 'fotos', 'armazenamento']),

-- INTEGRAÇÕES
('integrações', 'Integrações com CRM e Email',
'O MasterQuiz integra com: HubSpot, RD Station, Pipedrive (CRMs), Mailchimp, ActiveCampaign (email marketing). As integrações são configuradas por quiz e enviam leads automaticamente ao receber novas respostas. Configuração: Dashboard > Quiz > Integrações. Cada integração requer uma API key do serviço correspondente.',
ARRAY['integração', 'integrações', 'hubspot', 'rd station', 'pipedrive', 'mailchimp', 'activecampaign', 'email', 'crm', 'automação']),

('integrações', 'Automação (Zapier, Make, n8n, Webhooks)',
'O MasterQuiz suporta webhooks personalizados que enviam dados de leads para qualquer URL quando uma nova resposta é recebida. Isso permite integração com Zapier, Make (Integromat), n8n e qualquer ferramenta de automação. O payload inclui: dados do respondente, respostas, resultado, quiz info. Configuração: Quiz > Integrações > Webhook.',
ARRAY['zapier', 'make', 'integromat', 'n8n', 'webhook', 'webhooks', 'automação', 'automatizar', 'api']),

('integrações', 'Facebook Pixel e Google Tag Manager',
'Cada quiz pode ter seu próprio Facebook Pixel ID para rastreamento de conversões. O Google Tag Manager (GTM) é configurado globalmente no perfil do usuário. Eventos rastreados: quiz_start, quiz_complete, lead_captured. Configuração do Pixel: Quiz > Configurações > Facebook Pixel. GTM: Perfil > Configurações.',
ARRAY['pixel', 'facebook', 'meta', 'gtm', 'google tag manager', 'rastreamento', 'tracking', 'conversão', 'anúncios', 'ads']),

-- PLANOS
('planos', 'Planos e Preços',
'O MasterQuiz oferece os seguintes planos: FREE (1 quiz, 100 respostas/mês, funcionalidades básicas), PAID/Profissional (mais quizzes, mais respostas, integrações, sem marca d''água), PARTNER (limites expandidos, suporte prioritário), PREMIUM (limites máximos, white-label, todas as features). Cada plano tem limites de: número de quizzes, respostas por mês, leads, gerações de IA. Upgrade via Dashboard > Planos.',
ARRAY['plano', 'planos', 'preço', 'preços', 'valor', 'quanto custa', 'gratuito', 'free', 'pago', 'premium', 'profissional', 'upgrade', 'limite', 'limites']),

('planos', 'Limites por Plano',
'Limites variam por plano: FREE: 1 quiz, 100 respostas, sem integrações avançadas. PAID: mais quizzes e respostas, integrações com CRM/email, analytics avançado, pixel por quiz. PARTNER: limites maiores, teste A/B, branching. PREMIUM: quizzes ilimitados, respostas ilimitadas, white-label, todas as features. Para ver seus limites atuais: Dashboard > Configurações > Plano.',
ARRAY['limite', 'limites', 'quantos', 'máximo', 'respostas', 'quizzes']),

-- SUPORTE
('suporte', 'Suporte e Ajuda',
'O MasterQuiz oferece suporte via: Chat no painel administrativo (tickets de suporte), WhatsApp (respostas automatizadas com IA + escalação para suporte humano quando necessário). Para abrir um ticket: Dashboard > Suporte > Novo Ticket. O suporte funciona em horário comercial (seg-sex, 9h-18h). Dúvidas comuns são respondidas automaticamente pela IA.',
ARRAY['suporte', 'ajuda', 'help', 'problema', 'erro', 'bug', 'contato', 'atendimento', 'ticket']),

-- CONTA
('conta', 'Gerenciamento de Conta',
'No perfil do usuário é possível: alterar nome, email, WhatsApp, configurar company_slug (URL personalizada), adicionar Facebook Pixel global, configurar GTM, ver e alterar plano atual, excluir conta. Acesso: Dashboard > Configurações (ícone de engrenagem). A exclusão de conta tem período de carência de 30 dias e pode ser cancelada.',
ARRAY['conta', 'perfil', 'configurações', 'alterar', 'mudar', 'email', 'senha', 'excluir', 'deletar', 'cancelar']);
