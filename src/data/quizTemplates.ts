export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'product_discovery' | 'customer_satisfaction' | 'engagement';
  icon: string;
  preview: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
  };
  config: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
    questions: Array<{
      id?: string;
      question_text: string;
      custom_label?: string;
      answer_format: 'single_choice' | 'multiple_choice' | 'yes_no';
      options: Array<{ text: string; value: string; imageUrl?: string }>;
      order_number: number;
      blocks?: any[];
    }>;
    formConfig: {
      collect_name: boolean;
      collect_email: boolean;
      collect_whatsapp: boolean;
      collection_timing: 'before' | 'after';
    };
    results: Array<{
      result_text: string;
      button_text: string;
      condition_type: 'always' | 'score_range' | 'specific_answers';
      order_number: number;
    }>;
  };
}

// ──────────────────────────────────────────────────────────────────────
// Helper: cria bloco de pergunta padrão com texto introdutório
// ──────────────────────────────────────────────────────────────────────
function questionBlock(id: string, text: string, opts: any[], format = 'single_choice', order = 1) {
  return {
    id: `block-${id}-question`,
    type: 'question',
    order,
    content: text,
    options: opts,
    answerFormat: format,
    required: true,
    autoAdvance: false,
  };
}

function textBlock(id: string, html: string, order = 0) {
  return { id: `block-${id}-text`, type: 'text', order, content: html, fontSize: 'medium', textAlign: 'left' };
}

function separatorBlock(id: string, order = 0) {
  return { id: `block-${id}-sep`, type: 'separator', order, content: '', style: 'solid' };
}

function socialProofBlock(id: string, order: number, items: Array<{ name: string; text: string; rating?: number }>) {
  return {
    id: `block-${id}-social`,
    type: 'social_proof',
    order,
    notifications: items.map((i, idx) => ({
      id: `sp-${id}-${idx}`,
      name: i.name,
      text: i.text,
      rating: i.rating ?? 5,
      timeAgo: `${Math.floor(Math.random() * 20) + 1}min atrás`,
    })),
  };
}

function comparisonBlock(id: string, order: number, before: { title: string; items: string[] }, after: { title: string; items: string[] }) {
  return {
    id: `block-${id}-comp`,
    type: 'comparison',
    order,
    beforeTitle: before.title,
    afterTitle: after.title,
    beforeItems: before.items,
    afterItems: after.items,
  };
}

function countdownBlock(id: string, order: number, minutes: number, label: string) {
  return { id: `block-${id}-cd`, type: 'countdown', order, minutes, label, showProgress: true };
}

function progressBlock(id: string, order: number, value: number, label: string) {
  return { id: `block-${id}-prog`, type: 'progress', order, value, label, showPercentage: true };
}

// ══════════════════════════════════════════════════════════════════════
// 1) CAPTAÇÃO DE LEADS — Funil de qualificação + auto-convencimento
// ══════════════════════════════════════════════════════════════════════
const leadCaptureTemplate: QuizTemplate = {
  id: 'funil-captacao-leads',
  name: '🎯 Captação de Leads — Funil Persuasivo',
  description: 'Quiz de 10 perguntas com funil de auto-convencimento para qualificar e aquecer leads antes do checkout',
  category: 'lead_qualification',
  icon: '🎯',
  preview: {
    title: 'Descubra a solução ideal para o seu negócio',
    description: 'Responda 10 perguntas e receba uma recomendação personalizada',
    questionCount: 10,
    template: 'moderno',
  },
  config: {
    title: 'Descubra a solução ideal para o seu negócio',
    description: 'Em apenas 2 minutos, vamos entender sua situação e indicar o melhor caminho',
    questionCount: 10,
    template: 'moderno',
    questions: [
      // ── FASE 1: ESPELHAMENTO (perguntas 1-3) ──
      {
        id: 'lc-1',
        question_text: 'Qual o tamanho da sua operação hoje?',
        custom_label: '🧊 Espelhamento',
        answer_format: 'single_choice',
        options: [
          { text: 'Sou solo / freelancer', value: 'solo' },
          { text: 'Tenho equipe pequena (2-10)', value: 'small' },
          { text: 'Time médio (11-50)', value: 'medium' },
          { text: 'Empresa grande (50+)', value: 'large' },
        ],
        order_number: 1,
        blocks: [
          textBlock('lc1', '<h2>Vamos conhecer você</h2><p>Para indicar a melhor solução, precisamos entender sua realidade atual.</p>'),
          separatorBlock('lc1', 1),
          questionBlock('lc1', 'Qual o tamanho da sua operação hoje?', [
            { text: 'Sou solo / freelancer', value: 'solo' },
            { text: 'Tenho equipe pequena (2-10)', value: 'small' },
            { text: 'Time médio (11-50)', value: 'medium' },
            { text: 'Empresa grande (50+)', value: 'large' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'lc-2',
        question_text: 'Há quanto tempo você está no mercado?',
        answer_format: 'single_choice',
        options: [
          { text: 'Estou começando agora', value: 'starting' },
          { text: '1-3 anos', value: '1-3' },
          { text: '3-5 anos', value: '3-5' },
          { text: 'Mais de 5 anos', value: '5+' },
        ],
        order_number: 2,
        blocks: [
          textBlock('lc2', '<p>Cada fase de negócio tem desafios diferentes. Vamos personalizar.</p>'),
          questionBlock('lc2', 'Há quanto tempo você está no mercado?', [
            { text: 'Estou começando agora', value: 'starting' },
            { text: '1-3 anos', value: '1-3' },
            { text: '3-5 anos', value: '3-5' },
            { text: 'Mais de 5 anos', value: '5+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'lc-3',
        question_text: 'Qual seu faturamento mensal atual?',
        answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 5 mil', value: 'up-5k' },
          { text: 'R$ 5 mil a R$ 20 mil', value: '5-20k' },
          { text: 'R$ 20 mil a R$ 100 mil', value: '20-100k' },
          { text: 'Acima de R$ 100 mil', value: '100k+' },
        ],
        order_number: 3,
        blocks: [
          textBlock('lc3', '<p>Isso nos ajuda a calibrar a solução ao seu porte.</p>'),
          questionBlock('lc3', 'Qual seu faturamento mensal atual?', [
            { text: 'Até R$ 5 mil', value: 'up-5k' },
            { text: 'R$ 5 mil a R$ 20 mil', value: '5-20k' },
            { text: 'R$ 20 mil a R$ 100 mil', value: '20-100k' },
            { text: 'Acima de R$ 100 mil', value: '100k+' },
          ], 'single_choice', 1),
        ],
      },

      // ── FASE 2: AMPLIFICAÇÃO DA DOR (perguntas 4-5) ──
      {
        id: 'lc-4',
        question_text: 'Qual é o seu MAIOR gargalo hoje?',
        custom_label: '🔥 Dor Principal',
        answer_format: 'single_choice',
        options: [
          { text: 'Não consigo gerar leads qualificados o suficiente', value: 'leads' },
          { text: 'Tenho leads mas não converto em vendas', value: 'conversion' },
          { text: 'Processo manual me consome tempo demais', value: 'manual' },
          { text: 'Não sei quem é meu cliente ideal', value: 'icp' },
        ],
        order_number: 4,
        blocks: [
          textBlock('lc4', '<h3>Vamos falar do que mais importa</h3><p>Identificar o gargalo certo é o primeiro passo para destravar o crescimento.</p>'),
          separatorBlock('lc4', 1),
          questionBlock('lc4', 'Qual é o seu MAIOR gargalo hoje?', [
            { text: 'Não consigo gerar leads qualificados o suficiente', value: 'leads' },
            { text: 'Tenho leads mas não converto em vendas', value: 'conversion' },
            { text: 'Processo manual me consome tempo demais', value: 'manual' },
            { text: 'Não sei quem é meu cliente ideal', value: 'icp' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'lc-5',
        question_text: 'Quantas horas por semana você perde com tarefas que poderiam ser automatizadas?',
        answer_format: 'single_choice',
        options: [
          { text: 'Menos de 5h', value: '<5h' },
          { text: '5-10 horas', value: '5-10h' },
          { text: '10-20 horas', value: '10-20h' },
          { text: 'Mais de 20 horas', value: '20h+' },
        ],
        order_number: 5,
        blocks: [
          textBlock('lc5', '<p>Pense em follow-ups manuais, planilhas, qualificação de lead uma a uma...</p>'),
          questionBlock('lc5', 'Quantas horas por semana você perde com tarefas que poderiam ser automatizadas?', [
            { text: 'Menos de 5h', value: '<5h' },
            { text: '5-10 horas', value: '5-10h' },
            { text: '10-20 horas', value: '10-20h' },
            { text: 'Mais de 20 horas 😰', value: '20h+' },
          ], 'single_choice', 1),
        ],
      },

      // ── FASE 3: CONSEQUÊNCIA (perguntas 6-7) ──
      {
        id: 'lc-6',
        question_text: 'Se nada mudar nos próximos 6 meses, qual seria o impacto?',
        custom_label: '⚠️ Consequência',
        answer_format: 'single_choice',
        options: [
          { text: 'Vou continuar estagnado', value: 'stagnation' },
          { text: 'Vou perder clientes para concorrentes', value: 'competitors' },
          { text: 'Vou ter que demitir / cortar custos', value: 'cuts' },
          { text: 'Posso fechar o negócio', value: 'close' },
        ],
        order_number: 6,
        blocks: [
          textBlock('lc6', '<h3>O custo de não agir</h3><p>Às vezes, o maior risco é manter tudo como está.</p>'),
          questionBlock('lc6', 'Se nada mudar nos próximos 6 meses, qual seria o impacto?', [
            { text: 'Vou continuar estagnado', value: 'stagnation' },
            { text: 'Vou perder clientes para concorrentes', value: 'competitors' },
            { text: 'Vou ter que demitir / cortar custos', value: 'cuts' },
            { text: 'Posso fechar o negócio', value: 'close' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'lc-7',
        question_text: 'Já tentou alguma solução antes e não funcionou?',
        answer_format: 'single_choice',
        options: [
          { text: 'Nunca tentei nada', value: 'never' },
          { text: 'Sim, tentei por conta própria', value: 'diy' },
          { text: 'Sim, contratei mas não tive resultado', value: 'hired_failed' },
          { text: 'Sim, funcionou parcialmente', value: 'partial' },
        ],
        order_number: 7,
        blocks: [
          textBlock('lc7', '<p>Entender tentativas anteriores nos ajuda a evitar os mesmos erros.</p>'),
          questionBlock('lc7', 'Já tentou alguma solução antes e não funcionou?', [
            { text: 'Nunca tentei nada', value: 'never' },
            { text: 'Sim, tentei por conta própria', value: 'diy' },
            { text: 'Sim, contratei mas não tive resultado', value: 'hired_failed' },
            { text: 'Sim, funcionou parcialmente', value: 'partial' },
          ], 'single_choice', 1),
          socialProofBlock('lc7', 2, [
            { name: 'Carlos M.', text: 'Tentei 3 ferramentas antes. Só com essa consegui resultado real.', rating: 5 },
            { name: 'Ana R.', text: 'Em 2 semanas já tinha mais leads que no mês inteiro.', rating: 5 },
          ]),
        ],
      },

      // ── FASE 4: CONTRASTE (perguntas 8-9) ──
      {
        id: 'lc-8',
        question_text: 'Se existisse uma solução que resolvesse esse gargalo automaticamente, quanto você investiria?',
        custom_label: '✨ Contraste',
        answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 100/mês', value: '100' },
          { text: 'R$ 100-300/mês', value: '100-300' },
          { text: 'R$ 300-500/mês', value: '300-500' },
          { text: 'O valor certo para o resultado certo', value: 'roi' },
        ],
        order_number: 8,
        blocks: [
          comparisonBlock('lc8', 0,
            { title: '❌ Sem solução', items: ['Leads frios', 'Processos manuais', 'Tempo desperdiçado', 'Vendas incertas'] },
            { title: '✅ Com solução', items: ['Leads qualificados', 'Automação total', 'Tempo focado em vender', 'Previsibilidade'] }
          ),
          separatorBlock('lc8', 1),
          questionBlock('lc8', 'Se existisse uma solução que resolvesse esse gargalo automaticamente, quanto você investiria?', [
            { text: 'Até R$ 100/mês', value: '100' },
            { text: 'R$ 100-300/mês', value: '100-300' },
            { text: 'R$ 300-500/mês', value: '300-500' },
            { text: 'O valor certo para o resultado certo', value: 'roi' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'lc-9',
        question_text: 'Quando você quer ver os primeiros resultados?',
        answer_format: 'single_choice',
        options: [
          { text: 'Esta semana!', value: 'week' },
          { text: 'Nos próximos 30 dias', value: '30d' },
          { text: 'Próximos 3 meses', value: '3m' },
          { text: 'Sem pressa, quero fazer direito', value: 'noRush' },
        ],
        order_number: 9,
        blocks: [
          progressBlock('lc9', 0, 90, 'Análise quase completa'),
          questionBlock('lc9', 'Quando você quer ver os primeiros resultados?', [
            { text: 'Esta semana!', value: 'week' },
            { text: 'Nos próximos 30 dias', value: '30d' },
            { text: 'Próximos 3 meses', value: '3m' },
            { text: 'Sem pressa, quero fazer direito', value: 'noRush' },
          ], 'single_choice', 1),
        ],
      },

      // ── FASE 5: CONCLUSÃO GUIADA (pergunta 10) ──
      {
        id: 'lc-10',
        question_text: 'Se pudéssemos resolver seu maior gargalo com uma solução comprovada, você gostaria de saber como?',
        custom_label: '🚀 Decisão',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, quero saber agora!', value: 'yes_now' },
          { text: 'Sim, mas preciso avaliar antes', value: 'yes_later' },
          { text: 'Talvez, me mostre os resultados', value: 'maybe' },
        ],
        order_number: 10,
        blocks: [
          textBlock('lc10', '<h2>🎯 Última pergunta!</h2><p>Baseado nas suas respostas, já temos uma recomendação personalizada para você.</p>'),
          countdownBlock('lc10', 1, 10, 'Sua análise expira em'),
          separatorBlock('lc10', 2),
          questionBlock('lc10', 'Se pudéssemos resolver seu maior gargalo com uma solução comprovada, você gostaria de saber como?', [
            { text: 'Sim, quero saber agora! 🔥', value: 'yes_now' },
            { text: 'Sim, mas preciso avaliar antes', value: 'yes_later' },
            { text: 'Talvez, me mostre os resultados', value: 'maybe' },
          ], 'single_choice', 3),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
    results: [
      {
        result_text: '🔥 Perfil identificado: Lead Qualificado!\n\nCom base nas suas respostas, você tem tudo para destravar resultados rápidos. Sua recomendação personalizada está pronta — clique abaixo para acessar.',
        button_text: 'Ver minha recomendação',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// 2) CONVERSÃO VSL — Pré-qualifica antes de enviar para a VSL
// ══════════════════════════════════════════════════════════════════════
const vslConversionTemplate: QuizTemplate = {
  id: 'funil-pre-vsl',
  name: '📈 Pré-VSL — Filtro de Curiosos',
  description: 'Quiz de 8 perguntas que aquece o lead antes da VSL, filtrando curiosos e amplificando desejo',
  category: 'lead_qualification',
  icon: '📈',
  preview: {
    title: 'Descubra se [produto] é para você',
    description: 'Quiz rápido de qualificação pré-VSL',
    questionCount: 8,
    template: 'moderno',
  },
  config: {
    title: 'Descubra se [produto] é realmente para você',
    description: 'Responda com sinceridade — em 2 minutos saberemos se faz sentido para o seu caso',
    questionCount: 8,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO
      {
        id: 'vsl-1', question_text: 'Qual sua faixa etária?', answer_format: 'single_choice',
        options: [
          { text: '18-25 anos', value: '18-25' }, { text: '26-35 anos', value: '26-35' },
          { text: '36-45 anos', value: '36-45' }, { text: '46+ anos', value: '46+' },
        ],
        order_number: 1,
        blocks: [
          textBlock('vsl1', '<h2>Antes de tudo, vamos te conhecer</h2><p>Isso leva menos de 2 minutos.</p>'),
          questionBlock('vsl1', 'Qual sua faixa etária?', [
            { text: '18-25 anos', value: '18-25' }, { text: '26-35 anos', value: '26-35' },
            { text: '36-45 anos', value: '36-45' }, { text: '46+ anos', value: '46+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-2', question_text: 'Como você descreveria sua situação atual?', answer_format: 'single_choice',
        options: [
          { text: 'Estou frustrado(a) e preciso mudar', value: 'frustrated' },
          { text: 'Estou ok, mas sei que posso melhorar', value: 'ok' },
          { text: 'Estou em um bom momento e quero escalar', value: 'scaling' },
          { text: 'Estou só pesquisando por curiosidade', value: 'curious' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('vsl2', 'Como você descreveria sua situação atual?', [
            { text: 'Estou frustrado(a) e preciso mudar', value: 'frustrated' },
            { text: 'Estou ok, mas sei que posso melhorar', value: 'ok' },
            { text: 'Estou em um bom momento e quero escalar', value: 'scaling' },
            { text: 'Estou só pesquisando por curiosidade', value: 'curious' },
          ]),
        ],
      },
      // DOR
      {
        id: 'vsl-3', question_text: 'O que mais te incomoda na sua rotina hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor',
        options: [
          { text: 'Falta de tempo para o que importa', value: 'time' },
          { text: 'Resultados abaixo do esperado', value: 'results' },
          { text: 'Não saber por onde começar', value: 'lost' },
          { text: 'Já tentei de tudo e nada funciona', value: 'exhausted' },
        ],
        order_number: 3,
        blocks: [
          textBlock('vsl3', '<h3>Vamos ao que importa</h3><p>Ser honesto aqui faz toda a diferença no resultado.</p>'),
          questionBlock('vsl3', 'O que mais te incomoda na sua rotina hoje?', [
            { text: 'Falta de tempo para o que importa', value: 'time' },
            { text: 'Resultados abaixo do esperado', value: 'results' },
            { text: 'Não saber por onde começar', value: 'lost' },
            { text: 'Já tentei de tudo e nada funciona 😩', value: 'exhausted' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-4', question_text: 'Há quanto tempo você convive com esse problema?', answer_format: 'single_choice',
        options: [
          { text: 'Menos de 3 meses', value: '<3m' }, { text: '3-6 meses', value: '3-6m' },
          { text: '6-12 meses', value: '6-12m' }, { text: 'Mais de 1 ano', value: '1y+' },
        ],
        order_number: 4,
        blocks: [
          questionBlock('vsl4', 'Há quanto tempo você convive com esse problema?', [
            { text: 'Menos de 3 meses', value: '<3m' }, { text: '3-6 meses', value: '3-6m' },
            { text: '6-12 meses', value: '6-12m' }, { text: 'Mais de 1 ano 😰', value: '1y+' },
          ]),
        ],
      },
      // CONSEQUÊNCIA
      {
        id: 'vsl-5', question_text: 'O que acontece se você não resolver isso nos próximos 90 dias?', answer_format: 'single_choice',
        custom_label: '⚠️ Consequência',
        options: [
          { text: 'Vou continuar na mesma', value: 'same' },
          { text: 'Posso perder uma oportunidade única', value: 'opportunity' },
          { text: 'Minha situação vai piorar', value: 'worse' },
          { text: 'Vou me arrepender de não ter agido', value: 'regret' },
        ],
        order_number: 5,
        blocks: [
          textBlock('vsl5', '<h3>Reflexão importante</h3>'),
          questionBlock('vsl5', 'O que acontece se você não resolver isso nos próximos 90 dias?', [
            { text: 'Vou continuar na mesma', value: 'same' },
            { text: 'Posso perder uma oportunidade única', value: 'opportunity' },
            { text: 'Minha situação vai piorar', value: 'worse' },
            { text: 'Vou me arrepender de não ter agido', value: 'regret' },
          ], 'single_choice', 1),
        ],
      },
      // CONTRASTE
      {
        id: 'vsl-6', question_text: 'Se existisse um método comprovado para resolver isso em semanas, você investiria tempo para assistir uma apresentação de 15 minutos?', answer_format: 'single_choice',
        custom_label: '✨ Contraste',
        options: [
          { text: 'Com certeza!', value: 'yes' },
          { text: 'Depende do que vou aprender', value: 'depends' },
          { text: 'Talvez, se for gratuito', value: 'maybe' },
        ],
        order_number: 6,
        blocks: [
          comparisonBlock('vsl6', 0,
            { title: '❌ Sem o método', items: ['Tentativa e erro', 'Meses sem resultado', 'Frustração crescente'] },
            { title: '✅ Com o método', items: ['Passo a passo claro', 'Resultados em semanas', 'Confiança na direção'] }
          ),
          questionBlock('vsl6', 'Se existisse um método comprovado, você investiria 15 minutos para conhecê-lo?', [
            { text: 'Com certeza! 🔥', value: 'yes' },
            { text: 'Depende do que vou aprender', value: 'depends' },
            { text: 'Talvez, se for gratuito', value: 'maybe' },
          ], 'single_choice', 1),
        ],
      },
      // PROVA SOCIAL
      {
        id: 'vsl-7', question_text: 'Qual resultado mais te motivaria?', answer_format: 'single_choice',
        options: [
          { text: 'Resultado financeiro rápido', value: 'money' },
          { text: 'Mais liberdade de tempo', value: 'freedom' },
          { text: 'Reconhecimento e autoridade', value: 'authority' },
          { text: 'Segurança e previsibilidade', value: 'security' },
        ],
        order_number: 7,
        blocks: [
          socialProofBlock('vsl7', 0, [
            { name: 'Marcos S.', text: 'Eu estava cético, mas em 3 semanas já vi resultado.', rating: 5 },
            { name: 'Juliana P.', text: 'Finalmente encontrei algo que funciona de verdade.', rating: 5 },
            { name: 'Roberto L.', text: 'Assistir a apresentação mudou minha visão completamente.', rating: 5 },
          ]),
          separatorBlock('vsl7', 1),
          questionBlock('vsl7', 'Qual resultado mais te motivaria?', [
            { text: 'Resultado financeiro rápido', value: 'money' },
            { text: 'Mais liberdade de tempo', value: 'freedom' },
            { text: 'Reconhecimento e autoridade', value: 'authority' },
            { text: 'Segurança e previsibilidade', value: 'security' },
          ], 'single_choice', 2),
        ],
      },
      // CONCLUSÃO
      {
        id: 'vsl-8', question_text: 'Você está pronto para descobrir como resolver isso de uma vez?', answer_format: 'single_choice',
        custom_label: '🚀 Decisão',
        options: [
          { text: 'Sim, me mostra agora!', value: 'yes' },
          { text: 'Sim, mas quero mais informações', value: 'info' },
        ],
        order_number: 8,
        blocks: [
          textBlock('vsl8', '<h2>🎯 Análise completa!</h2><p>Suas respostas indicam que você tem perfil para alcançar resultados acima da média.</p>'),
          countdownBlock('vsl8', 1, 5, 'Acesso ao conteúdo exclusivo'),
          questionBlock('vsl8', 'Você está pronto para descobrir como resolver isso de uma vez?', [
            { text: 'Sim, me mostra agora! 🔥', value: 'yes' },
            { text: 'Sim, mas quero mais informações primeiro', value: 'info' },
          ], 'single_choice', 2),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: false, collection_timing: 'after' },
    results: [
      {
        result_text: '🎬 Parabéns! Você foi aprovado para assistir a apresentação exclusiva.\n\nBaseado nas suas respostas, o método foi feito para pessoas no seu perfil. Clique abaixo para assistir agora.',
        button_text: 'Assistir apresentação',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// 3) TRÁFEGO PAGO — Qualificação rápida de leads de anúncios
// ══════════════════════════════════════════════════════════════════════
const paidTrafficTemplate: QuizTemplate = {
  id: 'funil-trafego-pago',
  name: '📣 Tráfego Pago — Qualificação Rápida',
  description: 'Quiz de 8 perguntas otimizado para campanhas de tráfego pago: rápido, direto e com alta conversão',
  category: 'lead_qualification',
  icon: '📣',
  preview: {
    title: 'Teste: Você está pronto para [resultado]?',
    description: 'Quiz de qualificação em 90 segundos',
    questionCount: 8,
    template: 'moderno',
  },
  config: {
    title: 'Teste: Você está pronto para escalar seus resultados?',
    description: 'Responda com sinceridade — em 90 segundos você terá sua resposta',
    questionCount: 8,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO (2 perguntas rápidas)
      {
        id: 'pt-1', question_text: 'Qual sua faixa etária?', answer_format: 'single_choice',
        options: [
          { text: '18-25', value: '18-25' }, { text: '26-35', value: '26-35' },
          { text: '36-45', value: '36-45' }, { text: '46+', value: '46+' },
        ],
        order_number: 1,
        blocks: [
          textBlock('pt1', '<h2>Teste rápido de qualificação</h2><p>Apenas 8 perguntas. Sem enrolação.</p>'),
          questionBlock('pt1', 'Qual sua faixa etária?', [
            { text: '18-25', value: '18-25' }, { text: '26-35', value: '26-35' },
            { text: '36-45', value: '36-45' }, { text: '46+', value: '46+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-2', question_text: 'Quanto você investe em tráfego pago por mês?', answer_format: 'single_choice',
        options: [
          { text: 'Ainda não invisto', value: 'zero' },
          { text: 'Até R$ 1.000/mês', value: '<1k' },
          { text: 'R$ 1.000 - R$ 5.000/mês', value: '1-5k' },
          { text: 'Acima de R$ 5.000/mês', value: '5k+' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('pt2', 'Quanto você investe em tráfego pago por mês?', [
            { text: 'Ainda não invisto', value: 'zero' },
            { text: 'Até R$ 1.000/mês', value: '<1k' },
            { text: 'R$ 1.000 - R$ 5.000/mês', value: '1-5k' },
            { text: 'Acima de R$ 5.000/mês', value: '5k+' },
          ]),
        ],
      },
      // DOR
      {
        id: 'pt-3', question_text: 'Qual seu custo por lead hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor',
        options: [
          { text: 'Não sei (esse é o problema)', value: 'unknown' },
          { text: 'Menos de R$ 10', value: '<10' },
          { text: 'R$ 10-30', value: '10-30' },
          { text: 'Mais de R$ 30 (muito caro)', value: '30+' },
        ],
        order_number: 3,
        blocks: [
          textBlock('pt3', '<h3>Vamos falar de números</h3>'),
          questionBlock('pt3', 'Qual seu custo por lead hoje?', [
            { text: 'Não sei (esse é o problema) 😬', value: 'unknown' },
            { text: 'Menos de R$ 10', value: '<10' },
            { text: 'R$ 10-30', value: '10-30' },
            { text: 'Mais de R$ 30 (muito caro)', value: '30+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-4', question_text: 'Desses leads, quantos realmente compram?', answer_format: 'single_choice',
        options: [
          { text: 'Quase nenhum (menos de 1%)', value: '<1' },
          { text: '1-3%', value: '1-3' },
          { text: '3-5%', value: '3-5' },
          { text: 'Mais de 5%', value: '5+' },
        ],
        order_number: 4,
        blocks: [
          questionBlock('pt4', 'Desses leads, quantos realmente compram?', [
            { text: 'Quase nenhum (menos de 1%) 😰', value: '<1' },
            { text: '1-3%', value: '1-3' },
            { text: '3-5%', value: '3-5' },
            { text: 'Mais de 5%', value: '5+' },
          ]),
        ],
      },
      // CONSEQUÊNCIA
      {
        id: 'pt-5', question_text: 'Se você mantiver esse custo por lead, quanto dinheiro vai desperdiçar em 12 meses?', answer_format: 'single_choice',
        custom_label: '⚠️ Custo oculto',
        options: [
          { text: 'Nem quero pensar nisso', value: 'scary' },
          { text: 'Milhares de reais', value: 'thousands' },
          { text: 'Já perdi muito e quero reverter', value: 'revert' },
        ],
        order_number: 5,
        blocks: [
          textBlock('pt5', '<h3>Reflexão de impacto</h3><p>Cada real desperdiçado em tráfego é um real a menos no seu lucro.</p>'),
          questionBlock('pt5', 'Se mantiver esse custo por lead, quanto vai desperdiçar em 12 meses?', [
            { text: 'Nem quero pensar nisso 😱', value: 'scary' },
            { text: 'Milhares de reais', value: 'thousands' },
            { text: 'Já perdi muito e quero reverter', value: 'revert' },
          ], 'single_choice', 1),
        ],
      },
      // CONTRASTE
      {
        id: 'pt-6', question_text: 'Imagine reduzir seu custo por lead pela metade. O que você faria com essa economia?', answer_format: 'single_choice',
        custom_label: '✨ Contraste',
        options: [
          { text: 'Investiria mais em tráfego', value: 'more_traffic' },
          { text: 'Aumentaria meu lucro', value: 'profit' },
          { text: 'Testaria novos produtos/ofertas', value: 'new_offers' },
          { text: 'Tudo isso junto!', value: 'all' },
        ],
        order_number: 6,
        blocks: [
          comparisonBlock('pt6', 0,
            { title: '❌ Hoje', items: ['CPL alto', 'Leads frios', 'Sem qualificação', 'ROI negativo'] },
            { title: '✅ Com qualificação', items: ['CPL 50% menor', 'Leads aquecidos', 'Filtro automático', 'ROI positivo'] }
          ),
          questionBlock('pt6', 'Imagine reduzir seu CPL pela metade. O que faria com a economia?', [
            { text: 'Investiria mais em tráfego', value: 'more_traffic' },
            { text: 'Aumentaria meu lucro', value: 'profit' },
            { text: 'Testaria novos produtos', value: 'new_offers' },
            { text: 'Tudo isso junto! 🚀', value: 'all' },
          ], 'single_choice', 1),
        ],
      },
      // PROVA SOCIAL + URGÊNCIA
      {
        id: 'pt-7', question_text: 'Qual plataforma de anúncios você mais usa?', answer_format: 'single_choice',
        options: [
          { text: 'Facebook / Instagram Ads', value: 'meta' },
          { text: 'Google Ads', value: 'google' },
          { text: 'TikTok Ads', value: 'tiktok' },
          { text: 'Várias plataformas', value: 'multi' },
        ],
        order_number: 7,
        blocks: [
          socialProofBlock('pt7', 0, [
            { name: 'Diego F.', text: 'Reduzi meu CPL de R$25 para R$9 em 2 semanas.', rating: 5 },
            { name: 'Camila R.', text: 'Meus leads agora chegam quentes e prontos para comprar.', rating: 5 },
          ]),
          questionBlock('pt7', 'Qual plataforma de anúncios você mais usa?', [
            { text: 'Facebook / Instagram Ads', value: 'meta' },
            { text: 'Google Ads', value: 'google' },
            { text: 'TikTok Ads', value: 'tiktok' },
            { text: 'Várias plataformas', value: 'multi' },
          ], 'single_choice', 1),
        ],
      },
      // CONCLUSÃO
      {
        id: 'pt-8', question_text: 'Você quer descobrir como qualificar leads automaticamente antes do checkout?', answer_format: 'single_choice',
        custom_label: '🚀 Decisão',
        options: [
          { text: 'Sim, me mostra como!', value: 'yes' },
          { text: 'Sim, quero testar', value: 'test' },
        ],
        order_number: 8,
        blocks: [
          textBlock('pt8', '<h2>🎯 Resultado do teste</h2><p>Suas respostas indicam que você pode otimizar significativamente seus resultados.</p>'),
          countdownBlock('pt8', 1, 5, 'Oferta especial disponível por'),
          questionBlock('pt8', 'Você quer descobrir como qualificar leads automaticamente?', [
            { text: 'Sim, me mostra como! 🔥', value: 'yes' },
            { text: 'Sim, quero testar gratuitamente', value: 'test' },
          ], 'single_choice', 2),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
    results: [
      {
        result_text: '📊 Diagnóstico: Seu tráfego tem potencial de melhoria significativo!\n\nVocê pode reduzir seu custo por lead e aumentar a qualidade dos contatos que chegam ao seu checkout. Veja como abaixo.',
        button_text: 'Ver meu diagnóstico completo',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// 4) VALIDAÇÃO DE OFERTA — Descobre se a oferta resolve uma dor real
// ══════════════════════════════════════════════════════════════════════
const offerValidationTemplate: QuizTemplate = {
  id: 'funil-validacao-oferta',
  name: '🧪 Validação de Oferta — Pesquisa Inteligente',
  description: 'Quiz de 8 perguntas para validar sua oferta antes de investir em tráfego, coletando insights reais',
  category: 'product_discovery',
  icon: '🧪',
  preview: {
    title: 'Pesquisa: O que você realmente precisa?',
    description: 'Nos ajude a criar a solução perfeita',
    questionCount: 8,
    template: 'moderno',
  },
  config: {
    title: 'Pesquisa: O que você realmente precisa?',
    description: 'Suas respostas vão nos ajudar a criar algo feito sob medida para pessoas como você',
    questionCount: 8,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO
      {
        id: 'ov-1', question_text: 'Com qual perfil você mais se identifica?', answer_format: 'single_choice',
        options: [
          { text: 'Empreendedor iniciante', value: 'beginner' },
          { text: 'Profissional em transição', value: 'transition' },
          { text: 'Empresário(a) experiente', value: 'experienced' },
          { text: 'Profissional liberal', value: 'freelancer' },
        ],
        order_number: 1,
        blocks: [
          textBlock('ov1', '<h2>Queremos ouvir você</h2><p>Esta pesquisa vai moldar o que vamos criar. Sua opinião é valiosa.</p>'),
          questionBlock('ov1', 'Com qual perfil você mais se identifica?', [
            { text: 'Empreendedor iniciante', value: 'beginner' },
            { text: 'Profissional em transição', value: 'transition' },
            { text: 'Empresário(a) experiente', value: 'experienced' },
            { text: 'Profissional liberal', value: 'freelancer' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ov-2', question_text: 'Qual área você atua?', answer_format: 'single_choice',
        options: [
          { text: 'Marketing / Vendas', value: 'marketing' },
          { text: 'Saúde / Bem-estar', value: 'health' },
          { text: 'Educação / Infoprodutos', value: 'education' },
          { text: 'Serviços / Consultoria', value: 'services' },
          { text: 'Outro', value: 'other' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('ov2', 'Qual área você atua?', [
            { text: 'Marketing / Vendas', value: 'marketing' },
            { text: 'Saúde / Bem-estar', value: 'health' },
            { text: 'Educação / Infoprodutos', value: 'education' },
            { text: 'Serviços / Consultoria', value: 'services' },
            { text: 'Outro', value: 'other' },
          ]),
        ],
      },
      // DOR
      {
        id: 'ov-3', question_text: 'Qual é o problema que mais te tira o sono hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor real',
        options: [
          { text: 'Não consigo atrair clientes consistentemente', value: 'attract' },
          { text: 'Não sei se minha oferta é boa o suficiente', value: 'offer_doubt' },
          { text: 'Tenho ideia mas não sei validar', value: 'validate' },
          { text: 'Já lancei e não vendeu como esperava', value: 'failed_launch' },
        ],
        order_number: 3,
        blocks: [
          textBlock('ov3', '<h3>Aqui é importante ser sincero(a)</h3>'),
          questionBlock('ov3', 'Qual é o problema que mais te tira o sono hoje?', [
            { text: 'Não consigo atrair clientes consistentemente', value: 'attract' },
            { text: 'Não sei se minha oferta é boa o suficiente', value: 'offer_doubt' },
            { text: 'Tenho ideia mas não sei validar', value: 'validate' },
            { text: 'Já lancei e não vendeu como esperava', value: 'failed_launch' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ov-4', question_text: 'O que você já tentou para resolver?', answer_format: 'multiple_choice',
        options: [
          { text: 'Cursos online', value: 'courses' },
          { text: 'Mentorias', value: 'mentoring' },
          { text: 'Ferramentas/softwares', value: 'tools' },
          { text: 'Nada ainda', value: 'nothing' },
        ],
        order_number: 4,
        blocks: [
          questionBlock('ov4', 'O que você já tentou para resolver?', [
            { text: 'Cursos online', value: 'courses' },
            { text: 'Mentorias', value: 'mentoring' },
            { text: 'Ferramentas/softwares', value: 'tools' },
            { text: 'Nada ainda', value: 'nothing' },
          ], 'multiple_choice'),
        ],
      },
      // CONSEQUÊNCIA
      {
        id: 'ov-5', question_text: 'Se continuar sem resolver, como estará daqui a 1 ano?', answer_format: 'single_choice',
        custom_label: '⚠️ Futuro',
        options: [
          { text: 'Na mesma situação de hoje', value: 'same' },
          { text: 'Provavelmente pior', value: 'worse' },
          { text: 'Terei desistido', value: 'quit' },
          { text: 'Prefiro não pensar nisso', value: 'avoid' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('ov5', 'Se continuar sem resolver, como estará daqui a 1 ano?', [
            { text: 'Na mesma situação de hoje', value: 'same' },
            { text: 'Provavelmente pior', value: 'worse' },
            { text: 'Terei desistido', value: 'quit' },
            { text: 'Prefiro não pensar nisso 😔', value: 'avoid' },
          ]),
        ],
      },
      // CONTRASTE / SOLUÇÃO
      {
        id: 'ov-6', question_text: 'O que mais te ajudaria agora?', answer_format: 'single_choice',
        custom_label: '✨ Solução ideal',
        options: [
          { text: 'Um método passo a passo para validar minha ideia', value: 'method' },
          { text: 'Feedback direto de especialistas', value: 'feedback' },
          { text: 'Dados reais do mercado', value: 'data' },
          { text: 'Uma comunidade de pessoas no mesmo estágio', value: 'community' },
        ],
        order_number: 6,
        blocks: [
          textBlock('ov6', '<h3>Agora a parte boa</h3><p>Queremos criar exatamente o que você precisa.</p>'),
          questionBlock('ov6', 'O que mais te ajudaria agora?', [
            { text: 'Um método passo a passo para validar minha ideia', value: 'method' },
            { text: 'Feedback direto de especialistas', value: 'feedback' },
            { text: 'Dados reais do mercado', value: 'data' },
            { text: 'Uma comunidade de apoio', value: 'community' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ov-7', question_text: 'Quanto você estaria disposto a investir em uma solução que resolvesse isso?', answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 97', value: '97' },
          { text: 'R$ 97 - R$ 297', value: '97-297' },
          { text: 'R$ 297 - R$ 997', value: '297-997' },
          { text: 'O que resolver, eu invisto', value: 'any' },
        ],
        order_number: 7,
        blocks: [
          questionBlock('ov7', 'Quanto investiria em uma solução que resolvesse isso?', [
            { text: 'Até R$ 97', value: '97' },
            { text: 'R$ 97 - R$ 297', value: '97-297' },
            { text: 'R$ 297 - R$ 997', value: '297-997' },
            { text: 'O que resolver, eu invisto', value: 'any' },
          ]),
        ],
      },
      // CONCLUSÃO
      {
        id: 'ov-8', question_text: 'Quer ser avisado em primeira mão quando lançarmos a solução?', answer_format: 'single_choice',
        custom_label: '🚀 Lista VIP',
        options: [
          { text: 'Sim! Quero acesso antecipado', value: 'vip' },
          { text: 'Sim, me avise quando sair', value: 'notify' },
        ],
        order_number: 8,
        blocks: [
          textBlock('ov8', '<h2>✅ Pesquisa completa!</h2><p>Obrigado por participar. Suas respostas vão nos ajudar a criar algo incrível.</p>'),
          questionBlock('ov8', 'Quer ser avisado em primeira mão quando lançarmos?', [
            { text: 'Sim! Quero acesso antecipado 🔥', value: 'vip' },
            { text: 'Sim, me avise quando sair', value: 'notify' },
          ], 'single_choice', 1),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
    results: [
      {
        result_text: '🎉 Obrigado por participar!\n\nSuas respostas foram registradas. Você será avisado em primeira mão quando a solução estiver disponível. Enquanto isso, fique atento ao seu e-mail para conteúdos exclusivos.',
        button_text: 'Garantir meu lugar',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// 5) EDUCACIONAL — Avaliação de conhecimento com engajamento
// ══════════════════════════════════════════════════════════════════════
const educationalTemplate: QuizTemplate = {
  id: 'funil-educacional',
  name: '📚 Avaliação Educacional — Engajamento',
  description: 'Quiz de 8 perguntas para medir conhecimento, engajar alunos e identificar gaps de aprendizado',
  category: 'engagement',
  icon: '📚',
  preview: {
    title: 'Teste seu conhecimento sobre [tema]',
    description: 'Descubra seu nível e receba recomendações',
    questionCount: 8,
    template: 'moderno',
  },
  config: {
    title: 'Teste seu conhecimento sobre o tema',
    description: 'Descubra seu nível atual e receba recomendações personalizadas de estudo',
    questionCount: 8,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO
      {
        id: 'ed-1', question_text: 'Qual seu nível de experiência com o assunto?', answer_format: 'single_choice',
        options: [
          { text: 'Iniciante total — nunca estudei', value: 'beginner' },
          { text: 'Já li/assisti algo sobre', value: 'basic' },
          { text: 'Tenho conhecimento intermediário', value: 'intermediate' },
          { text: 'Considero-me avançado', value: 'advanced' },
        ],
        order_number: 1,
        blocks: [
          textBlock('ed1', '<h2>📝 Avaliação de conhecimento</h2><p>Seja sincero(a) — não existe resposta errada nesta etapa. Queremos calibrar o teste para você.</p>'),
          questionBlock('ed1', 'Qual seu nível de experiência com o assunto?', [
            { text: 'Iniciante total — nunca estudei', value: 'beginner' },
            { text: 'Já li/assisti algo sobre', value: 'basic' },
            { text: 'Tenho conhecimento intermediário', value: 'intermediate' },
            { text: 'Considero-me avançado', value: 'advanced' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-2', question_text: 'Por que você quer aprender sobre isso?', answer_format: 'single_choice',
        options: [
          { text: 'Crescimento profissional / carreira', value: 'career' },
          { text: 'Projeto pessoal / hobby', value: 'personal' },
          { text: 'Obrigação (trabalho/faculdade)', value: 'obligation' },
          { text: 'Curiosidade genuína', value: 'curiosity' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('ed2', 'Por que você quer aprender sobre isso?', [
            { text: 'Crescimento profissional', value: 'career' },
            { text: 'Projeto pessoal', value: 'personal' },
            { text: 'Obrigação (trabalho/faculdade)', value: 'obligation' },
            { text: 'Curiosidade genuína', value: 'curiosity' },
          ]),
        ],
      },
      // DIAGNÓSTICO (DOR adaptada para educação)
      {
        id: 'ed-3', question_text: 'Qual é a maior dificuldade que você enfrenta ao estudar?', answer_format: 'single_choice',
        custom_label: '🔍 Diagnóstico',
        options: [
          { text: 'Não sei por onde começar', value: 'where_start' },
          { text: 'Começo mas não consigo manter consistência', value: 'consistency' },
          { text: 'Estudo mas não consigo aplicar', value: 'apply' },
          { text: 'Conteúdos muito superficiais ou muito complexos', value: 'level' },
        ],
        order_number: 3,
        blocks: [
          textBlock('ed3', '<h3>Identificando seus gaps</h3>'),
          questionBlock('ed3', 'Qual é a maior dificuldade que você enfrenta ao estudar?', [
            { text: 'Não sei por onde começar', value: 'where_start' },
            { text: 'Começo mas não mantenho consistência', value: 'consistency' },
            { text: 'Estudo mas não consigo aplicar', value: 'apply' },
            { text: 'Nível inadequado (muito fácil/difícil)', value: 'level' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-4', question_text: 'Quanto tempo por semana você consegue dedicar ao estudo?', answer_format: 'single_choice',
        options: [
          { text: 'Menos de 1 hora', value: '<1h' },
          { text: '1-3 horas', value: '1-3h' },
          { text: '3-5 horas', value: '3-5h' },
          { text: 'Mais de 5 horas', value: '5h+' },
        ],
        order_number: 4,
        blocks: [
          questionBlock('ed4', 'Quanto tempo por semana você consegue dedicar?', [
            { text: 'Menos de 1 hora', value: '<1h' },
            { text: '1-3 horas', value: '1-3h' },
            { text: '3-5 horas', value: '3-5h' },
            { text: 'Mais de 5 horas', value: '5h+' },
          ]),
        ],
      },
      // CONSEQUÊNCIA (motivação)
      {
        id: 'ed-5', question_text: 'Se você não aprender isso nos próximos meses, o que perde?', answer_format: 'single_choice',
        custom_label: '⚠️ Motivação',
        options: [
          { text: 'Uma promoção ou oportunidade', value: 'promotion' },
          { text: 'Ficarei defasado no mercado', value: 'outdated' },
          { text: 'Não consigo avançar no meu projeto', value: 'stuck' },
          { text: 'Nada urgente, é curiosidade', value: 'nothing' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('ed5', 'Se não aprender isso nos próximos meses, o que perde?', [
            { text: 'Uma promoção ou oportunidade', value: 'promotion' },
            { text: 'Ficarei defasado no mercado', value: 'outdated' },
            { text: 'Não consigo avançar no meu projeto', value: 'stuck' },
            { text: 'Nada urgente, é curiosidade', value: 'nothing' },
          ]),
        ],
      },
      // CONTRASTE
      {
        id: 'ed-6', question_text: 'Qual formato de aprendizado funciona melhor para você?', answer_format: 'single_choice',
        custom_label: '✨ Preferência',
        options: [
          { text: 'Vídeo-aulas curtas (5-15 min)', value: 'video_short' },
          { text: 'Aulas longas e aprofundadas', value: 'video_long' },
          { text: 'Texto / artigos / e-books', value: 'text' },
          { text: 'Prática / exercícios / projetos', value: 'practice' },
        ],
        order_number: 6,
        blocks: [
          textBlock('ed6', '<h3>Quase lá!</h3><p>Vamos personalizar a recomendação para o seu estilo.</p>'),
          questionBlock('ed6', 'Qual formato de aprendizado funciona melhor para você?', [
            { text: 'Vídeo-aulas curtas (5-15 min)', value: 'video_short' },
            { text: 'Aulas longas e aprofundadas', value: 'video_long' },
            { text: 'Texto / artigos / e-books', value: 'text' },
            { text: 'Prática / exercícios / projetos', value: 'practice' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-7', question_text: 'Quais tópicos você gostaria de aprofundar?', answer_format: 'multiple_choice',
        options: [
          { text: 'Fundamentos e conceitos básicos', value: 'fundamentals' },
          { text: 'Técnicas avançadas', value: 'advanced' },
          { text: 'Casos práticos e exemplos reais', value: 'cases' },
          { text: 'Tendências e novidades', value: 'trends' },
        ],
        order_number: 7,
        blocks: [
          questionBlock('ed7', 'Quais tópicos gostaria de aprofundar?', [
            { text: 'Fundamentos e conceitos básicos', value: 'fundamentals' },
            { text: 'Técnicas avançadas', value: 'advanced' },
            { text: 'Casos práticos e exemplos reais', value: 'cases' },
            { text: 'Tendências e novidades', value: 'trends' },
          ], 'multiple_choice'),
        ],
      },
      // CONCLUSÃO
      {
        id: 'ed-8', question_text: 'Quer receber um plano de estudo personalizado com base nas suas respostas?', answer_format: 'single_choice',
        custom_label: '🚀 Resultado',
        options: [
          { text: 'Sim, quero meu plano!', value: 'yes' },
          { text: 'Sim, e quero dicas extras', value: 'yes_extra' },
        ],
        order_number: 8,
        blocks: [
          textBlock('ed8', '<h2>✅ Avaliação concluída!</h2><p>Temos informações suficientes para criar sua trilha personalizada.</p>'),
          progressBlock('ed8', 1, 100, 'Avaliação completa'),
          questionBlock('ed8', 'Quer receber seu plano de estudo personalizado?', [
            { text: 'Sim, quero meu plano! 📚', value: 'yes' },
            { text: 'Sim, e quero dicas extras por e-mail', value: 'yes_extra' },
          ], 'single_choice', 2),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: false, collection_timing: 'after' },
    results: [
      {
        result_text: '📊 Seu diagnóstico está pronto!\n\nCom base nas suas respostas, identificamos seu nível atual e as áreas com maior potencial de desenvolvimento. Acesse seu plano de estudo personalizado clicando abaixo.',
        button_text: 'Ver meu plano de estudo',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO
// ══════════════════════════════════════════════════════════════════════
export const quizTemplates: QuizTemplate[] = [
  leadCaptureTemplate,
  vslConversionTemplate,
  paidTrafficTemplate,
  offerValidationTemplate,
  educationalTemplate,
];
