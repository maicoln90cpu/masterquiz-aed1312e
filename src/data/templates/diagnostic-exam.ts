import { QuizTemplate } from './types';
import { questionBlock, textBlock, socialProofBlock, progressBlock, separatorBlock, imageBlock } from './helpers';

export const diagnosticExamTemplate: QuizTemplate = {
  id: 'funil-avaliacao-diagnostica',
  name: 'Avaliação Diagnóstica — Educacional',
  description: 'Quiz educacional com perguntas de conhecimento real, feedback por etapa e auto-avaliação final. Ideal para cursos, escolas e plataformas de ensino.',
  category: 'engagement',
  icon: '📐',
  preview: {
    title: 'Teste seus conhecimentos',
    description: 'Avaliação diagnóstica com feedback personalizado',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Teste seus conhecimentos — Avaliação Diagnóstica',
    description: 'Descubra seu nível atual e receba recomendações de estudo personalizadas.',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ── FASE 1: Espelhamento — Contexto do aluno (Q1–Q3) ──
      {
        question_text: 'Qual sua área de interesse principal?',
        answer_format: 'single_choice',
        options: [
          { text: 'Marketing Digital', value: 'marketing' },
          { text: 'Programação / Tecnologia', value: 'tech' },
          { text: 'Gestão e Negócios', value: 'business' },
          { text: 'Design e Criatividade', value: 'design' },
          { text: 'Finanças e Investimentos', value: 'finance' },
        ],
        order_number: 1,
        blocks: [
          imageBlock('de-q1', '/templates/diagnostic-assessment.jpg', 'Pessoa concentrada fazendo avaliação online em tablet', 0),
          textBlock('de-q1', '<p>Esta avaliação identifica seu nível atual e recomenda o melhor caminho de estudo.</p>', 1),
          questionBlock('de-q1', 'Qual sua área de interesse principal?', [
            { text: 'Marketing Digital', value: 'marketing' },
            { text: 'Programação / Tecnologia', value: 'tech' },
            { text: 'Gestão e Negócios', value: 'business' },
            { text: 'Design e Criatividade', value: 'design' },
            { text: 'Finanças e Investimentos', value: 'finance' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Como você avalia seu nível de conhecimento nessa área?',
        answer_format: 'single_choice',
        options: [
          { text: 'Iniciante — sei muito pouco', value: 'beginner' },
          { text: 'Básico — conheço o essencial', value: 'basic' },
          { text: 'Intermediário — já pratico', value: 'intermediate' },
          { text: 'Avançado — domino bem', value: 'advanced' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('de-q2', 'Como você avalia seu nível de conhecimento nessa área?', [
            { text: 'Iniciante — sei muito pouco', value: 'beginner' },
            { text: 'Básico — conheço o essencial', value: 'basic' },
            { text: 'Intermediário — já pratico', value: 'intermediate' },
            { text: 'Avançado — domino bem', value: 'advanced' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Com que frequência você estuda ou se atualiza?',
        answer_format: 'single_choice',
        options: [
          { text: 'Diariamente', value: 'daily' },
          { text: 'Algumas vezes por semana', value: 'weekly' },
          { text: 'Quando tenho tempo', value: 'sometimes' },
          { text: 'Raramente', value: 'rarely' },
        ],
        order_number: 3,
        blocks: [
          questionBlock('de-q3', 'Com que frequência você estuda ou se atualiza?', [
            { text: 'Diariamente', value: 'daily' },
            { text: 'Algumas vezes por semana', value: 'weekly' },
            { text: 'Quando tenho tempo', value: 'sometimes' },
            { text: 'Raramente', value: 'rarely' },
          ], 'single_choice', 1),
          progressBlock('de-q3', 2, 25, 'Perfil do aluno mapeado'),
        ],
      },
      // ── FASE 2: Questões de conhecimento (Q4–Q7) ──
      {
        question_text: 'Qual é o conceito de "funil de vendas"?',
        answer_format: 'single_choice',
        options: [
          { text: 'Um processo que guia o cliente da descoberta à compra', value: 'correct' },
          { text: 'Um tipo de anúncio pago', value: 'wrong1' },
          { text: 'Uma ferramenta de e-mail marketing', value: 'wrong2' },
          { text: 'Um método de precificação', value: 'wrong3' },
        ],
        order_number: 4,
        blocks: [
          separatorBlock('de-q4', 0),
          textBlock('de-q4b', '<p><strong>📝 Seção de Conhecimento</strong> — Responda com base no que você sabe hoje.</p>', 1),
          questionBlock('de-q4', 'Qual é o conceito de "funil de vendas"?', [
            { text: 'Um processo que guia o cliente da descoberta à compra', value: 'correct' },
            { text: 'Um tipo de anúncio pago', value: 'wrong1' },
            { text: 'Uma ferramenta de e-mail marketing', value: 'wrong2' },
            { text: 'Um método de precificação', value: 'wrong3' },
          ], 'single_choice', 2),
        ],
      },
      {
        question_text: 'O que significa ROI?',
        answer_format: 'single_choice',
        options: [
          { text: 'Retorno Sobre Investimento', value: 'correct' },
          { text: 'Receita Operacional Interna', value: 'wrong1' },
          { text: 'Resultado de Operações Integradas', value: 'wrong2' },
          { text: 'Relatório de Objetivos Iniciais', value: 'wrong3' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('de-q5', 'O que significa ROI?', [
            { text: 'Retorno Sobre Investimento', value: 'correct' },
            { text: 'Receita Operacional Interna', value: 'wrong1' },
            { text: 'Resultado de Operações Integradas', value: 'wrong2' },
            { text: 'Relatório de Objetivos Iniciais', value: 'wrong3' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Qual dessas é uma métrica de vaidade?',
        answer_format: 'single_choice',
        options: [
          { text: 'Número de curtidas numa publicação', value: 'correct' },
          { text: 'Taxa de conversão', value: 'wrong1' },
          { text: 'Custo por aquisição (CPA)', value: 'wrong2' },
          { text: 'Lifetime Value (LTV)', value: 'wrong3' },
        ],
        order_number: 6,
        blocks: [
          questionBlock('de-q6', 'Qual dessas é uma métrica de vaidade?', [
            { text: 'Número de curtidas numa publicação', value: 'correct' },
            { text: 'Taxa de conversão', value: 'wrong1' },
            { text: 'Custo por aquisição (CPA)', value: 'wrong2' },
            { text: 'Lifetime Value (LTV)', value: 'wrong3' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'O que é "copywriting"?',
        answer_format: 'single_choice',
        options: [
          { text: 'Escrita persuasiva para vendas', value: 'correct' },
          { text: 'Proteção de direitos autorais', value: 'wrong1' },
          { text: 'Cópia de textos de concorrentes', value: 'wrong2' },
          { text: 'Redação jornalística', value: 'wrong3' },
        ],
        order_number: 7,
        blocks: [
          questionBlock('de-q7', 'O que é "copywriting"?', [
            { text: 'Escrita persuasiva para vendas', value: 'correct' },
            { text: 'Proteção de direitos autorais', value: 'wrong1' },
            { text: 'Cópia de textos de concorrentes', value: 'wrong2' },
            { text: 'Redação jornalística', value: 'wrong3' },
          ], 'single_choice', 1),
          progressBlock('de-q7', 2, 60, 'Avaliação em andamento'),
        ],
      },
      // ── FASE 3: Consequência — Gaps identificados (Q8–Q9) ──
      {
        question_text: 'Você sente que falta de conhecimento já te fez perder oportunidades?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, com certeza — várias vezes', value: 'definitely' },
          { text: 'Provavelmente sim', value: 'probably' },
          { text: 'Não tenho certeza', value: 'unsure' },
          { text: 'Não, estou bem preparado(a)', value: 'no' },
        ],
        order_number: 8,
        blocks: [
          separatorBlock('de-q8', 0),
          textBlock('de-q8b', '<p><strong>📊 Reflexão:</strong> Profissionais que se atualizam constantemente ganham em média <strong>40% mais</strong>.</p>', 1),
          questionBlock('de-q8', 'Você sente que falta de conhecimento já te fez perder oportunidades?', [
            { text: 'Sim, com certeza — várias vezes', value: 'definitely' },
            { text: 'Provavelmente sim', value: 'probably' },
            { text: 'Não tenho certeza', value: 'unsure' },
            { text: 'Não, estou bem preparado(a)', value: 'no' },
          ], 'single_choice', 2),
        ],
      },
      {
        question_text: 'Qual seu maior obstáculo para aprender?',
        answer_format: 'single_choice',
        options: [
          { text: 'Falta de tempo', value: 'time' },
          { text: 'Não sei qual conteúdo priorizar', value: 'priority' },
          { text: 'Falta de disciplina', value: 'discipline' },
          { text: 'Cursos muito caros', value: 'cost' },
          { text: 'Conteúdos muito teóricos', value: 'theory' },
        ],
        order_number: 9,
        blocks: [
          questionBlock('de-q9', 'Qual seu maior obstáculo para aprender?', [
            { text: 'Falta de tempo', value: 'time' },
            { text: 'Não sei qual conteúdo priorizar', value: 'priority' },
            { text: 'Falta de disciplina', value: 'discipline' },
            { text: 'Cursos muito caros', value: 'cost' },
            { text: 'Conteúdos muito teóricos', value: 'theory' },
          ], 'single_choice', 1),
        ],
      },
      // ── FASE 4: Contraste (Q10) ──
      {
        question_text: 'Se você pudesse dominar uma habilidade em 30 dias, qual escolheria?',
        answer_format: 'single_choice',
        options: [
          { text: 'Gerar vendas online', value: 'sales' },
          { text: 'Criar conteúdo que converte', value: 'content' },
          { text: 'Gerenciar equipes de alta performance', value: 'management' },
          { text: 'Analisar dados para decisões', value: 'analytics' },
          { text: 'Construir um negócio do zero', value: 'entrepreneurship' },
        ],
        order_number: 10,
        blocks: [
          questionBlock('de-q10', 'Se você pudesse dominar uma habilidade em 30 dias, qual escolheria?', [
            { text: 'Gerar vendas online', value: 'sales' },
            { text: 'Criar conteúdo que converte', value: 'content' },
            { text: 'Gerenciar equipes de alta performance', value: 'management' },
            { text: 'Analisar dados para decisões', value: 'analytics' },
            { text: 'Construir um negócio do zero', value: 'entrepreneurship' },
          ], 'single_choice', 1),
          socialProofBlock('de-q10', 2, [
            { name: 'Lucas R.', text: 'O diagnóstico me mostrou exatamente o que priorizar. Em 2 meses, dobrei meus resultados!', rating: 5 },
            { name: 'Juliana T.', text: 'Descobri que meu nível real era bem diferente do que eu achava.', rating: 5 },
          ]),
        ],
      },
      // ── FASE 5: Conclusão guiada (Q11–Q12) ──
      {
        question_text: 'Você gostaria de receber um plano de estudo personalizado com base nesta avaliação?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, quero muito!', value: 'yes' },
          { text: 'Sim, se for gratuito', value: 'yes_free' },
          { text: 'Talvez mais tarde', value: 'later' },
        ],
        order_number: 11,
        blocks: [
          questionBlock('de-q11', 'Você gostaria de receber um plano de estudo personalizado com base nesta avaliação?', [
            { text: 'Sim, quero muito!', value: 'yes' },
            { text: 'Sim, se for gratuito', value: 'yes_free' },
            { text: 'Talvez mais tarde', value: 'later' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quando você quer começar a se desenvolver de verdade?',
        answer_format: 'single_choice',
        options: [
          { text: 'Agora — não quero perder mais tempo', value: 'now' },
          { text: 'Esta semana', value: 'this_week' },
          { text: 'Este mês', value: 'this_month' },
        ],
        order_number: 12,
        blocks: [
          progressBlock('de-q12', 0, 100, '✅ Avaliação completa!'),
          questionBlock('de-q12', 'Quando você quer começar a se desenvolver de verdade?', [
            { text: 'Agora — não quero perder mais tempo', value: 'now' },
            { text: 'Esta semana', value: 'this_week' },
            { text: 'Este mês', value: 'this_month' },
          ], 'single_choice', 1),
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
        result_text: '📐 Resultado da Avaliação Diagnóstica\n\nIdentificamos seu nível atual e os gaps de conhecimento mais críticos. Receba agora um plano de estudo personalizado para acelerar sua evolução profissional.',
        button_text: 'Receber Meu Plano de Estudo',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
