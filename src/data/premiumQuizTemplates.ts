import { QuizTemplate } from './quizTemplates';
import { questionBlock, textBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock, imageBlock } from './templates/helpers';

export const premiumQuizTemplates: QuizTemplate[] = [
  // ═══════════════════════════════════════════════════════════
  // 1. Executivo Corporativo — Funil B2B de auto-convencimento
  // ═══════════════════════════════════════════════════════════
  {
    id: 'executivo-corporativo',
    name: 'Executivo Corporativo',
    description: 'Funil B2B de auto-convencimento para consultoria, SaaS e serviços empresariais. Identifica dores corporativas e guia para proposta.',
    category: 'lead_qualification',
    icon: '💼',
    preview: {
      title: 'Diagnóstico Estratégico Empresarial',
      description: 'Avaliação corporativa com funil de qualificação',
      questionCount: 12,
      template: 'profissional',
    },
    config: {
      title: 'Diagnóstico Estratégico Empresarial',
      description: 'Identifique gargalos e oportunidades de crescimento para sua empresa.',
      questionCount: 12,
      template: 'profissional',
      questions: [
        // FASE 1: Espelhamento
        {
          question_text: 'Qual o faturamento anual da empresa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 1M', value: 'small' },
            { text: 'R$ 1M - R$ 10M', value: 'medium' },
            { text: 'R$ 10M - R$ 50M', value: 'large' },
            { text: 'Acima de R$ 50M', value: 'enterprise' },
          ],
          order_number: 1,
          blocks: [
            imageBlock('ec-q1', '/templates/corporate-boardroom.jpg', 'Reunião executiva em sala de diretoria com vista panorâmica da cidade', 0),
            textBlock('ec-q1', '<p>Este diagnóstico é confidencial e personalizado para sua empresa.</p>', 1),
            questionBlock('ec-q1', 'Qual o faturamento anual da empresa?', [
              { text: 'Até R$ 1M', value: 'small' },
              { text: 'R$ 1M - R$ 10M', value: 'medium' },
              { text: 'R$ 10M - R$ 50M', value: 'large' },
              { text: 'Acima de R$ 50M', value: 'enterprise' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quantos colaboradores sua empresa possui?',
          answer_format: 'single_choice',
          options: [
            { text: '1-10', value: 'micro' },
            { text: '11-50', value: 'small' },
            { text: '51-200', value: 'medium' },
            { text: '201-1000', value: 'large' },
            { text: 'Mais de 1000', value: 'enterprise' },
          ],
          order_number: 2,
          blocks: [
            questionBlock('ec-q2', 'Quantos colaboradores sua empresa possui?', [
              { text: '1-10', value: 'micro' },
              { text: '11-50', value: 'small' },
              { text: '51-200', value: 'medium' },
              { text: '201-1000', value: 'large' },
              { text: 'Mais de 1000', value: 'enterprise' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Qual o setor de atuação?',
          answer_format: 'single_choice',
          options: [
            { text: 'Tecnologia', value: 'tech' },
            { text: 'Indústria', value: 'industry' },
            { text: 'Serviços', value: 'services' },
            { text: 'Comércio / Varejo', value: 'retail' },
            { text: 'Saúde', value: 'health' },
            { text: 'Educação', value: 'education' },
          ],
          order_number: 3,
          blocks: [
            questionBlock('ec-q3', 'Qual o setor de atuação?', [
              { text: 'Tecnologia', value: 'tech' },
              { text: 'Indústria', value: 'industry' },
              { text: 'Serviços', value: 'services' },
              { text: 'Comércio / Varejo', value: 'retail' },
              { text: 'Saúde', value: 'health' },
              { text: 'Educação', value: 'education' },
            ], 'single_choice', 1),
            progressBlock('ec-q3', 2, 25, 'Perfil empresarial mapeado'),
          ],
        },
        // FASE 2: Amplificação da dor
        {
          question_text: 'Quais são os maiores desafios atuais da empresa?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Crescimento estagnado', value: 'stagnation' },
            { text: 'Custos operacionais altos', value: 'costs' },
            { text: 'Dificuldade em reter talentos', value: 'retention' },
            { text: 'Falta de processos definidos', value: 'processes' },
            { text: 'Transformação digital lenta', value: 'digital' },
          ],
          order_number: 4,
          blocks: [
            textBlock('ec-q4', '<p><strong>⚠️</strong> Empresas que não identificam seus gargalos perdem em média <strong>23% de faturamento</strong> por ano.</p>', 0),
            questionBlock('ec-q4', 'Quais são os maiores desafios atuais da empresa?', [
              { text: 'Crescimento estagnado', value: 'stagnation' },
              { text: 'Custos operacionais altos', value: 'costs' },
              { text: 'Dificuldade em reter talentos', value: 'retention' },
              { text: 'Falta de processos definidos', value: 'processes' },
              { text: 'Transformação digital lenta', value: 'digital' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Qual o nível de digitalização dos processos da empresa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Predominantemente manual', value: 'manual' },
            { text: 'Parcialmente digitalizado', value: 'partial' },
            { text: 'Maioria digitalizada', value: 'mostly' },
            { text: 'Totalmente digital', value: 'full' },
          ],
          order_number: 5,
          blocks: [
            questionBlock('ec-q5', 'Qual o nível de digitalização dos processos da empresa?', [
              { text: 'Predominantemente manual', value: 'manual' },
              { text: 'Parcialmente digitalizado', value: 'partial' },
              { text: 'Maioria digitalizada', value: 'mostly' },
              { text: 'Totalmente digital', value: 'full' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Sua empresa utiliza dados para decisões estratégicas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Raramente ou nunca', value: 'rarely' },
            { text: 'Ocasionalmente', value: 'sometimes' },
            { text: 'Frequentemente', value: 'often' },
            { text: 'Sempre — somos data-driven', value: 'always' },
          ],
          order_number: 6,
          blocks: [
            questionBlock('ec-q6', 'Sua empresa utiliza dados para decisões estratégicas?', [
              { text: 'Raramente ou nunca', value: 'rarely' },
              { text: 'Ocasionalmente', value: 'sometimes' },
              { text: 'Frequentemente', value: 'often' },
              { text: 'Sempre — somos data-driven', value: 'always' },
            ], 'single_choice', 1),
          ],
        },
        // FASE 3: Consequência
        {
          question_text: 'Esses desafios já impactaram resultados financeiros?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, significativamente', value: 'significant' },
            { text: 'Sim, moderadamente', value: 'moderate' },
            { text: 'Ainda não, mas pode piorar', value: 'risk' },
            { text: 'Não percebemos impacto', value: 'none' },
          ],
          order_number: 7,
          blocks: [
            questionBlock('ec-q7', 'Esses desafios já impactaram resultados financeiros?', [
              { text: 'Sim, significativamente', value: 'significant' },
              { text: 'Sim, moderadamente', value: 'moderate' },
              { text: 'Ainda não, mas pode piorar', value: 'risk' },
              { text: 'Não percebemos impacto', value: 'none' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'O que acontece se esses problemas não forem resolvidos nos próximos 12 meses?',
          answer_format: 'single_choice',
          options: [
            { text: 'Perda de market share', value: 'market' },
            { text: 'Redução de rentabilidade', value: 'profit' },
            { text: 'Desmotivação da equipe', value: 'team' },
            { text: 'Risco de sobrevivência', value: 'survival' },
          ],
          order_number: 8,
          blocks: [
            questionBlock('ec-q8', 'O que acontece se esses problemas não forem resolvidos nos próximos 12 meses?', [
              { text: 'Perda de market share', value: 'market' },
              { text: 'Redução de rentabilidade', value: 'profit' },
              { text: 'Desmotivação da equipe', value: 'team' },
              { text: 'Risco de sobrevivência', value: 'survival' },
            ], 'single_choice', 1),
            progressBlock('ec-q8', 2, 65, 'Diagnóstico em andamento'),
          ],
        },
        // FASE 4: Contraste
        {
          question_text: 'Imagine sua empresa com processos otimizados e crescimento previsível. Isso é prioridade?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, é nossa maior prioridade', value: 'top' },
            { text: 'Sim, está entre as prioridades', value: 'high' },
            { text: 'Seria bom, mas há outras urgências', value: 'medium' },
          ],
          order_number: 9,
          blocks: [
            comparisonBlock('ec-q9', 0,
              { title: '⚠️ Sem intervenção', items: ['Crescimento imprevisível', 'Processos manuais', 'Decisões no feeling', 'Talentos desmotivados'] },
              { title: '✅ Com diagnóstico', items: ['Crescimento estruturado', 'Processos automatizados', 'Decisões baseadas em dados', 'Equipe engajada'] },
            ),
            questionBlock('ec-q9', 'Imagine sua empresa com processos otimizados e crescimento previsível. Isso é prioridade?', [
              { text: 'Sim, é nossa maior prioridade', value: 'top' },
              { text: 'Sim, está entre as prioridades', value: 'high' },
              { text: 'Seria bom, mas há outras urgências', value: 'medium' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Horizonte de planejamento estratégico da empresa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Curto prazo (6 meses)', value: 'short' },
            { text: 'Médio prazo (1-2 anos)', value: 'medium' },
            { text: 'Longo prazo (3-5 anos)', value: 'long' },
          ],
          order_number: 10,
          blocks: [
            questionBlock('ec-q10', 'Horizonte de planejamento estratégico da empresa?', [
              { text: 'Curto prazo (6 meses)', value: 'short' },
              { text: 'Médio prazo (1-2 anos)', value: 'medium' },
              { text: 'Longo prazo (3-5 anos)', value: 'long' },
            ], 'single_choice', 1),
            socialProofBlock('ec-q10', 2, [
              { name: 'TechCorp', text: 'O diagnóstico revelou gargalos que custavam R$ 2M/ano', rating: 5 },
              { name: 'Grupo XYZ', text: 'Implementamos as recomendações e crescemos 45% em 1 ano', rating: 5 },
            ]),
          ],
        },
        // FASE 5: Conclusão guiada
        {
          question_text: 'Orçamento disponível para consultoria/solução?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 50k', value: 'low' },
            { text: 'R$ 50k - R$ 200k', value: 'medium' },
            { text: 'R$ 200k - R$ 500k', value: 'high' },
            { text: 'Acima de R$ 500k', value: 'enterprise' },
          ],
          order_number: 11,
          blocks: [
            questionBlock('ec-q11', 'Orçamento disponível para consultoria/solução?', [
              { text: 'Até R$ 50k', value: 'low' },
              { text: 'R$ 50k - R$ 200k', value: 'medium' },
              { text: 'R$ 200k - R$ 500k', value: 'high' },
              { text: 'Acima de R$ 500k', value: 'enterprise' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quando gostaria de iniciar o projeto de transformação?',
          answer_format: 'single_choice',
          options: [
            { text: 'Imediatamente — é urgente', value: 'now' },
            { text: 'Próximas semanas', value: 'soon' },
            { text: 'Próximo trimestre', value: 'quarter' },
          ],
          order_number: 12,
          blocks: [
            countdownBlock('ec-q12', 0, 15, '📊 Diagnóstico gratuito expira em breve'),
            questionBlock('ec-q12', 'Quando gostaria de iniciar o projeto de transformação?', [
              { text: 'Imediatamente — é urgente', value: 'now' },
              { text: 'Próximas semanas', value: 'soon' },
              { text: 'Próximo trimestre', value: 'quarter' },
            ], 'single_choice', 1),
          ],
        },
      ],
      formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
      results: [
        {
          result_text: '📊 Diagnóstico Estratégico Completo\n\nIdentificamos gargalos e oportunidades estratégicas para sua empresa. Nossos consultores prepararam um plano personalizado de ação.',
          button_text: 'Solicitar Proposta Executiva',
          condition_type: 'always',
          order_number: 1,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 2. Luxo & Premium — Funil de descoberta de produto premium
  // ═══════════════════════════════════════════════════════════
  {
    id: 'luxo-premium',
    name: 'Luxo & Premium',
    description: 'Funil de auto-convencimento para produtos e experiências de alto padrão. Elegância + escassez + exclusividade.',
    category: 'product_discovery',
    icon: '💎',
    preview: {
      title: 'Descubra sua Experiência Premium Ideal',
      description: 'Curadoria exclusiva para seu perfil',
      questionCount: 12,
      template: 'profissional',
    },
    config: {
      title: 'Descubra sua Experiência Premium Ideal',
      description: 'Uma curadoria exclusiva, personalizada para seu estilo e preferências.',
      questionCount: 12,
      template: 'profissional',
      questions: [
        // FASE 1: Espelhamento
        {
          question_text: 'Qual estilo reflete sua personalidade?',
          answer_format: 'single_choice',
          options: [
            { text: 'Clássico Atemporal', value: 'classic' },
            { text: 'Moderno Sofisticado', value: 'modern' },
            { text: 'Minimalista Luxuoso', value: 'minimal' },
            { text: 'Ousado e Exclusivo', value: 'bold' },
          ],
          order_number: 1,
          blocks: [
            imageBlock('lp-q1', '/templates/luxury-lifestyle.jpg', 'Produtos de luxo e estilo de vida premium elegante', 0),
            textBlock('lp-q1', '<p>✨ Esta curadoria é exclusiva e personalizada para você.</p>', 1),
            questionBlock('lp-q1', 'Qual estilo reflete sua personalidade?', [
              { text: 'Clássico Atemporal', value: 'classic' },
              { text: 'Moderno Sofisticado', value: 'modern' },
              { text: 'Minimalista Luxuoso', value: 'minimal' },
              { text: 'Ousado e Exclusivo', value: 'bold' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'O que você mais valoriza em uma experiência premium?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Exclusividade absoluta', value: 'exclusivity' },
            { text: 'Personalização completa', value: 'customization' },
            { text: 'Atendimento VIP dedicado', value: 'service' },
            { text: 'Qualidade superior', value: 'quality' },
          ],
          order_number: 2,
          blocks: [
            questionBlock('lp-q2', 'O que você mais valoriza em uma experiência premium?', [
              { text: 'Exclusividade absoluta', value: 'exclusivity' },
              { text: 'Personalização completa', value: 'customization' },
              { text: 'Atendimento VIP dedicado', value: 'service' },
              { text: 'Qualidade superior', value: 'quality' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Qual ocasião especial você está planejando?',
          answer_format: 'single_choice',
          options: [
            { text: 'Celebração pessoal', value: 'personal' },
            { text: 'Evento corporativo', value: 'corporate' },
            { text: 'Presente exclusivo', value: 'gift' },
            { text: 'Uso cotidiano premium', value: 'daily' },
          ],
          order_number: 3,
          blocks: [
            questionBlock('lp-q3', 'Qual ocasião especial você está planejando?', [
              { text: 'Celebração pessoal', value: 'personal' },
              { text: 'Evento corporativo', value: 'corporate' },
              { text: 'Presente exclusivo', value: 'gift' },
              { text: 'Uso cotidiano premium', value: 'daily' },
            ], 'single_choice', 1),
            progressBlock('lp-q3', 2, 25, 'Perfil premium mapeado'),
          ],
        },
        // FASE 2: Amplificação da dor
        {
          question_text: 'Você já se frustrou com compras que não corresponderam à expectativa premium?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, várias vezes — perdi dinheiro e tempo', value: 'often' },
            { text: 'Sim, uma ou duas vezes', value: 'sometimes' },
            { text: 'Não, sempre pesquiso bem', value: 'rarely' },
          ],
          order_number: 4,
          blocks: [
            textBlock('lp-q4', '<p><strong>💎 Fato:</strong> 67% dos compradores premium dizem que a <em>experiência de compra</em> importa tanto quanto o produto.</p>', 0),
            questionBlock('lp-q4', 'Você já se frustrou com compras que não corresponderam à expectativa premium?', [
              { text: 'Sim, várias vezes — perdi dinheiro e tempo', value: 'often' },
              { text: 'Sim, uma ou duas vezes', value: 'sometimes' },
              { text: 'Não, sempre pesquiso bem', value: 'rarely' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Preferência de materiais e acabamentos?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Metais preciosos', value: 'precious' },
            { text: 'Pedras naturais raras', value: 'stones' },
            { text: 'Couro italiano artesanal', value: 'leather' },
            { text: 'Tecidos nobres exclusivos', value: 'fabrics' },
          ],
          order_number: 5,
          blocks: [
            questionBlock('lp-q5', 'Preferência de materiais e acabamentos?', [
              { text: 'Metais preciosos', value: 'precious' },
              { text: 'Pedras naturais raras', value: 'stones' },
              { text: 'Couro italiano artesanal', value: 'leather' },
              { text: 'Tecidos nobres exclusivos', value: 'fabrics' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Importância de marca reconhecida internacionalmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Essencial — só marcas icônicas', value: 'essential' },
            { text: 'Importante, mas não decisivo', value: 'important' },
            { text: 'Valorizo artesania acima da marca', value: 'craftsmanship' },
          ],
          order_number: 6,
          blocks: [
            questionBlock('lp-q6', 'Importância de marca reconhecida internacionalmente?', [
              { text: 'Essencial — só marcas icônicas', value: 'essential' },
              { text: 'Importante, mas não decisivo', value: 'important' },
              { text: 'Valorizo artesania acima da marca', value: 'craftsmanship' },
            ], 'single_choice', 1),
          ],
        },
        // FASE 3: Consequência
        {
          question_text: 'Quanto tempo você geralmente perde pesquisando até encontrar algo que realmente vale a pena?',
          answer_format: 'single_choice',
          options: [
            { text: 'Semanas — é exaustivo', value: 'weeks' },
            { text: 'Dias — preciso de curadoria', value: 'days' },
            { text: 'Pouco — sei exatamente o que quero', value: 'little' },
          ],
          order_number: 7,
          blocks: [
            questionBlock('lp-q7', 'Quanto tempo você geralmente perde pesquisando até encontrar algo que realmente vale a pena?', [
              { text: 'Semanas — é exaustivo', value: 'weeks' },
              { text: 'Dias — preciso de curadoria', value: 'days' },
              { text: 'Pouco — sei exatamente o que quero', value: 'little' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Você coleciona itens de luxo?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, sou colecionador(a) ativo(a)', value: 'active' },
            { text: 'Ocasionalmente adquiro peças', value: 'occasional' },
            { text: 'Esta seria minha primeira aquisição premium', value: 'first' },
          ],
          order_number: 8,
          blocks: [
            questionBlock('lp-q8', 'Você coleciona itens de luxo?', [
              { text: 'Sim, sou colecionador(a) ativo(a)', value: 'active' },
              { text: 'Ocasionalmente adquiro peças', value: 'occasional' },
              { text: 'Esta seria minha primeira aquisição premium', value: 'first' },
            ], 'single_choice', 1),
            progressBlock('lp-q8', 2, 65, 'Curadoria em andamento'),
          ],
        },
        // FASE 4: Contraste
        {
          question_text: 'Prefere experiência de compra?',
          answer_format: 'single_choice',
          options: [
            { text: 'Showroom privativo', value: 'private' },
            { text: 'Boutique exclusiva', value: 'boutique' },
            { text: 'Online com curadoria VIP', value: 'online' },
          ],
          order_number: 9,
          blocks: [
            comparisonBlock('lp-q9', 0,
              { title: '🛒 Compra genérica', items: ['Sem personalização', 'Pesquisa demorada', 'Risco de decepção', 'Atendimento padrão'] },
              { title: '💎 Curadoria exclusiva', items: ['100% personalizado', 'Seleção sob medida', 'Garantia de satisfação', 'Concierge dedicado'] },
            ),
            questionBlock('lp-q9', 'Prefere experiência de compra?', [
              { text: 'Showroom privativo', value: 'private' },
              { text: 'Boutique exclusiva', value: 'boutique' },
              { text: 'Online com curadoria VIP', value: 'online' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Preferência de investimento para esta aquisição?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 10.000', value: 'entry' },
            { text: 'R$ 10.000 - R$ 50.000', value: 'premium' },
            { text: 'R$ 50.000 - R$ 150.000', value: 'luxury' },
            { text: 'Acima de R$ 150.000', value: 'exclusive' },
          ],
          order_number: 10,
          blocks: [
            questionBlock('lp-q10', 'Preferência de investimento para esta aquisição?', [
              { text: 'Até R$ 10.000', value: 'entry' },
              { text: 'R$ 10.000 - R$ 50.000', value: 'premium' },
              { text: 'R$ 50.000 - R$ 150.000', value: 'luxury' },
              { text: 'Acima de R$ 150.000', value: 'exclusive' },
            ], 'single_choice', 1),
            socialProofBlock('lp-q10', 2, [
              { name: 'Cliente VIP', text: 'A curadoria personalizada encontrou exatamente o que eu buscava', rating: 5 },
              { name: 'Colecionador', text: 'Peças únicas que não encontrei em nenhum outro lugar', rating: 5 },
            ]),
          ],
        },
        // FASE 5: Conclusão guiada
        {
          question_text: 'Deseja serviço de concierge dedicado?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, valorizo assistência personalizada', value: 'yes' },
            { text: 'Não necessário', value: 'no' },
          ],
          order_number: 11,
          blocks: [
            questionBlock('lp-q11', 'Deseja serviço de concierge dedicado?', [
              { text: 'Sim, valorizo assistência personalizada', value: 'yes' },
              { text: 'Não necessário', value: 'no' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quando deseja iniciar sua experiência premium?',
          answer_format: 'single_choice',
          options: [
            { text: 'Imediatamente', value: 'now' },
            { text: 'Próximas semanas', value: 'soon' },
            { text: 'Próximo mês', value: 'month' },
          ],
          order_number: 12,
          blocks: [
            countdownBlock('lp-q12', 0, 10, '✨ Curadoria exclusiva disponível por tempo limitado'),
            questionBlock('lp-q12', 'Quando deseja iniciar sua experiência premium?', [
              { text: 'Imediatamente', value: 'now' },
              { text: 'Próximas semanas', value: 'soon' },
              { text: 'Próximo mês', value: 'month' },
            ], 'single_choice', 1),
          ],
        },
      ],
      formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
      results: [
        {
          result_text: '✨ Sua Curadoria Premium Está Pronta\n\nSelecionamos peças e experiências exclusivas com base no seu perfil sofisticado. Nosso concierge entrará em contato para apresentar as opções.',
          button_text: 'Acessar Coleção Exclusiva',
          condition_type: 'always',
          order_number: 1,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 3. Tech Futurista — Funil para SaaS/Tech
  // ═══════════════════════════════════════════════════════════
  {
    id: 'tech-futurista',
    name: 'Tech Futurista',
    description: 'Funil de auto-convencimento para produtos de tecnologia, SaaS e startups. Identifica necessidade técnica e guia para solução.',
    category: 'engagement',
    icon: '🚀',
    preview: {
      title: 'Descubra a Stack Ideal para seu Projeto',
      description: 'Diagnóstico técnico com recomendações',
      questionCount: 12,
      template: 'criativo',
    },
    config: {
      title: 'Descubra a Stack Ideal para seu Projeto',
      description: 'Análise técnica personalizada para encontrar a melhor solução.',
      questionCount: 12,
      template: 'criativo',
      questions: [
        // FASE 1: Espelhamento
        {
          question_text: 'Que tipo de aplicação você quer desenvolver?',
          answer_format: 'single_choice',
          options: [
            { text: 'Web App', value: 'web' },
            { text: 'Mobile App', value: 'mobile' },
            { text: 'Full Stack Completo', value: 'fullstack' },
            { text: 'SaaS / Plataforma', value: 'saas' },
          ],
          order_number: 1,
          blocks: [
            textBlock('tf-q1', '<p>🚀 Vamos analisar suas necessidades para recomendar a stack perfeita.</p>', 0),
            questionBlock('tf-q1', 'Que tipo de aplicação você quer desenvolver?', [
              { text: 'Web App', value: 'web' },
              { text: 'Mobile App', value: 'mobile' },
              { text: 'Full Stack Completo', value: 'fullstack' },
              { text: 'SaaS / Plataforma', value: 'saas' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Tamanho da equipe de desenvolvimento?',
          answer_format: 'single_choice',
          options: [
            { text: 'Solo developer', value: 'solo' },
            { text: '2-5 devs', value: 'small' },
            { text: '6-20 devs', value: 'medium' },
            { text: 'Mais de 20', value: 'large' },
          ],
          order_number: 2,
          blocks: [
            questionBlock('tf-q2', 'Tamanho da equipe de desenvolvimento?', [
              { text: 'Solo developer', value: 'solo' },
              { text: '2-5 devs', value: 'small' },
              { text: '6-20 devs', value: 'medium' },
              { text: 'Mais de 20', value: 'large' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Qual sua prioridade principal?',
          answer_format: 'single_choice',
          options: [
            { text: 'Performance máxima', value: 'performance' },
            { text: 'Escalabilidade', value: 'scalability' },
            { text: 'Time to Market rápido', value: 'speed' },
            { text: 'Custo baixo de manutenção', value: 'cost' },
          ],
          order_number: 3,
          blocks: [
            questionBlock('tf-q3', 'Qual sua prioridade principal?', [
              { text: 'Performance máxima', value: 'performance' },
              { text: 'Escalabilidade', value: 'scalability' },
              { text: 'Time to Market rápido', value: 'speed' },
              { text: 'Custo baixo de manutenção', value: 'cost' },
            ], 'single_choice', 1),
            progressBlock('tf-q3', 2, 25, 'Stack sendo analisada'),
          ],
        },
        // FASE 2: Amplificação da dor
        {
          question_text: 'Você já perdeu tempo/dinheiro com uma escolha técnica errada?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim — meses de retrabalho', value: 'months' },
            { text: 'Sim — algumas semanas', value: 'weeks' },
            { text: 'Não, mas tenho medo disso', value: 'fear' },
            { text: 'Nunca tive problemas', value: 'never' },
          ],
          order_number: 4,
          blocks: [
            textBlock('tf-q4', '<p><strong>⚠️ Dado:</strong> Escolhas técnicas erradas custam em média <strong>6 meses de atraso</strong> em startups.</p>', 0),
            questionBlock('tf-q4', 'Você já perdeu tempo/dinheiro com uma escolha técnica errada?', [
              { text: 'Sim — meses de retrabalho', value: 'months' },
              { text: 'Sim — algumas semanas', value: 'weeks' },
              { text: 'Não, mas tenho medo disso', value: 'fear' },
              { text: 'Nunca tive problemas', value: 'never' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Volume de usuários esperado no primeiro ano?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até 1.000', value: 'small' },
            { text: '1.000 - 10.000', value: 'medium' },
            { text: '10.000 - 100.000', value: 'large' },
            { text: 'Acima de 100.000', value: 'massive' },
          ],
          order_number: 5,
          blocks: [
            questionBlock('tf-q5', 'Volume de usuários esperado no primeiro ano?', [
              { text: 'Até 1.000', value: 'small' },
              { text: '1.000 - 10.000', value: 'medium' },
              { text: '10.000 - 100.000', value: 'large' },
              { text: 'Acima de 100.000', value: 'massive' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Necessita de inteligência artificial / ML?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Machine Learning', value: 'ml' },
            { text: 'NLP / Chatbot', value: 'nlp' },
            { text: 'Visão computacional', value: 'vision' },
            { text: 'Recomendação personalizada', value: 'recommendation' },
            { text: 'Não necessário', value: 'none' },
          ],
          order_number: 6,
          blocks: [
            questionBlock('tf-q6', 'Necessita de inteligência artificial / ML?', [
              { text: 'Machine Learning', value: 'ml' },
              { text: 'NLP / Chatbot', value: 'nlp' },
              { text: 'Visão computacional', value: 'vision' },
              { text: 'Recomendação personalizada', value: 'recommendation' },
              { text: 'Não necessário', value: 'none' },
            ], 'multiple_choice', 1),
          ],
        },
        // FASE 3: Consequência
        {
          question_text: 'Qual o maior risco se o projeto atrasar?',
          answer_format: 'single_choice',
          options: [
            { text: 'Concorrente lança antes', value: 'competition' },
            { text: 'Investidor perde paciência', value: 'investor' },
            { text: 'Custo sobe demais', value: 'cost' },
            { text: 'Equipe desmotiva', value: 'team' },
          ],
          order_number: 7,
          blocks: [
            questionBlock('tf-q7', 'Qual o maior risco se o projeto atrasar?', [
              { text: 'Concorrente lança antes', value: 'competition' },
              { text: 'Investidor perde paciência', value: 'investor' },
              { text: 'Custo sobe demais', value: 'cost' },
              { text: 'Equipe desmotiva', value: 'team' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Deadline para lançamento do MVP?',
          answer_format: 'single_choice',
          options: [
            { text: '1-2 meses', value: 'urgent' },
            { text: '3-4 meses', value: 'soon' },
            { text: '5-6 meses', value: 'moderate' },
            { text: 'Mais de 6 meses', value: 'flexible' },
          ],
          order_number: 8,
          blocks: [
            questionBlock('tf-q8', 'Deadline para lançamento do MVP?', [
              { text: '1-2 meses', value: 'urgent' },
              { text: '3-4 meses', value: 'soon' },
              { text: '5-6 meses', value: 'moderate' },
              { text: 'Mais de 6 meses', value: 'flexible' },
            ], 'single_choice', 1),
            progressBlock('tf-q8', 2, 65, 'Análise técnica em andamento'),
          ],
        },
        // FASE 4: Contraste
        {
          question_text: 'Modelo de dados esperado?',
          answer_format: 'single_choice',
          options: [
            { text: 'SQL Relacional', value: 'sql' },
            { text: 'NoSQL Documento', value: 'nosql' },
            { text: 'Híbrido', value: 'hybrid' },
            { text: 'Não sei — preciso de orientação', value: 'unknown' },
          ],
          order_number: 9,
          blocks: [
            comparisonBlock('tf-q9', 0,
              { title: '❌ Sem planejamento', items: ['Retrabalho constante', 'Bugs em produção', 'Escala impossível', 'Dívida técnica'] },
              { title: '✅ Stack planejada', items: ['Desenvolvimento fluido', 'Deploy confiável', 'Escala sob demanda', 'Código limpo'] },
            ),
            questionBlock('tf-q9', 'Modelo de dados esperado?', [
              { text: 'SQL Relacional', value: 'sql' },
              { text: 'NoSQL Documento', value: 'nosql' },
              { text: 'Híbrido', value: 'hybrid' },
              { text: 'Não sei — preciso de orientação', value: 'unknown' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Orçamento mensal para infraestrutura cloud?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até $100/mês', value: 'minimal' },
            { text: '$100 - $500/mês', value: 'low' },
            { text: '$500 - $2000/mês', value: 'medium' },
            { text: 'Acima de $2000/mês', value: 'high' },
          ],
          order_number: 10,
          blocks: [
            questionBlock('tf-q10', 'Orçamento mensal para infraestrutura cloud?', [
              { text: 'Até $100/mês', value: 'minimal' },
              { text: '$100 - $500/mês', value: 'low' },
              { text: '$500 - $2000/mês', value: 'medium' },
              { text: 'Acima de $2000/mês', value: 'high' },
            ], 'single_choice', 1),
            socialProofBlock('tf-q10', 2, [
              { name: 'StartupX', text: 'O diagnóstico técnico evitou 4 meses de retrabalho', rating: 5 },
              { name: 'DevTeam', text: 'Escolhemos a stack certa e lançamos em 2 meses', rating: 5 },
            ]),
          ],
        },
        // FASE 5: Conclusão guiada
        {
          question_text: 'Necessidade de suporte em tempo real (WebSocket/Realtime)?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, essencial', value: 'yes' },
            { text: 'Seria bom ter', value: 'nice' },
            { text: 'Não necessário', value: 'no' },
          ],
          order_number: 11,
          blocks: [
            questionBlock('tf-q11', 'Necessidade de suporte em tempo real (WebSocket/Realtime)?', [
              { text: 'Sim, essencial', value: 'yes' },
              { text: 'Seria bom ter', value: 'nice' },
              { text: 'Não necessário', value: 'no' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quer receber sua arquitetura técnica recomendada?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, quero agora!', value: 'now' },
            { text: 'Sim, nas próximas semanas', value: 'soon' },
            { text: 'Preciso alinhar com a equipe', value: 'team' },
          ],
          order_number: 12,
          blocks: [
            countdownBlock('tf-q12', 0, 10, '🚀 Consultoria técnica gratuita por tempo limitado'),
            questionBlock('tf-q12', 'Quer receber sua arquitetura técnica recomendada?', [
              { text: 'Sim, quero agora!', value: 'now' },
              { text: 'Sim, nas próximas semanas', value: 'soon' },
              { text: 'Preciso alinhar com a equipe', value: 'team' },
            ], 'single_choice', 1),
          ],
        },
      ],
      formConfig: { collect_name: true, collect_email: true, collect_whatsapp: false, collection_timing: 'after' },
      results: [
        {
          result_text: '🚀 Stack Técnica Recomendada\n\nPreparamos a arquitetura ideal para seu projeto com base nas suas necessidades. Nossa equipe está pronta para detalhar a implementação.',
          button_text: 'Ver Arquitetura Completa',
          condition_type: 'always',
          order_number: 1,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 4. Saúde & Medicina — Funil de consciência médica
  // ═══════════════════════════════════════════════════════════
  {
    id: 'saude-medico',
    name: 'Saúde & Medicina',
    description: 'Funil de auto-convencimento para clínicas, consultórios e profissionais de saúde. Identifica sintomas, amplifica preocupação e guia para consulta.',
    category: 'lead_qualification',
    icon: '🏥',
    preview: {
      title: 'Avaliação de Saúde Personalizada',
      description: 'Check-up inteligente com orientações',
      questionCount: 12,
      template: 'minimalista',
    },
    config: {
      title: 'Avaliação de Saúde Personalizada',
      description: 'Responda com sinceridade para receber orientações personalizadas.',
      questionCount: 12,
      template: 'minimalista',
      questions: [
        // FASE 1: Espelhamento
        {
          question_text: 'Qual sua faixa etária?',
          answer_format: 'single_choice',
          options: [
            { text: '18-30 anos', value: 'young' },
            { text: '31-45 anos', value: 'adult' },
            { text: '46-60 anos', value: 'mature' },
            { text: 'Acima de 60', value: 'senior' },
          ],
          order_number: 1,
          blocks: [
            textBlock('sm-q1', '<p>Esta avaliação é confidencial e serve apenas para orientar recomendações.</p>', 0),
            questionBlock('sm-q1', 'Qual sua faixa etária?', [
              { text: '18-30 anos', value: 'young' },
              { text: '31-45 anos', value: 'adult' },
              { text: '46-60 anos', value: 'mature' },
              { text: 'Acima de 60', value: 'senior' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Com que frequência pratica atividades físicas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sedentário', value: 'sedentary' },
            { text: '1-2x por semana', value: 'light' },
            { text: '3-4x por semana', value: 'moderate' },
            { text: '5+ vezes por semana', value: 'active' },
          ],
          order_number: 2,
          blocks: [
            questionBlock('sm-q2', 'Com que frequência pratica atividades físicas?', [
              { text: 'Sedentário', value: 'sedentary' },
              { text: '1-2x por semana', value: 'light' },
              { text: '3-4x por semana', value: 'moderate' },
              { text: '5+ vezes por semana', value: 'active' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Como descreveria sua alimentação?',
          answer_format: 'single_choice',
          options: [
            { text: 'Fast food / processados frequentes', value: 'poor' },
            { text: 'Equilibrada com exceções', value: 'moderate' },
            { text: 'Saudável e balanceada', value: 'good' },
            { text: 'Dieta acompanhada', value: 'excellent' },
          ],
          order_number: 3,
          blocks: [
            questionBlock('sm-q3', 'Como descreveria sua alimentação?', [
              { text: 'Fast food / processados frequentes', value: 'poor' },
              { text: 'Equilibrada com exceções', value: 'moderate' },
              { text: 'Saudável e balanceada', value: 'good' },
              { text: 'Dieta acompanhada', value: 'excellent' },
            ], 'single_choice', 1),
            progressBlock('sm-q3', 2, 25, 'Perfil de saúde mapeado'),
          ],
        },
        // FASE 2: Amplificação da dor
        {
          question_text: 'Possui histórico familiar de doenças?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Diabetes', value: 'diabetes' },
            { text: 'Hipertensão', value: 'hypertension' },
            { text: 'Problemas cardíacos', value: 'heart' },
            { text: 'Colesterol alto', value: 'cholesterol' },
            { text: 'Nenhum histórico', value: 'none' },
          ],
          order_number: 4,
          blocks: [
            textBlock('sm-q4', '<p><strong>⚕️ Importante:</strong> Histórico familiar é um dos principais fatores de risco para doenças crônicas.</p>', 0),
            questionBlock('sm-q4', 'Possui histórico familiar de doenças?', [
              { text: 'Diabetes', value: 'diabetes' },
              { text: 'Hipertensão', value: 'hypertension' },
              { text: 'Problemas cardíacos', value: 'heart' },
              { text: 'Colesterol alto', value: 'cholesterol' },
              { text: 'Nenhum histórico', value: 'none' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Qualidade do seu sono?',
          answer_format: 'single_choice',
          options: [
            { text: 'Excelente — 7-8h reparadoras', value: 'excellent' },
            { text: 'Bom — durmo bem geralmente', value: 'good' },
            { text: 'Regular — acordo cansado(a)', value: 'fair' },
            { text: 'Ruim — insônia frequente', value: 'poor' },
          ],
          order_number: 5,
          blocks: [
            questionBlock('sm-q5', 'Qualidade do seu sono?', [
              { text: 'Excelente — 7-8h reparadoras', value: 'excellent' },
              { text: 'Bom — durmo bem geralmente', value: 'good' },
              { text: 'Regular — acordo cansado(a)', value: 'fair' },
              { text: 'Ruim — insônia frequente', value: 'poor' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Nível de estresse no dia a dia?',
          answer_format: 'single_choice',
          options: [
            { text: 'Baixo — vida tranquila', value: 'low' },
            { text: 'Moderado — gerenciável', value: 'moderate' },
            { text: 'Alto — pressão constante', value: 'high' },
            { text: 'Muito alto — próximo de burnout', value: 'veryhigh' },
          ],
          order_number: 6,
          blocks: [
            questionBlock('sm-q6', 'Nível de estresse no dia a dia?', [
              { text: 'Baixo — vida tranquila', value: 'low' },
              { text: 'Moderado — gerenciável', value: 'moderate' },
              { text: 'Alto — pressão constante', value: 'high' },
              { text: 'Muito alto — próximo de burnout', value: 'veryhigh' },
            ], 'single_choice', 1),
            sliderBlock('sm-q6', 2, 'Nível de estresse', 1, 10, 1, ''),
          ],
        },
        // FASE 3: Consequência
        {
          question_text: 'Faz check-ups médicos regularmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, anualmente ou mais', value: 'yes' },
            { text: 'Só quando sinto algo', value: 'reactive' },
            { text: 'Raramente vou ao médico', value: 'rarely' },
            { text: 'Faz anos que não faço', value: 'never' },
          ],
          order_number: 7,
          blocks: [
            textBlock('sm-q7', '<p>A prevenção é <strong>7x mais barata</strong> que o tratamento de doenças diagnosticadas tardiamente.</p>', 0),
            questionBlock('sm-q7', 'Faz check-ups médicos regularmente?', [
              { text: 'Sim, anualmente ou mais', value: 'yes' },
              { text: 'Só quando sinto algo', value: 'reactive' },
              { text: 'Raramente vou ao médico', value: 'rarely' },
              { text: 'Faz anos que não faço', value: 'never' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Qual seu principal objetivo de saúde?',
          answer_format: 'single_choice',
          options: [
            { text: 'Prevenir doenças', value: 'prevention' },
            { text: 'Perder peso', value: 'weight' },
            { text: 'Melhorar saúde mental', value: 'mental' },
            { text: 'Controlar condição existente', value: 'control' },
            { text: 'Melhorar qualidade de vida geral', value: 'general' },
          ],
          order_number: 8,
          blocks: [
            questionBlock('sm-q8', 'Qual seu principal objetivo de saúde?', [
              { text: 'Prevenir doenças', value: 'prevention' },
              { text: 'Perder peso', value: 'weight' },
              { text: 'Melhorar saúde mental', value: 'mental' },
              { text: 'Controlar condição existente', value: 'control' },
              { text: 'Melhorar qualidade de vida geral', value: 'general' },
            ], 'single_choice', 1),
            progressBlock('sm-q8', 2, 65, 'Avaliação em andamento'),
          ],
        },
        // FASE 4: Contraste
        {
          question_text: 'Quanto um acompanhamento médico regular mudaria sua qualidade de vida?',
          answer_format: 'single_choice',
          options: [
            { text: 'Mudaria completamente', value: 'everything' },
            { text: 'Ajudaria bastante', value: 'a_lot' },
            { text: 'Ajudaria um pouco', value: 'a_little' },
          ],
          order_number: 9,
          blocks: [
            comparisonBlock('sm-q9', 0,
              { title: '😰 Sem acompanhamento', items: ['Diagnóstico tardio', 'Tratamentos caros', 'Estresse constante', 'Qualidade de vida comprometida'] },
              { title: '😊 Com acompanhamento', items: ['Prevenção ativa', 'Custos controlados', 'Tranquilidade', 'Saúde otimizada'] },
            ),
            questionBlock('sm-q9', 'Quanto um acompanhamento médico regular mudaria sua qualidade de vida?', [
              { text: 'Mudaria completamente', value: 'everything' },
              { text: 'Ajudaria bastante', value: 'a_lot' },
              { text: 'Ajudaria um pouco', value: 'a_little' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Possui plano de saúde?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, plano completo', value: 'full' },
            { text: 'Sim, plano básico', value: 'basic' },
            { text: 'Não, uso sistema público', value: 'public' },
            { text: 'Não, pago particular', value: 'private' },
          ],
          order_number: 10,
          blocks: [
            questionBlock('sm-q10', 'Possui plano de saúde?', [
              { text: 'Sim, plano completo', value: 'full' },
              { text: 'Sim, plano básico', value: 'basic' },
              { text: 'Não, uso sistema público', value: 'public' },
              { text: 'Não, pago particular', value: 'private' },
            ], 'single_choice', 1),
            socialProofBlock('sm-q10', 2, [
              { name: 'Carla M.', text: 'O check-up preventivo detectou algo que eu nem sentia. Tratei cedo!', rating: 5 },
              { name: 'Roberto S.', text: 'Nunca fazia exames. Depois do quiz, agendei e mudou minha vida.', rating: 5 },
            ]),
          ],
        },
        // FASE 5: Conclusão guiada
        {
          question_text: 'Você gostaria de agendar uma avaliação com nossos especialistas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, quero agendar!', value: 'yes' },
            { text: 'Sim, mas preciso saber os custos', value: 'yes_cost' },
            { text: 'Talvez mais tarde', value: 'later' },
          ],
          order_number: 11,
          blocks: [
            questionBlock('sm-q11', 'Você gostaria de agendar uma avaliação com nossos especialistas?', [
              { text: 'Sim, quero agendar!', value: 'yes' },
              { text: 'Sim, mas preciso saber os custos', value: 'yes_cost' },
              { text: 'Talvez mais tarde', value: 'later' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quando gostaria de realizar sua consulta?',
          answer_format: 'single_choice',
          options: [
            { text: 'Esta semana', value: 'this_week' },
            { text: 'Próxima semana', value: 'next_week' },
            { text: 'Este mês', value: 'this_month' },
          ],
          order_number: 12,
          blocks: [
            countdownBlock('sm-q12', 0, 15, '⏳ Vagas para avaliação gratuita encerrando'),
            questionBlock('sm-q12', 'Quando gostaria de realizar sua consulta?', [
              { text: 'Esta semana', value: 'this_week' },
              { text: 'Próxima semana', value: 'next_week' },
              { text: 'Este mês', value: 'this_month' },
            ], 'single_choice', 1),
          ],
        },
      ],
      formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
      results: [
        {
          result_text: '🏥 Avaliação de Saúde Completa\n\nCom base no seu perfil, recomendamos uma consulta com nossos especialistas para um plano de saúde personalizado. Agende sua avaliação inicial.',
          button_text: 'Agendar Consulta',
          condition_type: 'always',
          order_number: 1,
        },
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // 5. Fitness & Energia — Funil de transformação
  // ═══════════════════════════════════════════════════════════
  {
    id: 'fitness-energia',
    name: 'Fitness & Energia',
    description: 'Funil de auto-convencimento para personal trainers, academias e programas fitness. Do sedentarismo à decisão de começar.',
    category: 'engagement',
    icon: '💪',
    preview: {
      title: 'Descubra seu Treino Ideal',
      description: 'Programa fitness personalizado',
      questionCount: 12,
      template: 'criativo',
    },
    config: {
      title: 'Descubra seu Treino Ideal',
      description: 'Análise completa para montar o programa perfeito para você.',
      questionCount: 12,
      template: 'criativo',
      questions: [
        // FASE 1: Espelhamento
        {
          question_text: 'Qual seu principal objetivo fitness?',
          answer_format: 'single_choice',
          options: [
            { text: 'Perder peso/gordura', value: 'weightloss' },
            { text: 'Ganhar massa muscular', value: 'muscle' },
            { text: 'Definição corporal', value: 'definition' },
            { text: 'Melhorar saúde geral', value: 'health' },
            { text: 'Performance atlética', value: 'performance' },
          ],
          order_number: 1,
          blocks: [
            textBlock('fe-q1', '<p>💪 Vamos montar o treino perfeito para seus objetivos!</p>', 0),
            questionBlock('fe-q1', 'Qual seu principal objetivo fitness?', [
              { text: 'Perder peso/gordura', value: 'weightloss' },
              { text: 'Ganhar massa muscular', value: 'muscle' },
              { text: 'Definição corporal', value: 'definition' },
              { text: 'Melhorar saúde geral', value: 'health' },
              { text: 'Performance atlética', value: 'performance' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Nível atual de condicionamento?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sedentário — iniciante total', value: 'beginner' },
            { text: 'Iniciante — pouca atividade', value: 'novice' },
            { text: 'Intermediário — treino regular', value: 'intermediate' },
            { text: 'Avançado — treino intenso', value: 'advanced' },
          ],
          order_number: 2,
          blocks: [
            questionBlock('fe-q2', 'Nível atual de condicionamento?', [
              { text: 'Sedentário — iniciante total', value: 'beginner' },
              { text: 'Iniciante — pouca atividade', value: 'novice' },
              { text: 'Intermediário — treino regular', value: 'intermediate' },
              { text: 'Avançado — treino intenso', value: 'advanced' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quantos dias por semana pode treinar?',
          answer_format: 'single_choice',
          options: [
            { text: '1-2 dias', value: 'minimal' },
            { text: '3 dias', value: 'moderate' },
            { text: '4-5 dias', value: 'regular' },
            { text: '6+ dias', value: 'intense' },
          ],
          order_number: 3,
          blocks: [
            questionBlock('fe-q3', 'Quantos dias por semana pode treinar?', [
              { text: '1-2 dias', value: 'minimal' },
              { text: '3 dias', value: 'moderate' },
              { text: '4-5 dias', value: 'regular' },
              { text: '6+ dias', value: 'intense' },
            ], 'single_choice', 1),
            progressBlock('fe-q3', 2, 25, 'Perfil fitness mapeado'),
          ],
        },
        // FASE 2: Amplificação da dor
        {
          question_text: 'O que mais te incomoda no seu corpo/saúde atualmente?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Falta de energia no dia a dia', value: 'energy' },
            { text: 'Excesso de peso', value: 'weight' },
            { text: 'Falta de autoconfiança', value: 'confidence' },
            { text: 'Dores no corpo', value: 'pain' },
            { text: 'Roupas que não servem mais', value: 'clothes' },
          ],
          order_number: 4,
          blocks: [
            textBlock('fe-q4', '<p><strong>📊 Fato:</strong> 80% das pessoas que começam um treino sem orientação desistem em 3 meses.</p>', 0),
            questionBlock('fe-q4', 'O que mais te incomoda no seu corpo/saúde atualmente?', [
              { text: 'Falta de energia no dia a dia', value: 'energy' },
              { text: 'Excesso de peso', value: 'weight' },
              { text: 'Falta de autoconfiança', value: 'confidence' },
              { text: 'Dores no corpo', value: 'pain' },
              { text: 'Roupas que não servem mais', value: 'clothes' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Preferência de tipo de treino?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Musculação', value: 'weights' },
            { text: 'Funcional / CrossFit', value: 'functional' },
            { text: 'Cardio / corrida', value: 'cardio' },
            { text: 'Yoga / pilates', value: 'flexibility' },
            { text: 'Lutas', value: 'martial' },
          ],
          order_number: 5,
          blocks: [
            questionBlock('fe-q5', 'Preferência de tipo de treino?', [
              { text: 'Musculação', value: 'weights' },
              { text: 'Funcional / CrossFit', value: 'functional' },
              { text: 'Cardio / corrida', value: 'cardio' },
              { text: 'Yoga / pilates', value: 'flexibility' },
              { text: 'Lutas', value: 'martial' },
            ], 'multiple_choice', 1),
          ],
        },
        {
          question_text: 'Você já tentou programas fitness antes e desistiu?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, várias vezes — é frustrante', value: 'many' },
            { text: 'Sim, uma ou duas vezes', value: 'few' },
            { text: 'Nunca tentei seriamente', value: 'never' },
            { text: 'Não, sempre mantenho consistência', value: 'consistent' },
          ],
          order_number: 6,
          blocks: [
            questionBlock('fe-q6', 'Você já tentou programas fitness antes e desistiu?', [
              { text: 'Sim, várias vezes — é frustrante', value: 'many' },
              { text: 'Sim, uma ou duas vezes', value: 'few' },
              { text: 'Nunca tentei seriamente', value: 'never' },
              { text: 'Não, sempre mantenho consistência', value: 'consistent' },
            ], 'single_choice', 1),
          ],
        },
        // FASE 3: Consequência
        {
          question_text: 'Se nada mudar, como você se imagina daqui a 1 ano?',
          answer_format: 'single_choice',
          options: [
            { text: 'Pior do que estou — preocupante', value: 'worse' },
            { text: 'Igual — estagnado(a)', value: 'same' },
            { text: 'Talvez um pouco melhor', value: 'slightly' },
          ],
          order_number: 7,
          blocks: [
            questionBlock('fe-q7', 'Se nada mudar, como você se imagina daqui a 1 ano?', [
              { text: 'Pior do que estou — preocupante', value: 'worse' },
              { text: 'Igual — estagnado(a)', value: 'same' },
              { text: 'Talvez um pouco melhor', value: 'slightly' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Possui alguma restrição física ou lesão?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, tenho restrições', value: 'yes' },
            { text: 'Não, estou liberado(a)', value: 'no' },
          ],
          order_number: 8,
          blocks: [
            questionBlock('fe-q8', 'Possui alguma restrição física ou lesão?', [
              { text: 'Sim, tenho restrições', value: 'yes' },
              { text: 'Não, estou liberado(a)', value: 'no' },
            ], 'single_choice', 1),
            progressBlock('fe-q8', 2, 65, 'Plano sendo montado'),
          ],
        },
        // FASE 4: Contraste
        {
          question_text: 'Imagine ter o corpo e a energia que sempre quis. Quanto isso mudaria sua vida?',
          answer_format: 'single_choice',
          options: [
            { text: 'Mudaria absolutamente tudo', value: 'everything' },
            { text: 'Mudaria muito — autoestima e saúde', value: 'a_lot' },
            { text: 'Ajudaria bastante', value: 'a_little' },
          ],
          order_number: 9,
          blocks: [
            comparisonBlock('fe-q9', 0,
              { title: '😔 Sem treino', items: ['Cansaço constante', 'Autoestima baixa', 'Saúde frágil', 'Roupas que não servem'] },
              { title: '💪 Com treino guiado', items: ['Energia o dia todo', 'Confiança elevada', 'Saúde forte', 'Corpo que você quer'] },
            ),
            questionBlock('fe-q9', 'Imagine ter o corpo e a energia que sempre quis. Quanto isso mudaria sua vida?', [
              { text: 'Mudaria absolutamente tudo', value: 'everything' },
              { text: 'Mudaria muito — autoestima e saúde', value: 'a_lot' },
              { text: 'Ajudaria bastante', value: 'a_little' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Onde prefere treinar?',
          answer_format: 'single_choice',
          options: [
            { text: 'Academia', value: 'gym' },
            { text: 'Em casa', value: 'home' },
            { text: 'Ao ar livre', value: 'outdoor' },
            { text: 'Híbrido', value: 'hybrid' },
          ],
          order_number: 10,
          blocks: [
            questionBlock('fe-q10', 'Onde prefere treinar?', [
              { text: 'Academia', value: 'gym' },
              { text: 'Em casa', value: 'home' },
              { text: 'Ao ar livre', value: 'outdoor' },
              { text: 'Híbrido', value: 'hybrid' },
            ], 'single_choice', 1),
            socialProofBlock('fe-q10', 2, [
              { name: 'Lucas M.', text: 'Perdi 15kg em 4 meses com o plano personalizado!', rating: 5 },
              { name: 'Marina S.', text: 'Nunca conseguia manter. Agora treino há 8 meses seguidos.', rating: 5 },
            ]),
          ],
        },
        // FASE 5: Conclusão guiada
        {
          question_text: 'Quanto pretende investir mensalmente no seu programa fitness?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 100', value: 'minimal' },
            { text: 'R$ 100 - R$ 300', value: 'basic' },
            { text: 'R$ 300 - R$ 600', value: 'standard' },
            { text: 'Acima de R$ 600', value: 'premium' },
          ],
          order_number: 11,
          blocks: [
            questionBlock('fe-q11', 'Quanto pretende investir mensalmente no seu programa fitness?', [
              { text: 'Até R$ 100', value: 'minimal' },
              { text: 'R$ 100 - R$ 300', value: 'basic' },
              { text: 'R$ 300 - R$ 600', value: 'standard' },
              { text: 'Acima de R$ 600', value: 'premium' },
            ], 'single_choice', 1),
          ],
        },
        {
          question_text: 'Quando você quer começar sua transformação?',
          answer_format: 'single_choice',
          options: [
            { text: 'Agora — já perdi tempo demais!', value: 'now' },
            { text: 'Esta semana', value: 'this_week' },
            { text: 'Próximo mês', value: 'next_month' },
          ],
          order_number: 12,
          blocks: [
            countdownBlock('fe-q12', 0, 10, '🔥 Vagas limitadas para avaliação gratuita'),
            questionBlock('fe-q12', 'Quando você quer começar sua transformação?', [
              { text: 'Agora — já perdi tempo demais!', value: 'now' },
              { text: 'Esta semana', value: 'this_week' },
              { text: 'Próximo mês', value: 'next_month' },
            ], 'single_choice', 1),
          ],
        },
      ],
      formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
      results: [
        {
          result_text: '💪 Seu Plano Fitness Personalizado Está Pronto!\n\nMontamos o programa ideal para seus objetivos, nível e disponibilidade. Inclui treino, orientação nutricional e acompanhamento.',
          button_text: 'Começar Minha Transformação',
          condition_type: 'always',
          order_number: 1,
        },
      ],
    },
  },
];
