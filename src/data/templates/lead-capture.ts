import type { QuizTemplate } from './types';
import { questionBlock, textBlock, separatorBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock, testimonialBlock } from './helpers';

export const leadCaptureTemplate: QuizTemplate = {
  id: 'funil-captacao-leads',
  name: '🎯 Captação de Leads — Funil Persuasivo',
  description: 'Quiz de 12 perguntas com funil de auto-convencimento para qualificar e aquecer leads antes do checkout',
  category: 'lead_qualification',
  icon: '🎯',
  preview: {
    title: 'Descubra a solução ideal para o seu negócio',
    description: 'Responda 12 perguntas e receba uma recomendação personalizada',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Descubra a solução ideal para o seu negócio',
    description: 'Em apenas 3 minutos, vamos entender sua situação e indicar o melhor caminho',
    questionCount: 12,
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

      // ── FASE 2: AMPLIFICAÇÃO DA DOR (perguntas 4-6) ──
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
      {
        id: 'lc-6',
        question_text: 'De 0 a 10, qual a urgência de resolver esse problema?',
        custom_label: '🔥 Urgência',
        answer_format: 'single_choice',
        options: [
          { text: '1-3 — Não é urgente, estou pesquisando', value: 'low' },
          { text: '4-6 — Preciso resolver em breve', value: 'medium' },
          { text: '7-8 — É urgente, estou perdendo dinheiro', value: 'high' },
          { text: '9-10 — Crítico, preciso resolver agora', value: 'critical' },
        ],
        order_number: 6,
        blocks: [
          sliderBlock('lc6', 0, 'Nível de urgência', 1, 10, 1, ''),
          separatorBlock('lc6', 1),
          questionBlock('lc6', 'De 0 a 10, qual a urgência de resolver esse problema?', [
            { text: '1-3 — Não é urgente, estou pesquisando', value: 'low' },
            { text: '4-6 — Preciso resolver em breve', value: 'medium' },
            { text: '7-8 — É urgente, estou perdendo dinheiro', value: 'high' },
            { text: '9-10 — Crítico, preciso resolver agora', value: 'critical' },
          ], 'single_choice', 2),
        ],
      },

      // ── FASE 3: CONSEQUÊNCIA (perguntas 7-8) ──
      {
        id: 'lc-7',
        question_text: 'Se nada mudar nos próximos 6 meses, qual seria o impacto?',
        custom_label: '⚠️ Consequência',
        answer_format: 'single_choice',
        options: [
          { text: 'Vou continuar estagnado', value: 'stagnation' },
          { text: 'Vou perder clientes para concorrentes', value: 'competitors' },
          { text: 'Vou ter que demitir / cortar custos', value: 'cuts' },
          { text: 'Posso fechar o negócio', value: 'close' },
        ],
        order_number: 7,
        blocks: [
          textBlock('lc7', '<h3>O custo de não agir</h3><p>Às vezes, o maior risco é manter tudo como está.</p>'),
          questionBlock('lc7', 'Se nada mudar nos próximos 6 meses, qual seria o impacto?', [
            { text: 'Vou continuar estagnado', value: 'stagnation' },
            { text: 'Vou perder clientes para concorrentes', value: 'competitors' },
            { text: 'Vou ter que demitir / cortar custos', value: 'cuts' },
            { text: 'Posso fechar o negócio', value: 'close' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'lc-8',
        question_text: 'Já tentou alguma solução antes e não funcionou?',
        answer_format: 'single_choice',
        options: [
          { text: 'Nunca tentei nada', value: 'never' },
          { text: 'Sim, tentei por conta própria', value: 'diy' },
          { text: 'Sim, contratei mas não tive resultado', value: 'hired_failed' },
          { text: 'Sim, funcionou parcialmente', value: 'partial' },
        ],
        order_number: 8,
        blocks: [
          textBlock('lc8', '<p>Entender tentativas anteriores nos ajuda a evitar os mesmos erros.</p>'),
          questionBlock('lc8', 'Já tentou alguma solução antes e não funcionou?', [
            { text: 'Nunca tentei nada', value: 'never' },
            { text: 'Sim, tentei por conta própria', value: 'diy' },
            { text: 'Sim, contratei mas não tive resultado', value: 'hired_failed' },
            { text: 'Sim, funcionou parcialmente', value: 'partial' },
          ], 'single_choice', 1),
          socialProofBlock('lc8', 2, [
            { name: 'Carlos M.', text: 'Tentei 3 ferramentas antes. Só com essa consegui resultado real.', rating: 5 },
            { name: 'Ana R.', text: 'Em 2 semanas já tinha mais leads que no mês inteiro.', rating: 5 },
          ]),
        ],
      },

      // ── FASE 4: CONTRASTE (perguntas 9-10) ──
      {
        id: 'lc-9',
        question_text: 'Se existisse uma solução que resolvesse esse gargalo automaticamente, quanto você investiria?',
        custom_label: '✨ Contraste',
        answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 100/mês', value: '100' },
          { text: 'R$ 100-300/mês', value: '100-300' },
          { text: 'R$ 300-500/mês', value: '300-500' },
          { text: 'O valor certo para o resultado certo', value: 'roi' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('lc9', 0,
            { title: '❌ Sem solução', items: ['Leads frios', 'Processos manuais', 'Tempo desperdiçado', 'Vendas incertas'] },
            { title: '✅ Com solução', items: ['Leads qualificados', 'Automação total', 'Tempo focado em vender', 'Previsibilidade'] }
          ),
          separatorBlock('lc9', 1),
          questionBlock('lc9', 'Se existisse uma solução que resolvesse esse gargalo automaticamente, quanto você investiria?', [
            { text: 'Até R$ 100/mês', value: '100' },
            { text: 'R$ 100-300/mês', value: '100-300' },
            { text: 'R$ 300-500/mês', value: '300-500' },
            { text: 'O valor certo para o resultado certo', value: 'roi' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'lc-10',
        question_text: 'Quando você quer ver os primeiros resultados?',
        answer_format: 'single_choice',
        options: [
          { text: 'Esta semana!', value: 'week' },
          { text: 'Nos próximos 30 dias', value: '30d' },
          { text: 'Próximos 3 meses', value: '3m' },
          { text: 'Sem pressa, quero fazer direito', value: 'noRush' },
        ],
        order_number: 10,
        blocks: [
          progressBlock('lc10', 0, 80, 'Análise quase completa'),
          questionBlock('lc10', 'Quando você quer ver os primeiros resultados?', [
            { text: 'Esta semana!', value: 'week' },
            { text: 'Nos próximos 30 dias', value: '30d' },
            { text: 'Próximos 3 meses', value: '3m' },
            { text: 'Sem pressa, quero fazer direito', value: 'noRush' },
          ], 'single_choice', 1),
        ],
      },

      // ── FASE 5: CONCLUSÃO GUIADA (perguntas 11-12) ──
      {
        id: 'lc-11',
        question_text: 'O que mais te convenceria a tomar uma decisão agora?',
        custom_label: '🚀 Decisão',
        answer_format: 'single_choice',
        options: [
          { text: 'Ver casos de sucesso reais', value: 'cases' },
          { text: 'Um período de teste gratuito', value: 'trial' },
          { text: 'Falar com alguém que já usa', value: 'referral' },
          { text: 'Já estou convencido(a)', value: 'convinced' },
        ],
        order_number: 11,
        blocks: [
          testimonialBlock('lc11', 0, 'Dobramos nossas vendas em 45 dias usando esse método. Melhor investimento que fizemos.', 'Fernanda L.', 'CEO, Agência Digital', 5),
          separatorBlock('lc11', 1),
          questionBlock('lc11', 'O que mais te convenceria a tomar uma decisão agora?', [
            { text: 'Ver casos de sucesso reais', value: 'cases' },
            { text: 'Um período de teste gratuito', value: 'trial' },
            { text: 'Falar com alguém que já usa', value: 'referral' },
            { text: 'Já estou convencido(a)', value: 'convinced' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'lc-12',
        question_text: 'Se pudéssemos resolver seu maior gargalo com uma solução comprovada, você gostaria de saber como?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, quero saber agora!', value: 'yes_now' },
          { text: 'Sim, mas preciso avaliar antes', value: 'yes_later' },
          { text: 'Talvez, me mostre os resultados', value: 'maybe' },
        ],
        order_number: 12,
        blocks: [
          textBlock('lc12', '<h2>🎯 Última pergunta!</h2><p>Baseado nas suas respostas, já temos uma recomendação personalizada para você.</p>'),
          countdownBlock('lc12', 1, 10, 'Sua análise expira em'),
          separatorBlock('lc12', 2),
          questionBlock('lc12', 'Se pudéssemos resolver seu maior gargalo com uma solução comprovada, você gostaria de saber como?', [
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
