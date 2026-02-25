import type { QuizTemplate } from './types';
import { questionBlock, textBlock, separatorBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock, testimonialBlock } from './helpers';

export const vslConversionTemplate: QuizTemplate = {
  id: 'funil-pre-vsl',
  name: '📈 Pré-VSL — Filtro de Curiosos',
  description: 'Quiz de 12 perguntas que aquece o lead antes da VSL, filtrando curiosos e amplificando desejo',
  category: 'lead_qualification',
  icon: '📈',
  preview: {
    title: 'Descubra se [produto] é para você',
    description: 'Quiz rápido de qualificação pré-VSL',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Descubra se [produto] é realmente para você',
    description: 'Responda com sinceridade — em 3 minutos saberemos se faz sentido para o seu caso',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO (1-3)
      {
        id: 'vsl-1', question_text: 'Qual sua faixa etária?', answer_format: 'single_choice',
        options: [
          { text: '18-25 anos', value: '18-25' }, { text: '26-35 anos', value: '26-35' },
          { text: '36-45 anos', value: '36-45' }, { text: '46+ anos', value: '46+' },
        ],
        order_number: 1,
        blocks: [
          textBlock('vsl1', '<h2>Antes de tudo, vamos te conhecer</h2><p>Isso leva menos de 3 minutos.</p>'),
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
      {
        id: 'vsl-3', question_text: 'Qual área da sua vida você mais quer transformar?', answer_format: 'single_choice',
        options: [
          { text: 'Financeira — quero ganhar mais', value: 'financial' },
          { text: 'Profissional — quero crescer na carreira', value: 'career' },
          { text: 'Pessoal — quero mais qualidade de vida', value: 'personal' },
          { text: 'Todas — quero uma mudança completa', value: 'all' },
        ],
        order_number: 3,
        blocks: [
          textBlock('vsl3', '<p>Saber o que importa para você nos ajuda a calibrar o conteúdo.</p>'),
          questionBlock('vsl3', 'Qual área da sua vida você mais quer transformar?', [
            { text: 'Financeira — quero ganhar mais', value: 'financial' },
            { text: 'Profissional — quero crescer na carreira', value: 'career' },
            { text: 'Pessoal — quero mais qualidade de vida', value: 'personal' },
            { text: 'Todas — quero uma mudança completa', value: 'all' },
          ], 'single_choice', 1),
        ],
      },
      // DOR (4-6)
      {
        id: 'vsl-4', question_text: 'O que mais te incomoda na sua rotina hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor',
        options: [
          { text: 'Falta de tempo para o que importa', value: 'time' },
          { text: 'Resultados abaixo do esperado', value: 'results' },
          { text: 'Não saber por onde começar', value: 'lost' },
          { text: 'Já tentei de tudo e nada funciona', value: 'exhausted' },
        ],
        order_number: 4,
        blocks: [
          textBlock('vsl4', '<h3>Vamos ao que importa</h3><p>Ser honesto aqui faz toda a diferença no resultado.</p>'),
          questionBlock('vsl4', 'O que mais te incomoda na sua rotina hoje?', [
            { text: 'Falta de tempo para o que importa', value: 'time' },
            { text: 'Resultados abaixo do esperado', value: 'results' },
            { text: 'Não saber por onde começar', value: 'lost' },
            { text: 'Já tentei de tudo e nada funciona 😩', value: 'exhausted' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-5', question_text: 'Há quanto tempo você convive com esse problema?', answer_format: 'single_choice',
        options: [
          { text: 'Menos de 3 meses', value: '<3m' }, { text: '3-6 meses', value: '3-6m' },
          { text: '6-12 meses', value: '6-12m' }, { text: 'Mais de 1 ano', value: '1y+' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('vsl5', 'Há quanto tempo você convive com esse problema?', [
            { text: 'Menos de 3 meses', value: '<3m' }, { text: '3-6 meses', value: '3-6m' },
            { text: '6-12 meses', value: '6-12m' }, { text: 'Mais de 1 ano 😰', value: '1y+' },
          ]),
        ],
      },
      {
        id: 'vsl-6', question_text: 'Quanto você estima já ter perdido (tempo ou dinheiro) por não resolver isso?', answer_format: 'single_choice',
        custom_label: '🔥 Custo real',
        options: [
          { text: 'Prefiro não pensar nisso', value: 'avoid' },
          { text: 'Centenas de reais', value: 'hundreds' },
          { text: 'Milhares de reais', value: 'thousands' },
          { text: 'Muito mais do que deveria', value: 'toomuch' },
        ],
        order_number: 6,
        blocks: [
          sliderBlock('vsl6', 0, 'Prejuízo estimado (R$)', 0, 10000, 500, 'R$'),
          questionBlock('vsl6', 'Quanto você estima já ter perdido por não resolver isso?', [
            { text: 'Prefiro não pensar nisso', value: 'avoid' },
            { text: 'Centenas de reais', value: 'hundreds' },
            { text: 'Milhares de reais', value: 'thousands' },
            { text: 'Muito mais do que deveria 😱', value: 'toomuch' },
          ], 'single_choice', 1),
        ],
      },
      // CONSEQUÊNCIA (7-8)
      {
        id: 'vsl-7', question_text: 'O que acontece se você não resolver isso nos próximos 90 dias?', answer_format: 'single_choice',
        custom_label: '⚠️ Consequência',
        options: [
          { text: 'Vou continuar na mesma', value: 'same' },
          { text: 'Posso perder uma oportunidade única', value: 'opportunity' },
          { text: 'Minha situação vai piorar', value: 'worse' },
          { text: 'Vou me arrepender de não ter agido', value: 'regret' },
        ],
        order_number: 7,
        blocks: [
          textBlock('vsl7', '<h3>Reflexão importante</h3>'),
          questionBlock('vsl7', 'O que acontece se você não resolver isso nos próximos 90 dias?', [
            { text: 'Vou continuar na mesma', value: 'same' },
            { text: 'Posso perder uma oportunidade única', value: 'opportunity' },
            { text: 'Minha situação vai piorar', value: 'worse' },
            { text: 'Vou me arrepender de não ter agido', value: 'regret' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-8', question_text: 'Você acredita que existe uma solução viável para o seu caso?', answer_format: 'single_choice',
        options: [
          { text: 'Sim, mas ainda não encontrei', value: 'yes_searching' },
          { text: 'Tenho dúvidas — já me decepcionei', value: 'doubtful' },
          { text: 'Sim, e quero encontrar agora', value: 'yes_ready' },
          { text: 'Honestamente, estou descrente', value: 'skeptic' },
        ],
        order_number: 8,
        blocks: [
          testimonialBlock('vsl8', 0, 'Eu também estava descrente até ver os resultados com meus próprios olhos. Mudou tudo.', 'Patrícia V.', 'Empreendedora', 5),
          questionBlock('vsl8', 'Você acredita que existe uma solução viável para o seu caso?', [
            { text: 'Sim, mas ainda não encontrei', value: 'yes_searching' },
            { text: 'Tenho dúvidas — já me decepcionei', value: 'doubtful' },
            { text: 'Sim, e quero encontrar agora', value: 'yes_ready' },
            { text: 'Honestamente, estou descrente', value: 'skeptic' },
          ], 'single_choice', 1),
        ],
      },
      // CONTRASTE (9-10)
      {
        id: 'vsl-9', question_text: 'Se existisse um método comprovado para resolver isso em semanas, você investiria tempo para assistir uma apresentação de 15 minutos?', answer_format: 'single_choice',
        custom_label: '✨ Contraste',
        options: [
          { text: 'Com certeza!', value: 'yes' },
          { text: 'Depende do que vou aprender', value: 'depends' },
          { text: 'Talvez, se for gratuito', value: 'maybe' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('vsl9', 0,
            { title: '❌ Sem o método', items: ['Tentativa e erro', 'Meses sem resultado', 'Frustração crescente', 'Dinheiro jogado fora'] },
            { title: '✅ Com o método', items: ['Passo a passo claro', 'Resultados em semanas', 'Confiança na direção', 'Investimento que retorna'] }
          ),
          questionBlock('vsl9', 'Se existisse um método comprovado, você investiria 15 minutos para conhecê-lo?', [
            { text: 'Com certeza! 🔥', value: 'yes' },
            { text: 'Depende do que vou aprender', value: 'depends' },
            { text: 'Talvez, se for gratuito', value: 'maybe' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-10', question_text: 'Qual resultado mais te motivaria?', answer_format: 'single_choice',
        options: [
          { text: 'Resultado financeiro rápido', value: 'money' },
          { text: 'Mais liberdade de tempo', value: 'freedom' },
          { text: 'Reconhecimento e autoridade', value: 'authority' },
          { text: 'Segurança e previsibilidade', value: 'security' },
        ],
        order_number: 10,
        blocks: [
          socialProofBlock('vsl10', 0, [
            { name: 'Marcos S.', text: 'Eu estava cético, mas em 3 semanas já vi resultado.', rating: 5 },
            { name: 'Juliana P.', text: 'Finalmente encontrei algo que funciona de verdade.', rating: 5 },
            { name: 'Roberto L.', text: 'Assistir a apresentação mudou minha visão completamente.', rating: 5 },
          ]),
          separatorBlock('vsl10', 1),
          questionBlock('vsl10', 'Qual resultado mais te motivaria?', [
            { text: 'Resultado financeiro rápido', value: 'money' },
            { text: 'Mais liberdade de tempo', value: 'freedom' },
            { text: 'Reconhecimento e autoridade', value: 'authority' },
            { text: 'Segurança e previsibilidade', value: 'security' },
          ], 'single_choice', 2),
        ],
      },
      // CONCLUSÃO (11-12)
      {
        id: 'vsl-11', question_text: 'Em uma escala, quanto você está disposto a se comprometer com a mudança?', answer_format: 'single_choice',
        custom_label: '🚀 Compromisso',
        options: [
          { text: 'Totalmente — estou 100% comprometido(a)', value: 'full' },
          { text: 'Bastante — se o caminho for claro', value: 'high' },
          { text: 'Moderado — quero ver antes de decidir', value: 'moderate' },
          { text: 'Baixo — só estou dando uma olhada', value: 'low' },
        ],
        order_number: 11,
        blocks: [
          progressBlock('vsl11', 0, 90, 'Análise quase completa'),
          questionBlock('vsl11', 'Quanto você está disposto a se comprometer com a mudança?', [
            { text: 'Totalmente — estou 100% comprometido(a)', value: 'full' },
            { text: 'Bastante — se o caminho for claro', value: 'high' },
            { text: 'Moderado — quero ver antes de decidir', value: 'moderate' },
            { text: 'Baixo — só estou dando uma olhada', value: 'low' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'vsl-12', question_text: 'Você está pronto para descobrir como resolver isso de uma vez?', answer_format: 'single_choice',
        custom_label: '🚀 Decisão',
        options: [
          { text: 'Sim, me mostra agora!', value: 'yes' },
          { text: 'Sim, mas quero mais informações', value: 'info' },
        ],
        order_number: 12,
        blocks: [
          textBlock('vsl12', '<h2>🎯 Análise completa!</h2><p>Suas respostas indicam que você tem perfil para alcançar resultados acima da média.</p>'),
          countdownBlock('vsl12', 1, 5, 'Acesso ao conteúdo exclusivo'),
          questionBlock('vsl12', 'Você está pronto para descobrir como resolver isso de uma vez?', [
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
