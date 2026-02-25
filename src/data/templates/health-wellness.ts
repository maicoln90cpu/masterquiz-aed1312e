import { QuizTemplate } from './types';
import { questionBlock, textBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, sliderBlock } from './helpers';

export const healthWellnessTemplate: QuizTemplate = {
  id: 'funil-saude-bem-estar',
  name: 'Saúde & Bem-estar — Funil de Consciência',
  description: 'Quiz de auto-convencimento para área de saúde, nutrição e qualidade de vida. Identifica sintomas, amplifica a dor e apresenta solução guiada.',
  category: 'engagement',
  icon: '🏥',
  preview: {
    title: 'Descubra o que sua saúde está tentando te dizer',
    description: 'Avaliação personalizada de saúde e bem-estar',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Descubra o que sua saúde está tentando te dizer',
    description: 'Responda com sinceridade e receba uma análise personalizada.',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ── FASE 1: Espelhamento (Q1–Q3) ──
      {
        question_text: 'Qual a sua faixa etária?',
        answer_format: 'single_choice',
        options: [
          { text: '18-25 anos', value: '18-25' },
          { text: '26-35 anos', value: '26-35' },
          { text: '36-45 anos', value: '36-45' },
          { text: '46-60 anos', value: '46-60' },
          { text: 'Acima de 60 anos', value: '60+' },
        ],
        order_number: 1,
        blocks: [
          textBlock('hw-q1', '<p>Vamos entender seu momento de vida para personalizar tudo.</p>', 0),
          questionBlock('hw-q1', 'Qual a sua faixa etária?', [
            { text: '18-25 anos', value: '18-25' },
            { text: '26-35 anos', value: '26-35' },
            { text: '36-45 anos', value: '36-45' },
            { text: '46-60 anos', value: '46-60' },
            { text: 'Acima de 60 anos', value: '60+' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Como você descreveria sua rotina diária?',
        answer_format: 'single_choice',
        options: [
          { text: 'Muito sedentária — passo o dia sentado(a)', value: 'sedentary' },
          { text: 'Corrida — mal tenho tempo para comer', value: 'rushed' },
          { text: 'Equilibrada — consigo organizar meu tempo', value: 'balanced' },
          { text: 'Ativa — pratico exercícios regularmente', value: 'active' },
        ],
        order_number: 2,
        blocks: [
          questionBlock('hw-q2', 'Como você descreveria sua rotina diária?', [
            { text: 'Muito sedentária — passo o dia sentado(a)', value: 'sedentary' },
            { text: 'Corrida — mal tenho tempo para comer', value: 'rushed' },
            { text: 'Equilibrada — consigo organizar meu tempo', value: 'balanced' },
            { text: 'Ativa — pratico exercícios regularmente', value: 'active' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Como está a qualidade do seu sono?',
        answer_format: 'single_choice',
        options: [
          { text: 'Durmo bem, 7-8h por noite', value: 'good' },
          { text: 'Regular — acordo cansado(a) às vezes', value: 'fair' },
          { text: 'Ruim — insônia frequente', value: 'poor' },
          { text: 'Péssima — raramente durmo direito', value: 'terrible' },
        ],
        order_number: 3,
        blocks: [
          questionBlock('hw-q3', 'Como está a qualidade do seu sono?', [
            { text: 'Durmo bem, 7-8h por noite', value: 'good' },
            { text: 'Regular — acordo cansado(a) às vezes', value: 'fair' },
            { text: 'Ruim — insônia frequente', value: 'poor' },
            { text: 'Péssima — raramente durmo direito', value: 'terrible' },
          ], 'single_choice', 1),
          progressBlock('hw-q3', 2, 25, 'Perfil mapeado'),
        ],
      },
      // ── FASE 2: Amplificação da dor (Q4–Q6) ──
      {
        question_text: 'Quais sintomas você sente com mais frequência?',
        answer_format: 'multiple_choice',
        options: [
          { text: 'Cansaço constante', value: 'fatigue' },
          { text: 'Dores de cabeça', value: 'headache' },
          { text: 'Problemas digestivos', value: 'digestion' },
          { text: 'Ansiedade / estresse', value: 'anxiety' },
          { text: 'Dores musculares', value: 'muscle_pain' },
          { text: 'Nenhum sintoma frequente', value: 'none' },
        ],
        order_number: 4,
        blocks: [
          textBlock('hw-q4', '<p><strong>⚠️ Atenção:</strong> Esses sintomas podem indicar algo mais sério se ignorados por muito tempo.</p>', 0),
          questionBlock('hw-q4', 'Quais sintomas você sente com mais frequência?', [
            { text: 'Cansaço constante', value: 'fatigue' },
            { text: 'Dores de cabeça', value: 'headache' },
            { text: 'Problemas digestivos', value: 'digestion' },
            { text: 'Ansiedade / estresse', value: 'anxiety' },
            { text: 'Dores musculares', value: 'muscle_pain' },
            { text: 'Nenhum sintoma frequente', value: 'none' },
          ], 'multiple_choice', 1),
        ],
      },
      {
        question_text: 'Há quanto tempo esses sintomas persistem?',
        answer_format: 'single_choice',
        options: [
          { text: 'Menos de 1 mês', value: 'recent' },
          { text: '1-3 meses', value: 'short' },
          { text: '3-6 meses', value: 'medium' },
          { text: 'Mais de 6 meses', value: 'chronic' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('hw-q5', 'Há quanto tempo esses sintomas persistem?', [
            { text: 'Menos de 1 mês', value: 'recent' },
            { text: '1-3 meses', value: 'short' },
            { text: '3-6 meses', value: 'medium' },
            { text: 'Mais de 6 meses', value: 'chronic' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'De 1 a 10, quanto esses problemas impactam sua qualidade de vida?',
        answer_format: 'single_choice',
        options: [
          { text: '1-3 (pouco impacto)', value: 'low' },
          { text: '4-6 (impacto moderado)', value: 'medium' },
          { text: '7-8 (impacto alto)', value: 'high' },
          { text: '9-10 (impacto crítico)', value: 'critical' },
        ],
        order_number: 6,
        blocks: [
          questionBlock('hw-q6', 'De 1 a 10, quanto esses problemas impactam sua qualidade de vida?', [
            { text: '1-3 (pouco impacto)', value: 'low' },
            { text: '4-6 (impacto moderado)', value: 'medium' },
            { text: '7-8 (impacto alto)', value: 'high' },
            { text: '9-10 (impacto crítico)', value: 'critical' },
          ], 'single_choice', 1),
          sliderBlock('hw-q6', 2, 'Nível de impacto na vida', 1, 10, 1, ''),
        ],
      },
      // ── FASE 3: Consequência (Q7–Q8) ──
      {
        question_text: 'Você já teve que cancelar compromissos por causa da saúde?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, frequentemente', value: 'often' },
          { text: 'Sim, algumas vezes', value: 'sometimes' },
          { text: 'Raramente', value: 'rarely' },
          { text: 'Nunca', value: 'never' },
        ],
        order_number: 7,
        blocks: [
          textBlock('hw-q7', '<p>Problemas de saúde ignorados custam <strong>3x mais</strong> quando tratados tarde demais.</p>', 0),
          questionBlock('hw-q7', 'Você já teve que cancelar compromissos por causa da saúde?', [
            { text: 'Sim, frequentemente', value: 'often' },
            { text: 'Sim, algumas vezes', value: 'sometimes' },
            { text: 'Raramente', value: 'rarely' },
            { text: 'Nunca', value: 'never' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Você sente que sua produtividade caiu nos últimos meses?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, muito — mal consigo render', value: 'drastic' },
          { text: 'Sim, um pouco — sinto a diferença', value: 'noticeable' },
          { text: 'Não, continuo produtivo(a)', value: 'no_change' },
        ],
        order_number: 8,
        blocks: [
          questionBlock('hw-q8', 'Você sente que sua produtividade caiu nos últimos meses?', [
            { text: 'Sim, muito — mal consigo render', value: 'drastic' },
            { text: 'Sim, um pouco — sinto a diferença', value: 'noticeable' },
            { text: 'Não, continuo produtivo(a)', value: 'no_change' },
          ], 'single_choice', 1),
          progressBlock('hw-q8', 2, 65, 'Análise em andamento'),
        ],
      },
      // ── FASE 4: Contraste (Q9–Q10) ──
      {
        question_text: 'Imagine acordar todos os dias com energia total. Quanto isso mudaria sua vida?',
        answer_format: 'single_choice',
        options: [
          { text: 'Mudaria tudo — seria outra pessoa', value: 'everything' },
          { text: 'Mudaria muito — mais disposição e foco', value: 'a_lot' },
          { text: 'Mudaria um pouco — ajudaria', value: 'a_little' },
        ],
        order_number: 9,
        blocks: [
          comparisonBlock('hw-q9', 0,
            { title: '😔 Sem cuidar da saúde', items: ['Cansaço crônico', 'Sono ruim', 'Imunidade baixa', 'Humor instável'] },
            { title: '😄 Cuidando da saúde', items: ['Energia o dia todo', 'Sono reparador', 'Sistema imune forte', 'Bem-estar constante'] },
          ),
          questionBlock('hw-q9', 'Imagine acordar todos os dias com energia total. Quanto isso mudaria sua vida?', [
            { text: 'Mudaria tudo — seria outra pessoa', value: 'everything' },
            { text: 'Mudaria muito — mais disposição e foco', value: 'a_lot' },
            { text: 'Mudaria um pouco — ajudaria', value: 'a_little' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'O que te impede de cuidar melhor da saúde hoje?',
        answer_format: 'multiple_choice',
        options: [
          { text: 'Falta de tempo', value: 'time' },
          { text: 'Não sei por onde começar', value: 'knowledge' },
          { text: 'Falta de motivação', value: 'motivation' },
          { text: 'Custo alto', value: 'cost' },
          { text: 'Já tentei e não funcionou', value: 'failed' },
        ],
        order_number: 10,
        blocks: [
          questionBlock('hw-q10', 'O que te impede de cuidar melhor da saúde hoje?', [
            { text: 'Falta de tempo', value: 'time' },
            { text: 'Não sei por onde começar', value: 'knowledge' },
            { text: 'Falta de motivação', value: 'motivation' },
            { text: 'Custo alto', value: 'cost' },
            { text: 'Já tentei e não funcionou', value: 'failed' },
          ], 'multiple_choice', 1),
          socialProofBlock('hw-q10', 2, [
            { name: 'Carla M.', text: 'Em 2 semanas já senti diferença na energia!', rating: 5 },
            { name: 'Roberto S.', text: 'Achei que não tinha tempo, mas o método é prático.', rating: 5 },
          ]),
        ],
      },
      // ── FASE 5: Conclusão guiada (Q11–Q12) ──
      {
        question_text: 'Se existisse um plano personalizado de 21 dias para melhorar sua saúde, você começaria?',
        answer_format: 'single_choice',
        options: [
          { text: 'Sim, quero começar agora!', value: 'yes_now' },
          { text: 'Sim, mas preciso saber mais', value: 'yes_info' },
          { text: 'Talvez, depende do investimento', value: 'maybe' },
        ],
        order_number: 11,
        blocks: [
          questionBlock('hw-q11', 'Se existisse um plano personalizado de 21 dias para melhorar sua saúde, você começaria?', [
            { text: 'Sim, quero começar agora!', value: 'yes_now' },
            { text: 'Sim, mas preciso saber mais', value: 'yes_info' },
            { text: 'Talvez, depende do investimento', value: 'maybe' },
          ], 'single_choice', 1),
        ],
      },
      {
        question_text: 'Quando você gostaria de iniciar sua transformação?',
        answer_format: 'single_choice',
        options: [
          { text: 'Hoje mesmo — não quero esperar mais', value: 'today' },
          { text: 'Esta semana', value: 'this_week' },
          { text: 'Nas próximas 2 semanas', value: 'two_weeks' },
        ],
        order_number: 12,
        blocks: [
          countdownBlock('hw-q12', 0, 10, '⏳ Vagas para avaliação gratuita encerrando'),
          questionBlock('hw-q12', 'Quando você gostaria de iniciar sua transformação?', [
            { text: 'Hoje mesmo — não quero esperar mais', value: 'today' },
            { text: 'Esta semana', value: 'this_week' },
            { text: 'Nas próximas 2 semanas', value: 'two_weeks' },
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
        result_text: '🏥 Sua Avaliação Personalizada está pronta!\n\nIdentificamos pontos de atenção no seu perfil de saúde. Nossos especialistas prepararam um plano de 21 dias sob medida para você começar sua transformação agora.',
        button_text: 'Receber Meu Plano Personalizado',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
