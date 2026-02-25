import { QuizTemplate } from './types';
import { questionBlock, textBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock } from './helpers';

export const courseOnboardingTemplate: QuizTemplate = {
  id: 'funil-onboarding-curso',
  name: 'Onboarding de Curso — Nivelamento',
  description: 'Quiz educacional para nivelamento de alunos. Identifica experiência prévia, estilo de aprendizado e expectativas para personalizar a jornada do curso.',
  category: 'engagement',
  icon: '🎓',
  preview: {
    title: 'Prepare-se para sua jornada de aprendizado',
    description: 'Nivelamento personalizado para sua experiência',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Prepare-se para sua jornada de aprendizado',
    description: 'Este quiz rápido vai personalizar seu curso para aproveitar ao máximo cada aula.',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ── FASE 1: Espelhamento — Perfil do aluno (Q1–Q3) ──
      {
        question_text: 'Qual seu nível de experiência na área do curso?',
        answer_format: 'single_choice',
        options: [
          { text: 'Zero — nunca estudei sobre isso', value: 'zero' },
          { text: 'Iniciante — vi alguns conteúdos', value: 'beginner' },
          { text: 'Intermediário — já aplico na prática', value: 'intermediate' },
          { text: 'Avançado — busco especialização', value: 'advanced' },
        ],
        order_number: 1,
        blocks: [
          textBlock('co-q1', '<p>🎯 Suas respostas vão personalizar toda a experiência do curso para você.</p>', 0),
          questionBlock('co-q1', 'Qual seu nível de experiência na área do curso?', [
            { text: 'Zero — nunca estudei sobre isso', value: 'zero' },
            { text: 'Iniciante — vi alguns conteúdos', value: 'beginner' },
            { text: 'Intermediário — já aplico na prática', value: 'intermediate' },
            { text: 'Avançado — busco especialização', value: 'advanced' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Como você prefere aprender?',
        answer_format: 'single_choice',
        options: [
          { text: 'Vídeo-aulas — aprendo vendo', value: 'video' },
          { text: 'Leitura — gosto de textos e artigos', value: 'reading' },
          { text: 'Prática — aprendo fazendo', value: 'hands_on' },
          { text: 'Misto — combino tudo', value: 'mixed' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('co-q2', 'Como você prefere aprender?', [
            { text: 'Vídeo-aulas — aprendo vendo', value: 'video' },
            { text: 'Leitura — gosto de textos e artigos', value: 'reading' },
            { text: 'Prática — aprendo fazendo', value: 'hands_on' },
            { text: 'Misto — combino tudo', value: 'mixed' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quantas horas por semana você pode dedicar ao curso?',
        answer_format: 'single_choice',
        options: [
          { text: 'Até 2 horas', value: '2h' },
          { text: '3-5 horas', value: '5h' },
          { text: '6-10 horas', value: '10h' },
          { text: 'Mais de 10 horas', value: '10h+' },
        ],
        order_number: 3,
        blocks: [
          questionBlock('co-q3', 'Quantas horas por semana você pode dedicar ao curso?', [
            { text: 'Até 2 horas', value: '2h' },
            { text: '3-5 horas', value: '5h' },
            { text: '6-10 horas', value: '10h' },
            { text: 'Mais de 10 horas', value: '10h+' },
          ], 'single_choice', 1),
          progressBlock('co-q3', 2, 25, 'Perfil do aluno mapeado'),
        ],
      },
      // ── FASE 2: Amplificação da dor (Q4–Q6) ──
      {
        question_text: 'Qual seu principal objetivo com este curso?',
        answer_format: 'single_choice',
        options: [
          { text: 'Conseguir um emprego / transição de carreira', value: 'career' },
          { text: 'Aumentar minha renda', value: 'income' },
          { text: 'Empreender com mais conhecimento', value: 'entrepreneurship' },
          { text: 'Crescer na empresa atual', value: 'growth' },
          { text: 'Satisfação pessoal / hobby', value: 'personal' },
        ],
        order_number: 4,
        blocks: [
          questionBlock('co-q4', 'Qual seu principal objetivo com este curso?', [
            { text: 'Conseguir um emprego / transição de carreira', value: 'career' },
            { text: 'Aumentar minha renda', value: 'income' },
            { text: 'Empreender com mais conhecimento', value: 'entrepreneurship' },
            { text: 'Crescer na empresa atual', value: 'growth' },
            { text: 'Satisfação pessoal / hobby', value: 'personal' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'O que mais te preocupa sobre fazer este curso?',
        answer_format: 'multiple_choice',
        options: [
          { text: 'Não conseguir acompanhar', value: 'pace' },
          { text: 'Não ter tempo suficiente', value: 'time' },
          { text: 'Não saber se vale o investimento', value: 'value' },
          { text: 'Não conseguir aplicar na prática', value: 'practical' },
          { text: 'Nenhuma preocupação', value: 'none' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('co-q5', 'O que mais te preocupa sobre fazer este curso?', [
            { text: 'Não conseguir acompanhar', value: 'pace' },
            { text: 'Não ter tempo suficiente', value: 'time' },
            { text: 'Não saber se vale o investimento', value: 'value' },
            { text: 'Não conseguir aplicar na prática', value: 'practical' },
            { text: 'Nenhuma preocupação', value: 'none' },
          ], 'multiple_choice', 1),
        ],
      },
      {
        question_text: 'Você já começou outros cursos e não terminou?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, vários — é um padrão meu', value: 'pattern' },
          { text: 'Sim, um ou dois', value: 'few' },
          { text: 'Não, sempre termino o que começo', value: 'always_finish' },
          { text: 'Este é meu primeiro curso', value: 'first' },
        ],
        order_number: 6,
        blocks: [
          textBlock('co-q6', '<p><strong>📊 Dado:</strong> Alunos que fazem o nivelamento têm <strong>3x mais chances</strong> de concluir o curso.</p>', 0),
          questionBlock('co-q6', 'Você já começou outros cursos e não terminou?', [
            { text: 'Sim, vários — é um padrão meu', value: 'pattern' },
            { text: 'Sim, um ou dois', value: 'few' },
            { text: 'Não, sempre termino o que começo', value: 'always_finish' },
            { text: 'Este é meu primeiro curso', value: 'first' },
          ], 'single_choice', 1),
        ],
      },
      // ── FASE 3: Consequência (Q7–Q8) ──
      {
        question_text: 'O que acontece se você não desenvolver essa habilidade nos próximos 6 meses?',
        answer_format: 'single_choice',
        options: [
          { text: 'Fico estagnado(a) profissionalmente', value: 'stagnant' },
          { text: 'Perco oportunidades de mercado', value: 'opportunities' },
          { text: 'Continuo insatisfeito(a) onde estou', value: 'unsatisfied' },
          { text: 'Não muda muito — é mais um extra', value: 'no_change' },
        ],
        order_number: 7,
        blocks: [
          questionBlock('co-q7', 'O que acontece se você não desenvolver essa habilidade nos próximos 6 meses?', [
            { text: 'Fico estagnado(a) profissionalmente', value: 'stagnant' },
            { text: 'Perco oportunidades de mercado', value: 'opportunities' },
            { text: 'Continuo insatisfeito(a) onde estou', value: 'unsatisfied' },
            { text: 'Não muda muito — é mais um extra', value: 'no_change' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Você conhece alguém que se destacou profissionalmente por dominar essa habilidade?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim — e isso me motiva muito', value: 'yes_motivated' },
          { text: 'Sim — mas acho que comigo é diferente', value: 'yes_skeptical' },
          { text: 'Não conheço ninguém', value: 'no' },
        ],
        order_number: 8,
        blocks: [
          questionBlock('co-q8', 'Você conhece alguém que se destacou profissionalmente por dominar essa habilidade?', [
            { text: 'Sim — e isso me motiva muito', value: 'yes_motivated' },
            { text: 'Sim — mas acho que comigo é diferente', value: 'yes_skeptical' },
            { text: 'Não conheço ninguém', value: 'no' },
          ], 'single_choice', 1),
          progressBlock('co-q8', 2, 65, 'Nivelamento em andamento'),
        ],
      },
      // ── FASE 4: Contraste (Q9–Q10) ──
      {
        question_text: 'Qual cenário te atrai mais?',
        answer_format: 'single_choice',
        options: [
          { text: 'Dominar a habilidade e ser referência na área', value: 'master' },
          { text: 'Ter uma base sólida para aplicar no dia a dia', value: 'solid_base' },
          { text: 'Aprender o mínimo necessário', value: 'minimum' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('co-q9', 0,
            { title: '📚 Aprendizado por conta', items: ['Conteúdo fragmentado', 'Sem direção clara', 'Demora anos', 'Muitas tentativas e erros'] },
            { title: '🎯 Aprendizado guiado', items: ['Trilha estruturada', 'Mentoria direta', 'Resultado em semanas', 'Prática supervisionada'] },
          ),
          questionBlock('co-q9', 'Qual cenário te atrai mais?', [
            { text: 'Dominar a habilidade e ser referência na área', value: 'master' },
            { text: 'Ter uma base sólida para aplicar no dia a dia', value: 'solid_base' },
            { text: 'Aprender o mínimo necessário', value: 'minimum' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'O que mais te motivaria a concluir o curso?',
        answer_format: 'single_choice',
        options: [
          { text: 'Certificado reconhecido', value: 'certificate' },
          { text: 'Comunidade de alunos para networking', value: 'community' },
          { text: 'Projeto prático no portfólio', value: 'portfolio' },
          { text: 'Suporte direto do instrutor', value: 'support' },
        ],
        order_number: 10,
        blocks: [
          questionBlock('co-q10', 'O que mais te motivaria a concluir o curso?', [
            { text: 'Certificado reconhecido', value: 'certificate' },
            { text: 'Comunidade de alunos para networking', value: 'community' },
            { text: 'Projeto prático no portfólio', value: 'portfolio' },
            { text: 'Suporte direto do instrutor', value: 'support' },
          ], 'single_choice', 1),
          socialProofBlock('co-q10', 2, [
            { name: 'Pedro A.', text: 'Terminei o curso em 4 semanas e já consegui minha primeira vaga!', rating: 5 },
            { name: 'Fernanda C.', text: 'A mentoria fez toda a diferença. Nunca tinha terminado um curso antes.', rating: 5 },
          ]),
        ],
      },
      // ── FASE 5: Conclusão guiada (Q11–Q12) ──
      {
        question_text: 'Qual nível de compromisso você assume com este curso?',
        answer_format: 'single_choice',
        options: [
          { text: 'Total — vou me dedicar ao máximo', value: 'total' },
          { text: 'Alto — vou fazer o possível', value: 'high' },
          { text: 'Moderado — vou tentar encaixar na rotina', value: 'moderate' },
        ],
        order_number: 11,
        blocks: [
          questionBlock('co-q11', 'Qual nível de compromisso você assume com este curso?', [
            { text: 'Total — vou me dedicar ao máximo', value: 'total' },
            { text: 'Alto — vou fazer o possível', value: 'high' },
            { text: 'Moderado — vou tentar encaixar na rotina', value: 'moderate' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Pronto(a) para começar sua jornada personalizada?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, vamos! 🚀', value: 'yes' },
          { text: 'Sim, mas tenho dúvidas', value: 'yes_doubts' },
          { text: 'Preciso pensar um pouco mais', value: 'thinking' },
        ],
        order_number: 12,
        blocks: [
          countdownBlock('co-q12', 0, 5, '🎓 Turma atual fecha em breve'),
          questionBlock('co-q12', 'Pronto(a) para começar sua jornada personalizada?', [
            { text: 'Sim, vamos! 🚀', value: 'yes' },
            { text: 'Sim, mas tenho dúvidas', value: 'yes_doubts' },
            { text: 'Preciso pensar um pouco mais', value: 'thinking' },
          ], 'single_choice', 1),
          progressBlock('co-q12', 2, 100, '✅ Nivelamento completo!'),
        ],
      },
    ],
    formConfig: {
      collect_name: true,
      collect_email: true,
      collect_whatsapp: false,
      collection_timing: 'after',
    },
    results: [
      {
        result_text: '🎓 Nivelamento Completo!\n\nSua trilha personalizada está pronta. Com base nas suas respostas, preparamos o caminho ideal para você aproveitar cada minuto do curso e alcançar seus objetivos.',
        button_text: 'Acessar Minha Trilha Personalizada',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
