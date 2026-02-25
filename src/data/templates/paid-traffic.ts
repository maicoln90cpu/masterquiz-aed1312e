import type { QuizTemplate } from './types';
import { questionBlock, textBlock, separatorBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock, testimonialBlock } from './helpers';

export const paidTrafficTemplate: QuizTemplate = {
  id: 'funil-trafego-pago',
  name: '📣 Tráfego Pago — Qualificação Rápida',
  description: 'Quiz de 12 perguntas otimizado para campanhas de tráfego pago: direto e com alta conversão',
  category: 'lead_qualification',
  icon: '📣',
  preview: {
    title: 'Teste: Você está pronto para escalar seus resultados?',
    description: 'Quiz de qualificação para tráfego pago',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Teste: Você está pronto para escalar seus resultados?',
    description: 'Responda com sinceridade — em 3 minutos você terá sua resposta',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO (1-3)
      {
        id: 'pt-1', question_text: 'Qual sua faixa etária?', answer_format: 'single_choice',
        options: [
          { text: '18-25', value: '18-25' }, { text: '26-35', value: '26-35' },
          { text: '36-45', value: '36-45' }, { text: '46+', value: '46+' },
        ],
        order_number: 1,
        blocks: [
          textBlock('pt1', '<h2>Teste rápido de qualificação</h2><p>12 perguntas. Sem enrolação.</p>'),
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
      {
        id: 'pt-3', question_text: 'Qual o principal produto/serviço que você vende com tráfego pago?', answer_format: 'single_choice',
        options: [
          { text: 'Infoproduto / Curso online', value: 'infoproduct' },
          { text: 'Serviço / Consultoria', value: 'service' },
          { text: 'Produto físico / E-commerce', value: 'physical' },
          { text: 'SaaS / Software', value: 'saas' },
        ],
        order_number: 3,
        blocks: [
          questionBlock('pt3', 'Qual o principal produto/serviço que você vende?', [
            { text: 'Infoproduto / Curso online', value: 'infoproduct' },
            { text: 'Serviço / Consultoria', value: 'service' },
            { text: 'Produto físico / E-commerce', value: 'physical' },
            { text: 'SaaS / Software', value: 'saas' },
          ]),
        ],
      },
      // DOR (4-6)
      {
        id: 'pt-4', question_text: 'Qual seu custo por lead hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor',
        options: [
          { text: 'Não sei (esse é o problema)', value: 'unknown' },
          { text: 'Menos de R$ 10', value: '<10' },
          { text: 'R$ 10-30', value: '10-30' },
          { text: 'Mais de R$ 30 (muito caro)', value: '30+' },
        ],
        order_number: 4,
        blocks: [
          textBlock('pt4', '<h3>Vamos falar de números</h3>'),
          questionBlock('pt4', 'Qual seu custo por lead hoje?', [
            { text: 'Não sei (esse é o problema) 😬', value: 'unknown' },
            { text: 'Menos de R$ 10', value: '<10' },
            { text: 'R$ 10-30', value: '10-30' },
            { text: 'Mais de R$ 30 (muito caro)', value: '30+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-5', question_text: 'Desses leads, quantos realmente compram?', answer_format: 'single_choice',
        options: [
          { text: 'Quase nenhum (menos de 1%)', value: '<1' },
          { text: '1-3%', value: '1-3' },
          { text: '3-5%', value: '3-5' },
          { text: 'Mais de 5%', value: '5+' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('pt5', 'Desses leads, quantos realmente compram?', [
            { text: 'Quase nenhum (menos de 1%) 😰', value: '<1' },
            { text: '1-3%', value: '1-3' },
            { text: '3-5%', value: '3-5' },
            { text: 'Mais de 5%', value: '5+' },
          ]),
        ],
      },
      {
        id: 'pt-6', question_text: 'Qual seu ROAS (retorno sobre investimento em anúncios)?', answer_format: 'single_choice',
        custom_label: '🔥 Performance',
        options: [
          { text: 'Negativo — gasto mais do que ganho', value: 'negative' },
          { text: 'Empatado — mal pago os custos', value: 'break_even' },
          { text: 'Positivo 2-3x — razoável', value: 'positive' },
          { text: 'Acima de 3x — bom, quero escalar', value: 'great' },
        ],
        order_number: 6,
        blocks: [
          sliderBlock('pt6', 0, 'Seu ROAS atual', 0, 10, 0.5, 'x'),
          questionBlock('pt6', 'Qual seu ROAS (retorno sobre investimento em anúncios)?', [
            { text: 'Negativo — gasto mais do que ganho', value: 'negative' },
            { text: 'Empatado — mal paga os custos', value: 'break_even' },
            { text: 'Positivo 2-3x — razoável', value: 'positive' },
            { text: 'Acima de 3x — bom, quero escalar', value: 'great' },
          ], 'single_choice', 1),
        ],
      },
      // CONSEQUÊNCIA (7-8)
      {
        id: 'pt-7', question_text: 'Se você mantiver esse custo por lead, quanto dinheiro vai desperdiçar em 12 meses?', answer_format: 'single_choice',
        custom_label: '⚠️ Custo oculto',
        options: [
          { text: 'Nem quero pensar nisso', value: 'scary' },
          { text: 'Milhares de reais', value: 'thousands' },
          { text: 'Já perdi muito e quero reverter', value: 'revert' },
        ],
        order_number: 7,
        blocks: [
          textBlock('pt7', '<h3>Reflexão de impacto</h3><p>Cada real desperdiçado em tráfego é um real a menos no seu lucro.</p>'),
          questionBlock('pt7', 'Se mantiver esse custo por lead, quanto vai desperdiçar em 12 meses?', [
            { text: 'Nem quero pensar nisso 😱', value: 'scary' },
            { text: 'Milhares de reais', value: 'thousands' },
            { text: 'Já perdi muito e quero reverter', value: 'revert' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-8', question_text: 'Seus concorrentes já usam quiz para qualificar leads?', answer_format: 'single_choice',
        options: [
          { text: 'Sim, e estão crescendo', value: 'yes_growing' },
          { text: 'Não sei, mas não quero ficar atrás', value: 'dont_know' },
          { text: 'Não, seria minha vantagem competitiva', value: 'no_advantage' },
        ],
        order_number: 8,
        blocks: [
          questionBlock('pt8', 'Seus concorrentes já usam quiz para qualificar leads?', [
            { text: 'Sim, e estão crescendo', value: 'yes_growing' },
            { text: 'Não sei, mas não quero ficar atrás', value: 'dont_know' },
            { text: 'Não, seria minha vantagem competitiva 💡', value: 'no_advantage' },
          ]),
        ],
      },
      // CONTRASTE (9-10)
      {
        id: 'pt-9', question_text: 'Imagine reduzir seu custo por lead pela metade. O que você faria com essa economia?', answer_format: 'single_choice',
        custom_label: '✨ Contraste',
        options: [
          { text: 'Investiria mais em tráfego', value: 'more_traffic' },
          { text: 'Aumentaria meu lucro', value: 'profit' },
          { text: 'Testaria novos produtos/ofertas', value: 'new_offers' },
          { text: 'Tudo isso junto!', value: 'all' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('pt9', 0,
            { title: '❌ Hoje', items: ['CPL alto', 'Leads frios', 'Sem qualificação', 'ROI negativo'] },
            { title: '✅ Com qualificação', items: ['CPL 50% menor', 'Leads aquecidos', 'Filtro automático', 'ROI positivo'] }
          ),
          questionBlock('pt9', 'Imagine reduzir seu CPL pela metade. O que faria com a economia?', [
            { text: 'Investiria mais em tráfego', value: 'more_traffic' },
            { text: 'Aumentaria meu lucro', value: 'profit' },
            { text: 'Testaria novos produtos', value: 'new_offers' },
            { text: 'Tudo isso junto! 🚀', value: 'all' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-10', question_text: 'Qual plataforma de anúncios você mais usa?', answer_format: 'single_choice',
        options: [
          { text: 'Facebook / Instagram Ads', value: 'meta' },
          { text: 'Google Ads', value: 'google' },
          { text: 'TikTok Ads', value: 'tiktok' },
          { text: 'Várias plataformas', value: 'multi' },
        ],
        order_number: 10,
        blocks: [
          socialProofBlock('pt10', 0, [
            { name: 'Diego F.', text: 'Reduzi meu CPL de R$25 para R$9 em 2 semanas.', rating: 5 },
            { name: 'Camila R.', text: 'Meus leads agora chegam quentes e prontos para comprar.', rating: 5 },
          ]),
          questionBlock('pt10', 'Qual plataforma de anúncios você mais usa?', [
            { text: 'Facebook / Instagram Ads', value: 'meta' },
            { text: 'Google Ads', value: 'google' },
            { text: 'TikTok Ads', value: 'tiktok' },
            { text: 'Várias plataformas', value: 'multi' },
          ], 'single_choice', 1),
        ],
      },
      // CONCLUSÃO (11-12)
      {
        id: 'pt-11', question_text: 'Qual meta de faturamento mensal você quer atingir com tráfego pago?', answer_format: 'single_choice',
        custom_label: '🚀 Meta',
        options: [
          { text: 'R$ 5 mil - R$ 10 mil', value: '5-10k' },
          { text: 'R$ 10 mil - R$ 50 mil', value: '10-50k' },
          { text: 'R$ 50 mil - R$ 100 mil', value: '50-100k' },
          { text: 'Acima de R$ 100 mil', value: '100k+' },
        ],
        order_number: 11,
        blocks: [
          progressBlock('pt11', 0, 90, 'Diagnóstico quase pronto'),
          questionBlock('pt11', 'Qual meta de faturamento mensal quer atingir com tráfego pago?', [
            { text: 'R$ 5 mil - R$ 10 mil', value: '5-10k' },
            { text: 'R$ 10 mil - R$ 50 mil', value: '10-50k' },
            { text: 'R$ 50 mil - R$ 100 mil', value: '50-100k' },
            { text: 'Acima de R$ 100 mil 🚀', value: '100k+' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'pt-12', question_text: 'Você quer descobrir como qualificar leads automaticamente antes do checkout?', answer_format: 'single_choice',
        custom_label: '🚀 Decisão',
        options: [
          { text: 'Sim, me mostra como!', value: 'yes' },
          { text: 'Sim, quero testar', value: 'test' },
        ],
        order_number: 12,
        blocks: [
          textBlock('pt12', '<h2>🎯 Resultado do teste</h2><p>Suas respostas indicam que você pode otimizar significativamente seus resultados.</p>'),
          countdownBlock('pt12', 1, 5, 'Oferta especial disponível por'),
          questionBlock('pt12', 'Você quer descobrir como qualificar leads automaticamente?', [
            { text: 'Sim, me mostra como! 🔥', value: 'yes' },
            { text: 'Sim, quero testar gratuitamente', value: 'test' },
          ], 'single_choice', 2),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
    results: [
      {
        result_text: '📊 Diagnóstico: Seu tráfego tem potencial de melhoria significativo!\n\nVocê pode reduzir seu custo por lead e aumentar a qualidade dos contatos. Veja como abaixo.',
        button_text: 'Ver meu diagnóstico completo',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
