import type { QuizTemplate } from './types';
import { questionBlock, textBlock, separatorBlock, socialProofBlock, comparisonBlock, countdownBlock, progressBlock, testimonialBlock, imageBlock } from './helpers';

export const offerValidationTemplate: QuizTemplate = {
  id: 'funil-validacao-oferta',
  name: '🧪 Validação de Oferta — Pesquisa Inteligente',
  description: 'Quiz de 12 perguntas para validar sua oferta antes de investir em tráfego, coletando insights reais',
  category: 'product_discovery',
  icon: '🧪',
  preview: {
    title: 'Pesquisa: O que você realmente precisa?',
    description: 'Nos ajude a criar a solução perfeita',
    questionCount: 12,
    template: 'moderno',
  },
  config: {
    title: 'Pesquisa: O que você realmente precisa?',
    description: 'Suas respostas vão nos ajudar a criar algo feito sob medida para pessoas como você',
    questionCount: 12,
    template: 'moderno',
    questions: [
      // ESPELHAMENTO (1-3)
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
          imageBlock('ov1', '/templates/offer-validation-research.jpg', 'Equipe colaborando em sessão de brainstorming e validação', 0),
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
      {
        id: 'ov-3', question_text: 'Qual o público-alvo do seu produto/serviço?', answer_format: 'single_choice',
        options: [
          { text: 'Pessoas físicas (B2C)', value: 'b2c' },
          { text: 'Empresas (B2B)', value: 'b2b' },
          { text: 'Ambos', value: 'both' },
          { text: 'Ainda estou definindo', value: 'undefined' },
        ],
        order_number: 3,
        blocks: [
          textBlock('ov3', '<p>Entender seu público nos ajuda a calibrar as perguntas.</p>'),
          questionBlock('ov3', 'Qual o público-alvo do seu produto/serviço?', [
            { text: 'Pessoas físicas (B2C)', value: 'b2c' },
            { text: 'Empresas (B2B)', value: 'b2b' },
            { text: 'Ambos', value: 'both' },
            { text: 'Ainda estou definindo', value: 'undefined' },
          ], 'single_choice', 1),
        ],
      },
      // DOR (4-6)
      {
        id: 'ov-4', question_text: 'Qual é o problema que mais te tira o sono hoje?', answer_format: 'single_choice',
        custom_label: '🔥 Dor real',
        options: [
          { text: 'Não consigo atrair clientes consistentemente', value: 'attract' },
          { text: 'Não sei se minha oferta é boa o suficiente', value: 'offer_doubt' },
          { text: 'Tenho ideia mas não sei validar', value: 'validate' },
          { text: 'Já lancei e não vendeu como esperava', value: 'failed_launch' },
        ],
        order_number: 4,
        blocks: [
          textBlock('ov4', '<h3>Aqui é importante ser sincero(a)</h3>'),
          questionBlock('ov4', 'Qual é o problema que mais te tira o sono hoje?', [
            { text: 'Não consigo atrair clientes consistentemente', value: 'attract' },
            { text: 'Não sei se minha oferta é boa o suficiente', value: 'offer_doubt' },
            { text: 'Tenho ideia mas não sei validar', value: 'validate' },
            { text: 'Já lancei e não vendeu como esperava', value: 'failed_launch' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ov-5', question_text: 'O que você já tentou para resolver?', answer_format: 'multiple_choice',
        options: [
          { text: 'Cursos online', value: 'courses' },
          { text: 'Mentorias', value: 'mentoring' },
          { text: 'Ferramentas/softwares', value: 'tools' },
          { text: 'Nada ainda', value: 'nothing' },
        ],
        order_number: 5,
        blocks: [
          questionBlock('ov5', 'O que você já tentou para resolver?', [
            { text: 'Cursos online', value: 'courses' },
            { text: 'Mentorias', value: 'mentoring' },
            { text: 'Ferramentas/softwares', value: 'tools' },
            { text: 'Nada ainda', value: 'nothing' },
          ], 'multiple_choice'),
        ],
      },
      {
        id: 'ov-6', question_text: 'Qual o diferencial que você acredita ter sobre concorrentes?', answer_format: 'single_choice',
        custom_label: '💡 Diferencial',
        options: [
          { text: 'Preço mais acessível', value: 'price' },
          { text: 'Qualidade superior', value: 'quality' },
          { text: 'Atendimento personalizado', value: 'service' },
          { text: 'Ainda não tenho um claro', value: 'none' },
        ],
        order_number: 6,
        blocks: [
          questionBlock('ov6', 'Qual o diferencial que você acredita ter sobre concorrentes?', [
            { text: 'Preço mais acessível', value: 'price' },
            { text: 'Qualidade superior', value: 'quality' },
            { text: 'Atendimento personalizado', value: 'service' },
            { text: 'Ainda não tenho um claro', value: 'none' },
          ]),
        ],
      },
      // CONSEQUÊNCIA (7-8)
      {
        id: 'ov-7', question_text: 'Se continuar sem resolver, como estará daqui a 1 ano?', answer_format: 'single_choice',
        custom_label: '⚠️ Futuro',
        options: [
          { text: 'Na mesma situação de hoje', value: 'same' },
          { text: 'Provavelmente pior', value: 'worse' },
          { text: 'Terei desistido', value: 'quit' },
          { text: 'Prefiro não pensar nisso', value: 'avoid' },
        ],
        order_number: 7,
        blocks: [
          questionBlock('ov7', 'Se continuar sem resolver, como estará daqui a 1 ano?', [
            { text: 'Na mesma situação de hoje', value: 'same' },
            { text: 'Provavelmente pior', value: 'worse' },
            { text: 'Terei desistido', value: 'quit' },
            { text: 'Prefiro não pensar nisso 😔', value: 'avoid' },
          ]),
        ],
      },
      {
        id: 'ov-8', question_text: 'Qual canal de venda é mais importante para você?', answer_format: 'single_choice',
        options: [
          { text: 'Instagram / Redes sociais', value: 'social' },
          { text: 'WhatsApp / Direto', value: 'whatsapp' },
          { text: 'Site / Landing page', value: 'website' },
          { text: 'Marketplace (Hotmart, Kiwify...)', value: 'marketplace' },
        ],
        order_number: 8,
        blocks: [
          questionBlock('ov8', 'Qual canal de venda é mais importante para você?', [
            { text: 'Instagram / Redes sociais', value: 'social' },
            { text: 'WhatsApp / Direto', value: 'whatsapp' },
            { text: 'Site / Landing page', value: 'website' },
            { text: 'Marketplace (Hotmart, Kiwify...)', value: 'marketplace' },
          ]),
        ],
      },
      // CONTRASTE (9-10)
      {
        id: 'ov-9', question_text: 'O que mais te ajudaria agora?', answer_format: 'single_choice',
        custom_label: '✨ Solução ideal',
        options: [
          { text: 'Um método passo a passo para validar minha ideia', value: 'method' },
          { text: 'Feedback direto de especialistas', value: 'feedback' },
          { text: 'Dados reais do mercado', value: 'data' },
          { text: 'Uma comunidade de pessoas no mesmo estágio', value: 'community' },
        ],
        order_number: 9,
        blocks: [
          textBlock('ov9', '<h3>Agora a parte boa</h3><p>Queremos criar exatamente o que você precisa.</p>'),
          comparisonBlock('ov9', 1,
            { title: '❌ Lançar sem validar', items: ['Investimento cego', 'Risco alto', 'Sem dados', 'Frustração'] },
            { title: '✅ Validar primeiro', items: ['Investimento inteligente', 'Risco calculado', 'Dados reais', 'Confiança'] }
          ),
          questionBlock('ov9', 'O que mais te ajudaria agora?', [
            { text: 'Um método passo a passo para validar minha ideia', value: 'method' },
            { text: 'Feedback direto de especialistas', value: 'feedback' },
            { text: 'Dados reais do mercado', value: 'data' },
            { text: 'Uma comunidade de apoio', value: 'community' },
          ], 'single_choice', 2),
        ],
      },
      {
        id: 'ov-10', question_text: 'Quanto você estaria disposto a investir em uma solução que resolvesse isso?', answer_format: 'single_choice',
        options: [
          { text: 'Até R$ 97', value: '97' },
          { text: 'R$ 97 - R$ 297', value: '97-297' },
          { text: 'R$ 297 - R$ 997', value: '297-997' },
          { text: 'O que resolver, eu invisto', value: 'any' },
        ],
        order_number: 10,
        blocks: [
          testimonialBlock('ov10', 0, 'Validei minha oferta antes de gastar com tráfego. Economizei R$ 5 mil e lancei com confiança.', 'Rafael M.', 'Infoprodutor', 5),
          questionBlock('ov10', 'Quanto investiria em uma solução que resolvesse isso?', [
            { text: 'Até R$ 97', value: '97' },
            { text: 'R$ 97 - R$ 297', value: '97-297' },
            { text: 'R$ 297 - R$ 997', value: '297-997' },
            { text: 'O que resolver, eu invisto', value: 'any' },
          ], 'single_choice', 1),
        ],
      },
      // CONCLUSÃO (11-12)
      {
        id: 'ov-11', question_text: 'Qual é sua timeline para lançar/melhorar sua oferta?', answer_format: 'single_choice',
        custom_label: '🚀 Timeline',
        options: [
          { text: 'Nas próximas 2 semanas', value: '2weeks' },
          { text: 'Próximo mês', value: '1month' },
          { text: 'Próximos 3 meses', value: '3months' },
          { text: 'Sem prazo definido', value: 'undefined' },
        ],
        order_number: 11,
        blocks: [
          progressBlock('ov11', 0, 90, 'Pesquisa quase completa'),
          questionBlock('ov11', 'Qual é sua timeline para lançar/melhorar sua oferta?', [
            { text: 'Nas próximas 2 semanas', value: '2weeks' },
            { text: 'Próximo mês', value: '1month' },
            { text: 'Próximos 3 meses', value: '3months' },
            { text: 'Sem prazo definido', value: 'undefined' },
          ], 'single_choice', 1),
        ],
      },
      {
        id: 'ov-12', question_text: 'Quer ser avisado em primeira mão quando lançarmos a solução?', answer_format: 'single_choice',
        custom_label: '🚀 Lista VIP',
        options: [
          { text: 'Sim! Quero acesso antecipado', value: 'vip' },
          { text: 'Sim, me avise quando sair', value: 'notify' },
        ],
        order_number: 12,
        blocks: [
          textBlock('ov12', '<h2>✅ Pesquisa completa!</h2><p>Obrigado por participar. Suas respostas vão nos ajudar a criar algo incrível.</p>'),
          countdownBlock('ov12', 1, 5, 'Vagas limitadas para acesso antecipado'),
          questionBlock('ov12', 'Quer ser avisado em primeira mão quando lançarmos?', [
            { text: 'Sim! Quero acesso antecipado 🔥', value: 'vip' },
            { text: 'Sim, me avise quando sair', value: 'notify' },
          ], 'single_choice', 2),
        ],
      },
    ],
    formConfig: { collect_name: true, collect_email: true, collect_whatsapp: true, collection_timing: 'after' },
    results: [
      {
        result_text: '🎉 Obrigado por participar!\n\nSuas respostas foram registradas. Você será avisado em primeira mão quando a solução estiver disponível.',
        button_text: 'Garantir meu lugar',
        condition_type: 'always',
        order_number: 1,
      },
    ],
  },
};
