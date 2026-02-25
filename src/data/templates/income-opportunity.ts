import { QuizTemplate } from './types';
import { questionBlock, textBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock } from './helpers';

export const incomeOpportunityTemplate: QuizTemplate = {
  id: 'funil-renda-extra',
  name: 'Renda Extra & Oportunidade',
  description: 'Funil de qualificação para oportunidades financeiras, renda extra e empreendedorismo digital. Identifica frustração, mostra contraste e guia para decisão.',
  category: 'lead_qualification',
  icon: '💰',
  preview: {
    title: 'Descubra sua oportunidade ideal de renda extra',
    description: 'Qualificação para oportunidades financeiras',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Descubra sua oportunidade ideal de renda extra',
    description: 'Responda com sinceridade — seu resultado será 100% personalizado.',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ── FASE 1: Espelhamento (Q1–Q3) ──
      {
        question_text: 'Qual sua situação profissional atual?',
        answer_format: 'single_choice',
        options: [
          { text: 'CLT — empregado(a)', value: 'clt' },
          { text: 'Autônomo / freelancer', value: 'freelancer' },
          { text: 'Empresário(a)', value: 'business' },
          { text: 'Desempregado(a)', value: 'unemployed' },
          { text: 'Estudante', value: 'student' },
        ],
        order_number: 1,
        blocks: [
          textBlock('io-q1', '<p>Vamos entender sua realidade para recomendar a melhor oportunidade.</p>', 0),
          questionBlock('io-q1', 'Qual sua situação profissional atual?', [
            { text: 'CLT — empregado(a)', value: 'clt' },
            { text: 'Autônomo / freelancer', value: 'freelancer' },
            { text: 'Empresário(a)', value: 'business' },
            { text: 'Desempregado(a)', value: 'unemployed' },
            { text: 'Estudante', value: 'student' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Qual sua faixa de renda mensal atual?',
        answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 2.000', value: 'low' },
          { text: 'R$ 2.000 - R$ 5.000', value: 'medium' },
          { text: 'R$ 5.000 - R$ 10.000', value: 'high' },
          { text: 'Acima de R$ 10.000', value: 'very_high' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('io-q2', 'Qual sua faixa de renda mensal atual?', [
            { text: 'Até R$ 2.000', value: 'low' },
            { text: 'R$ 2.000 - R$ 5.000', value: 'medium' },
            { text: 'R$ 5.000 - R$ 10.000', value: 'high' },
            { text: 'Acima de R$ 10.000', value: 'very_high' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quantas horas livres por dia você tem disponíveis?',
        answer_format: 'single_choice',
        options: [
          { text: 'Menos de 1 hora', value: 'none' },
          { text: '1-2 horas', value: 'little' },
          { text: '3-4 horas', value: 'moderate' },
          { text: '5+ horas', value: 'plenty' },
        ],
        order_number: 3,
        blocks: [
          questionBlock('io-q3', 'Quantas horas livres por dia você tem disponíveis?', [
            { text: 'Menos de 1 hora', value: 'none' },
            { text: '1-2 horas', value: 'little' },
            { text: '3-4 horas', value: 'moderate' },
            { text: '5+ horas', value: 'plenty' },
          ], 'single_choice', 1),
          progressBlock('io-q3', 2, 25, 'Perfil mapeado'),
        ],
      },
      // ── FASE 2: Amplificação da dor (Q4–Q6) ──
      {
        question_text: 'O que mais te frustra em relação ao dinheiro hoje?',
        answer_format: 'single_choice',
        options: [
          { text: 'Não sobra nada no fim do mês', value: 'nothing_left' },
          { text: 'Trabalho demais para o que ganho', value: 'overworked' },
          { text: 'Não consigo investir / poupar', value: 'no_savings' },
          { text: 'Dependo de uma única fonte de renda', value: 'single_source' },
          { text: 'Não tenho liberdade para gastar como quero', value: 'no_freedom' },
        ],
        order_number: 4,
        blocks: [
          textBlock('io-q4', '<p><strong>💡 Fato:</strong> 78% dos brasileiros vivem com a sensação de que o salário não acompanha o custo de vida.</p>', 0),
          questionBlock('io-q4', 'O que mais te frustra em relação ao dinheiro hoje?', [
            { text: 'Não sobra nada no fim do mês', value: 'nothing_left' },
            { text: 'Trabalho demais para o que ganho', value: 'overworked' },
            { text: 'Não consigo investir / poupar', value: 'no_savings' },
            { text: 'Dependo de uma única fonte de renda', value: 'single_source' },
            { text: 'Não tenho liberdade para gastar como quero', value: 'no_freedom' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Você já tentou gerar renda extra antes?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, mas não deu certo', value: 'failed' },
          { text: 'Sim, tive algum resultado', value: 'partial' },
          { text: 'Nunca tentei', value: 'never' },
          { text: 'Sim, e funciona, mas quero mais', value: 'want_more' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('io-q5', 'Você já tentou gerar renda extra antes?', [
            { text: 'Sim, mas não deu certo', value: 'failed' },
            { text: 'Sim, tive algum resultado', value: 'partial' },
            { text: 'Nunca tentei', value: 'never' },
            { text: 'Sim, e funciona, mas quero mais', value: 'want_more' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quanto de renda extra por mês faria diferença na sua vida?',
        answer_format: 'single_choice',
        options: [
          { text: 'R$ 500 - R$ 1.000', value: '500' },
          { text: 'R$ 1.000 - R$ 3.000', value: '1000' },
          { text: 'R$ 3.000 - R$ 5.000', value: '3000' },
          { text: 'R$ 5.000 - R$ 10.000', value: '5000' },
          { text: 'Acima de R$ 10.000', value: '10000' },
        ],
        order_number: 6,
        blocks: [
          questionBlock('io-q6', 'Quanto de renda extra por mês faria diferença na sua vida?', [
            { text: 'R$ 500 - R$ 1.000', value: '500' },
            { text: 'R$ 1.000 - R$ 3.000', value: '1000' },
            { text: 'R$ 3.000 - R$ 5.000', value: '3000' },
            { text: 'R$ 5.000 - R$ 10.000', value: '5000' },
            { text: 'Acima de R$ 10.000', value: '10000' },
          ], 'single_choice', 1),
          sliderBlock('io-q6', 2, 'Meta mensal de renda extra (R$)', 500, 10000, 500, 'R$'),
        ],
      },
      // ── FASE 3: Consequência (Q7–Q8) ──
      {
        question_text: 'Se nada mudar nos próximos 12 meses, como você se sentiria?',
        answer_format: 'single_choice',
        options: [
          { text: 'Muito frustrado(a) — não posso continuar assim', value: 'very_frustrated' },
          { text: 'Preocupado(a) — preciso agir logo', value: 'worried' },
          { text: 'Indiferente — dá pra levar', value: 'indifferent' },
        ],
        order_number: 7,
        blocks: [
          textBlock('io-q7', '<p>⏰ Cada mês que passa sem uma segunda fonte de renda é dinheiro que você <strong>deixa na mesa</strong>.</p>', 0),
          questionBlock('io-q7', 'Se nada mudar nos próximos 12 meses, como você se sentiria?', [
            { text: 'Muito frustrado(a) — não posso continuar assim', value: 'very_frustrated' },
            { text: 'Preocupado(a) — preciso agir logo', value: 'worried' },
            { text: 'Indiferente — dá pra levar', value: 'indifferent' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Você já deixou de fazer algo importante por falta de dinheiro?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, frequentemente', value: 'often' },
          { text: 'Sim, algumas vezes', value: 'sometimes' },
          { text: 'Raramente', value: 'rarely' },
          { text: 'Nunca', value: 'never' },
        ],
        order_number: 8,
        blocks: [
          questionBlock('io-q8', 'Você já deixou de fazer algo importante por falta de dinheiro?', [
            { text: 'Sim, frequentemente', value: 'often' },
            { text: 'Sim, algumas vezes', value: 'sometimes' },
            { text: 'Raramente', value: 'rarely' },
            { text: 'Nunca', value: 'never' },
          ], 'single_choice', 1),
          progressBlock('io-q8', 2, 65, 'Análise financeira em andamento'),
        ],
      },
      // ── FASE 4: Contraste (Q9–Q10) ──
      {
        question_text: 'O que você faria se tivesse R$ 5.000 a mais por mês?',
        answer_format: 'multiple_choice',
        options: [
          { text: 'Viajaria mais', value: 'travel' },
          { text: 'Investiria para o futuro', value: 'invest' },
          { text: 'Pagaria dívidas', value: 'debts' },
          { text: 'Daria mais conforto à família', value: 'family' },
          { text: 'Largaria meu emprego atual', value: 'quit' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('io-q9', 0,
            { title: '😓 Sem renda extra', items: ['Sempre no aperto', 'Sem reserva', 'Estresse financeiro', 'Dependência do emprego'] },
            { title: '🤑 Com renda extra', items: ['Tranquilidade financeira', 'Reserva de emergência', 'Liberdade de escolha', 'Múltiplas fontes'] },
          ),
          questionBlock('io-q9', 'O que você faria se tivesse R$ 5.000 a mais por mês?', [
            { text: 'Viajaria mais', value: 'travel' },
            { text: 'Investiria para o futuro', value: 'invest' },
            { text: 'Pagaria dívidas', value: 'debts' },
            { text: 'Daria mais conforto à família', value: 'family' },
            { text: 'Largaria meu emprego atual', value: 'quit' },
          ], 'multiple_choice', 1),
        ],
      },
      {
        question_text: 'Qual modelo de renda extra mais te atrai?',
        answer_format: 'single_choice',
        options: [
          { text: 'Trabalhar online de casa', value: 'online' },
          { text: 'Empreender com produto físico', value: 'physical' },
          { text: 'Vender conhecimento (cursos, mentorias)', value: 'knowledge' },
          { text: 'Marketing digital / afiliados', value: 'affiliate' },
          { text: 'Investimentos passivos', value: 'passive' },
        ],
        order_number: 10,
        blocks: [
          questionBlock('io-q10', 'Qual modelo de renda extra mais te atrai?', [
            { text: 'Trabalhar online de casa', value: 'online' },
            { text: 'Empreender com produto físico', value: 'physical' },
            { text: 'Vender conhecimento (cursos, mentorias)', value: 'knowledge' },
            { text: 'Marketing digital / afiliados', value: 'affiliate' },
            { text: 'Investimentos passivos', value: 'passive' },
          ], 'single_choice', 1),
          socialProofBlock('io-q10', 2, [
            { name: 'Marcos L.', text: 'Comecei com 2h por dia e hoje fatura R$ 8k/mês extra', rating: 5 },
            { name: 'Ana P.', text: 'Saí do zero e em 3 meses paguei todas as dívidas', rating: 5 },
          ]),
        ],
      },
      // ── FASE 5: Conclusão guiada (Q11–Q12) ──
      {
        question_text: 'Quanto você estaria disposto(a) a investir para criar sua fonte de renda extra?',
        answer_format: 'single_choice',
        options: [
          { text: 'Nada — precisa ser gratuito', value: 'free' },
          { text: 'Até R$ 100', value: 'low' },
          { text: 'R$ 100 - R$ 500', value: 'medium' },
          { text: 'R$ 500 - R$ 2.000', value: 'high' },
          { text: 'Acima de R$ 2.000 se valer a pena', value: 'premium' },
        ],
        order_number: 11,
        blocks: [
          questionBlock('io-q11', 'Quanto você estaria disposto(a) a investir para criar sua fonte de renda extra?', [
            { text: 'Nada — precisa ser gratuito', value: 'free' },
            { text: 'Até R$ 100', value: 'low' },
            { text: 'R$ 100 - R$ 500', value: 'medium' },
            { text: 'R$ 500 - R$ 2.000', value: 'high' },
            { text: 'Acima de R$ 2.000 se valer a pena', value: 'premium' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quando você quer começar a mudar sua situação financeira?',
        answer_format: 'single_choice',
        options: [
          { text: 'Agora — já perdi tempo demais', value: 'now' },
          { text: 'Esta semana', value: 'this_week' },
          { text: 'Este mês', value: 'this_month' },
        ],
        order_number: 12,
        blocks: [
          countdownBlock('io-q12', 0, 15, '🔥 Vagas limitadas para mentoria gratuita'),
          questionBlock('io-q12', 'Quando você quer começar a mudar sua situação financeira?', [
            { text: 'Agora — já perdi tempo demais', value: 'now' },
            { text: 'Esta semana', value: 'this_week' },
            { text: 'Este mês', value: 'this_month' },
          ], 'single_choice', 1),
        ],
      },
    ],
    formConfig: {
      collect_name: true,
      collect_email: true,
      collect_whatsapp: true,
      collection_timing: 'after',
    },
    results: [
      {
        result_text: '💰 Oportunidade Identificada!\n\nCom base no seu perfil, encontramos o modelo ideal de renda extra para você. Nossos mentores prepararam um plano personalizado para você começar ainda esta semana.',
        button_text: 'Ver Minha Oportunidade',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
