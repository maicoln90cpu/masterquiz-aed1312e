import type { QuizTemplate } from './types';
import { questionBlock, textBlock, separatorBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, testimonialBlock } from './helpers';

export const educationalTemplate: QuizTemplate = {
  id: 'funil-educacional',
  name: '📚 Avaliação Educacional — Engajamento',
  description: 'Quiz de 12 perguntas para medir conhecimento, engajar alunos e identificar gaps de aprendizado',
  category: 'engagement',
  icon: '📚',
  preview: {
    title: 'Teste seu conhecimento sobre [tema]',
    description: 'Descubra seu nível e receba recomendações',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Teste seu conhecimento sobre o tema',
    description: 'Descubra seu nível atual e receba recomendações personalizadas de estudo',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO (1-3)
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
          textBlock('ed1', '<h2>📝 Avaliação de conhecimento</h2><p>Seja sincero(a) — não existe resposta errada nesta etapa.</p>'),
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
      {
        id: 'ed-3', question_text: 'Qual método de aprendizado você mais usou até agora?', answer_format: 'single_choice',
        options: [
          { text: 'YouTube / vídeos gratuitos', value: 'youtube' },
          { text: 'Cursos pagos online', value: 'paid_courses' },
          { text: 'Livros / artigos', value: 'reading' },
          { text: 'Mentoria / aulas particulares', value: 'mentoring' },
        ],
        order_number: 3,
        blocks: [
          textBlock('ed3', '<p>Isso nos ajuda a entender como você aprende melhor.</p>'),
          questionBlock('ed3', 'Qual método de aprendizado você mais usou até agora?', [
            { text: 'YouTube / vídeos gratuitos', value: 'youtube' },
            { text: 'Cursos pagos online', value: 'paid_courses' },
            { text: 'Livros / artigos', value: 'reading' },
            { text: 'Mentoria / aulas particulares', value: 'mentoring' },
          ], 'single_choice', 1),
        ],
      },
      // DIAGNÓSTICO / DOR (4-6)
      {
        id: 'ed-4', question_text: 'Qual é a maior dificuldade que você enfrenta ao estudar?', answer_format: 'single_choice',
        custom_label: '🔍 Diagnóstico',
        options: [
          { text: 'Não sei por onde começar', value: 'where_start' },
          { text: 'Começo mas não consigo manter consistência', value: 'consistency' },
          { text: 'Estudo mas não consigo aplicar', value: 'apply' },
          { text: 'Conteúdos muito superficiais ou muito complexos', value: 'level' },
        ],
        order_number: 4,
        blocks: [
          textBlock('ed4', '<h3>Identificando seus gaps</h3>'),
          questionBlock('ed4', 'Qual é a maior dificuldade que você enfrenta ao estudar?', [
            { text: 'Não sei por onde começar', value: 'where_start' },
            { text: 'Começo mas não mantenho consistência', value: 'consistency' },
            { text: 'Estudo mas não consigo aplicar', value: 'apply' },
            { text: 'Nível inadequado (muito fácil/difícil)', value: 'level' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-5', question_text: 'Quanto tempo por semana você consegue dedicar ao estudo?', answer_format: 'single_choice',
        options: [
          { text: 'Menos de 1 hora', value: '<1h' },
          { text: '1-3 horas', value: '1-3h' },
          { text: '3-5 horas', value: '3-5h' },
          { text: 'Mais de 5 horas', value: '5h+' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('ed5', 'Quanto tempo por semana você consegue dedicar?', [
            { text: 'Menos de 1 hora', value: '<1h' },
            { text: '1-3 horas', value: '1-3h' },
            { text: '3-5 horas', value: '3-5h' },
            { text: 'Mais de 5 horas', value: '5h+' },
          ]),
        ],
      },
      {
        id: 'ed-6', question_text: 'Qual é seu maior desafio para manter uma rotina de estudos?', answer_format: 'single_choice',
        custom_label: '🔥 Obstáculos',
        options: [
          { text: 'Falta de disciplina / procrastinação', value: 'discipline' },
          { text: 'Rotina corrida demais', value: 'busy' },
          { text: 'Não vejo resultados rápidos', value: 'no_results' },
          { text: 'Material muito chato / desengajante', value: 'boring' },
        ],
        order_number: 6,
        blocks: [
          questionBlock('ed6', 'Qual é seu maior desafio para manter uma rotina de estudos?', [
            { text: 'Falta de disciplina / procrastinação', value: 'discipline' },
            { text: 'Rotina corrida demais', value: 'busy' },
            { text: 'Não vejo resultados rápidos', value: 'no_results' },
            { text: 'Material muito chato / desengajante', value: 'boring' },
          ]),
        ],
      },
      // CONSEQUÊNCIA / MOTIVAÇÃO (7-8)
      {
        id: 'ed-7', question_text: 'Se você não aprender isso nos próximos meses, o que perde?', answer_format: 'single_choice',
        custom_label: '⚠️ Motivação',
        options: [
          { text: 'Uma promoção ou oportunidade', value: 'promotion' },
          { text: 'Ficarei defasado no mercado', value: 'outdated' },
          { text: 'Não consigo avançar no meu projeto', value: 'stuck' },
          { text: 'Nada urgente, é curiosidade', value: 'nothing' },
        ],
        order_number: 7,
        blocks: [
          comparisonBlock('ed7', 0,
            { title: '❌ Sem aprender', items: ['Estagnação profissional', 'Oportunidades perdidas', 'Gap de conhecimento', 'Insegurança'] },
            { title: '✅ Aprendendo', items: ['Crescimento contínuo', 'Novas oportunidades', 'Confiança técnica', 'Diferencial competitivo'] }
          ),
          questionBlock('ed7', 'Se não aprender isso nos próximos meses, o que perde?', [
            { text: 'Uma promoção ou oportunidade', value: 'promotion' },
            { text: 'Ficarei defasado no mercado', value: 'outdated' },
            { text: 'Não consigo avançar no meu projeto', value: 'stuck' },
            { text: 'Nada urgente, é curiosidade', value: 'nothing' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-8', question_text: 'Você já completou algum curso online do início ao fim?', answer_format: 'single_choice',
        options: [
          { text: 'Sim, vários', value: 'many' },
          { text: 'Sim, um ou dois', value: 'few' },
          { text: 'Comecei mas nunca terminei', value: 'never_finished' },
          { text: 'Nunca fiz um curso online', value: 'never' },
        ],
        order_number: 8,
        blocks: [
          socialProofBlock('ed8', 0, [
            { name: 'Lucas T.', text: 'Pela primeira vez terminei um curso inteiro — o método é viciante!', rating: 5 },
            { name: 'Marina S.', text: 'Aprendi mais em 2 semanas do que em 6 meses sozinha.', rating: 5 },
          ]),
          questionBlock('ed8', 'Você já completou algum curso online do início ao fim?', [
            { text: 'Sim, vários', value: 'many' },
            { text: 'Sim, um ou dois', value: 'few' },
            { text: 'Comecei mas nunca terminei 😅', value: 'never_finished' },
            { text: 'Nunca fiz um curso online', value: 'never' },
          ], 'single_choice', 1),
        ],
      },
      // CONTRASTE / PREFERÊNCIA (9-10)
      {
        id: 'ed-9', question_text: 'Qual formato de aprendizado funciona melhor para você?', answer_format: 'single_choice',
        custom_label: '✨ Preferência',
        options: [
          { text: 'Vídeo-aulas curtas (5-15 min)', value: 'video_short' },
          { text: 'Aulas longas e aprofundadas', value: 'video_long' },
          { text: 'Texto / artigos / e-books', value: 'text' },
          { text: 'Prática / exercícios / projetos', value: 'practice' },
        ],
        order_number: 9,
        blocks: [
          textBlock('ed9', '<h3>Quase lá!</h3><p>Vamos personalizar a recomendação para o seu estilo.</p>'),
          questionBlock('ed9', 'Qual formato de aprendizado funciona melhor para você?', [
            { text: 'Vídeo-aulas curtas (5-15 min)', value: 'video_short' },
            { text: 'Aulas longas e aprofundadas', value: 'video_long' },
            { text: 'Texto / artigos / e-books', value: 'text' },
            { text: 'Prática / exercícios / projetos', value: 'practice' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-10', question_text: 'Quais tópicos você gostaria de aprofundar?', answer_format: 'multiple_choice',
        options: [
          { text: 'Fundamentos e conceitos básicos', value: 'fundamentals' },
          { text: 'Técnicas avançadas', value: 'advanced' },
          { text: 'Casos práticos e exemplos reais', value: 'cases' },
          { text: 'Tendências e novidades', value: 'trends' },
        ],
        order_number: 10,
        blocks: [
          questionBlock('ed10', 'Quais tópicos gostaria de aprofundar?', [
            { text: 'Fundamentos e conceitos básicos', value: 'fundamentals' },
            { text: 'Técnicas avançadas', value: 'advanced' },
            { text: 'Casos práticos e exemplos reais', value: 'cases' },
            { text: 'Tendências e novidades', value: 'trends' },
          ], 'multiple_choice'),
        ],
      },
      // CONCLUSÃO (11-12)
      {
        id: 'ed-11', question_text: 'O que te faria realmente se comprometer com um plano de estudo?', answer_format: 'single_choice',
        custom_label: '🚀 Compromisso',
        options: [
          { text: 'Ter um plano claro e objetivo', value: 'clear_plan' },
          { text: 'Acompanhamento e suporte', value: 'support' },
          { text: 'Certificado ao final', value: 'certificate' },
          { text: 'Comunidade de colegas', value: 'community' },
        ],
        order_number: 11,
        blocks: [
          testimonialBlock('ed11', 0, 'O plano personalizado mudou minha forma de estudar. Finalmente sinto que estou evoluindo de verdade.', 'Amanda K.', 'Estudante', 5),
          questionBlock('ed11', 'O que te faria se comprometer com um plano de estudo?', [
            { text: 'Ter um plano claro e objetivo', value: 'clear_plan' },
            { text: 'Acompanhamento e suporte', value: 'support' },
            { text: 'Certificado ao final', value: 'certificate' },
            { text: 'Comunidade de colegas', value: 'community' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ed-12', question_text: 'Quer receber um plano de estudo personalizado com base nas suas respostas?', answer_format: 'single_choice',
        custom_label: '🚀 Resultado',
        options: [
          { text: 'Sim, quero meu plano!', value: 'yes' },
          { text: 'Sim, e quero dicas extras', value: 'yes_extra' },
        ],
        order_number: 12,
        blocks: [
          textBlock('ed12', '<h2>✅ Avaliação concluída!</h2><p>Temos informações suficientes para criar sua trilha personalizada.</p>'),
          progressBlock('ed12', 1, 100, 'Avaliação completa'),
          questionBlock('ed12', 'Quer receber seu plano de estudo personalizado?', [
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
