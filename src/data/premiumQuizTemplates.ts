import { QuizTemplate } from './quizTemplates';

export const premiumQuizTemplates: QuizTemplate[] = [
  {
    id: 'executivo-corporativo',
    name: 'Executivo Corporativo',
    description: 'Design sóbrio e profissional para empresas B2B',
    category: 'lead_qualification',
    icon: '💼',
    preview: {
      title: 'Avaliação Estratégica Empresarial',
      description: 'Análise corporativa profissional completa',
      questionCount: 10,
      template: 'profissional'
    },
    config: {
      title: 'Avaliação Estratégica Empresarial',
      description: 'Identifique oportunidades de crescimento para sua organização',
      questionCount: 10,
      template: 'profissional',
      questions: [
        {
          question_text: 'Qual o faturamento anual da empresa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 1M', value: 'small' },
            { text: 'R$ 1M - R$ 10M', value: 'medium' },
            { text: 'R$ 10M - R$ 50M', value: 'large' },
            { text: 'Acima de R$ 50M', value: 'enterprise' }
          ],
          order_number: 1
        },
        {
          question_text: 'Quantos colaboradores sua empresa possui?',
          answer_format: 'single_choice',
          options: [
            { text: '1-10 funcionários', value: 'micro' },
            { text: '11-50 funcionários', value: 'small' },
            { text: '51-200 funcionários', value: 'medium' },
            { text: '201-1000 funcionários', value: 'large' },
            { text: 'Mais de 1000', value: 'enterprise' }
          ],
          order_number: 2
        },
        {
          question_text: 'Principais desafios estratégicos?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Transformação Digital', value: 'digital' },
            { text: 'Expansão de Mercado', value: 'expansion' },
            { text: 'Otimização de Custos', value: 'costs' },
            { text: 'Gestão de Talentos', value: 'hr' },
            { text: 'Inovação de Produtos', value: 'innovation' }
          ],
          order_number: 3
        },
        {
          question_text: 'Qual o setor de atuação da empresa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Tecnologia', value: 'tech' },
            { text: 'Indústria', value: 'industry' },
            { text: 'Serviços', value: 'services' },
            { text: 'Comércio', value: 'retail' },
            { text: 'Saúde', value: 'health' },
            { text: 'Educação', value: 'education' }
          ],
          order_number: 4
        },
        {
          question_text: 'Horizonte de planejamento estratégico?',
          answer_format: 'single_choice',
          options: [
            { text: 'Curto prazo (6 meses)', value: 'short' },
            { text: 'Médio prazo (1-2 anos)', value: 'medium' },
            { text: 'Longo prazo (3-5 anos)', value: 'long' },
            { text: 'Visão de longo prazo (5+ anos)', value: 'verylong' }
          ],
          order_number: 5
        },
        {
          question_text: 'Maturidade em governança corporativa?',
          answer_format: 'single_choice',
          options: [
            { text: 'Inicial - Processos ad-hoc', value: 'initial' },
            { text: 'Gerenciada - Alguns processos', value: 'managed' },
            { text: 'Definida - Processos padronizados', value: 'defined' },
            { text: 'Otimizada - Melhoria contínua', value: 'optimized' }
          ],
          order_number: 6
        },
        {
          question_text: 'Nível de digitalização dos processos?',
          answer_format: 'single_choice',
          options: [
            { text: 'Predominantemente manual', value: 'manual' },
            { text: 'Parcialmente digitalizado', value: 'partial' },
            { text: 'Maioria digitalizada', value: 'mostly' },
            { text: 'Totalmente digital', value: 'full' }
          ],
          order_number: 7
        },
        {
          question_text: 'Sua empresa utiliza dados para decisões estratégicas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Raramente ou nunca', value: 'rarely' },
            { text: 'Ocasionalmente', value: 'sometimes' },
            { text: 'Frequentemente', value: 'often' },
            { text: 'Sempre - Data-driven', value: 'always' }
          ],
          order_number: 8
        },
        {
          question_text: 'Possui plano de expansão internacional?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim', value: 'yes' },
            { text: 'Não', value: 'no' }
          ],
          order_number: 9
        },
        {
          question_text: 'Orçamento disponível para consultoria estratégica?',
          answer_format: 'single_choice',
          options: [
            { text: 'Não definido ainda', value: 'undefined' },
            { text: 'Até R$ 50k', value: 'low' },
            { text: 'R$ 50k - R$ 200k', value: 'medium' },
            { text: 'R$ 200k - R$ 500k', value: 'high' },
            { text: 'Acima de R$ 500k', value: 'veryhigh' }
          ],
          order_number: 10
        }
      ],
      formConfig: {
        collect_name: true,
        collect_email: true,
        collect_whatsapp: true,
        collection_timing: 'after'
      },
      results: [
        {
          result_text: '📊 Análise Executiva Completa\n\nIdentificamos oportunidades estratégicas alinhadas aos objetivos da sua organização. Nossa consultoria pode acelerar seu crescimento com soluções customizadas.',
          button_text: 'Solicitar Proposta Executiva',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'luxo-premium',
    name: 'Luxo & Premium',
    description: 'Elegância sofisticada com detalhes em dourado',
    category: 'product_discovery',
    icon: '💎',
    preview: {
      title: 'Descubra sua Experiência Premium',
      description: 'Personalização exclusiva de alto padrão',
      questionCount: 10,
      template: 'profissional'
    },
    config: {
      title: 'Descubra sua Experiência Premium',
      description: 'Encontre a solução perfeita para seu estilo de vida sofisticado',
      questionCount: 10,
      template: 'profissional',
      questions: [
        {
          question_text: 'Qual estilo reflete sua personalidade?',
          answer_format: 'single_choice',
          options: [
            { text: 'Clássico Atemporal', value: 'classic' },
            { text: 'Moderno Sofisticado', value: 'modern' },
            { text: 'Minimalista Luxuoso', value: 'minimal' },
            { text: 'Ousado e Exclusivo', value: 'bold' }
          ],
          order_number: 1
        },
        {
          question_text: 'O que você mais valoriza em uma experiência premium?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Exclusividade absoluta', value: 'exclusivity' },
            { text: 'Personalização completa', value: 'customization' },
            { text: 'Atendimento VIP dedicado', value: 'service' },
            { text: 'Qualidade superior', value: 'quality' },
            { text: 'Tradição e herança', value: 'heritage' }
          ],
          order_number: 2
        },
        {
          question_text: 'Qual ocasião especial você está planejando?',
          answer_format: 'single_choice',
          options: [
            { text: 'Celebração pessoal', value: 'personal' },
            { text: 'Evento corporativo', value: 'corporate' },
            { text: 'Presente exclusivo', value: 'gift' },
            { text: 'Investimento de coleção', value: 'collection' },
            { text: 'Uso cotidiano premium', value: 'daily' }
          ],
          order_number: 3
        },
        {
          question_text: 'Preferência de materiais e acabamentos?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Metais preciosos (ouro, platina)', value: 'precious' },
            { text: 'Pedras naturais raras', value: 'stones' },
            { text: 'Couro italiano artesanal', value: 'leather' },
            { text: 'Tecidos nobres exclusivos', value: 'fabrics' },
            { text: 'Madeiras exóticas', value: 'wood' }
          ],
          order_number: 4
        },
        {
          question_text: 'Preferência de investimento para esta aquisição?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 10.000', value: 'entry' },
            { text: 'R$ 10.000 - R$ 50.000', value: 'premium' },
            { text: 'R$ 50.000 - R$ 150.000', value: 'luxury' },
            { text: 'R$ 150.000 - R$ 500.000', value: 'highlux' },
            { text: 'Acima de R$ 500.000', value: 'exclusive' }
          ],
          order_number: 5
        },
        {
          question_text: 'Importância de marca reconhecida internacionalmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Essencial - só marcas icônicas', value: 'essential' },
            { text: 'Importante - preferência por marcas', value: 'important' },
            { text: 'Moderada - valorizo qualidade acima', value: 'moderate' },
            { text: 'Não relevante - foco em artesania', value: 'notimportant' }
          ],
          order_number: 6
        },
        {
          question_text: 'Você coleciona itens de luxo?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, sou colecionador ativo', value: 'active' },
            { text: 'Ocasionalmente adquiro peças', value: 'occasional' },
            { text: 'Esta seria minha primeira', value: 'first' },
            { text: 'Prefiro experiências a objetos', value: 'experiences' }
          ],
          order_number: 7
        },
        {
          question_text: 'Deseja serviços de concierge personalizado?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, valorizo assistência dedicada', value: 'yes' },
            { text: 'Não necessário', value: 'no' }
          ],
          order_number: 8
        },
        {
          question_text: 'Prefere experiência de compra?',
          answer_format: 'single_choice',
          options: [
            { text: 'Showroom privativo', value: 'private' },
            { text: 'Boutique exclusiva', value: 'boutique' },
            { text: 'Visita personalizada', value: 'visit' },
            { text: 'Online com curadoria', value: 'online' }
          ],
          order_number: 9
        },
        {
          question_text: 'Quando deseja iniciar sua jornada premium?',
          answer_format: 'single_choice',
          options: [
            { text: 'Imediatamente', value: 'now' },
            { text: 'Próximas semanas', value: 'soon' },
            { text: 'Próximo mês', value: 'month' },
            { text: 'Próximos 2-3 meses', value: 'later' }
          ],
          order_number: 10
        }
      ],
      formConfig: {
        collect_name: true,
        collect_email: true,
        collect_whatsapp: true,
        collection_timing: 'after'
      },
      results: [
        {
          result_text: '✨ Experiência Premium Personalizada\n\nRecomendamos nossa coleção exclusiva, cuidadosamente curada para seu perfil sofisticado. Nossos consultores especializados entrarão em contato para apresentar opções sob medida.',
          button_text: 'Acessar Coleção Exclusiva',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'tech-futurista',
    name: 'Tech Futurista',
    description: 'Visual moderno com elementos neon e tecnológicos',
    category: 'engagement',
    icon: '🚀',
    preview: {
      title: 'Quiz Tech do Futuro',
      description: 'Descubra a tecnologia perfeita',
      questionCount: 10,
      template: 'criativo'
    },
    config: {
      title: 'Descubra sua Stack Tecnológica Ideal',
      description: 'Encontre as tecnologias perfeitas para seu projeto',
      questionCount: 10,
      template: 'criativo',
      questions: [
        {
          question_text: 'Tipo de aplicação que deseja desenvolver?',
          answer_format: 'single_choice',
          options: [
            { text: 'Web App Responsivo', value: 'web' },
            { text: 'Mobile App (iOS/Android)', value: 'mobile' },
            { text: 'Desktop Application', value: 'desktop' },
            { text: 'Full Stack Completo', value: 'fullstack' },
            { text: 'Progressive Web App', value: 'pwa' }
          ],
          order_number: 1
        },
        {
          question_text: 'Qual sua prioridade principal?',
          answer_format: 'single_choice',
          options: [
            { text: 'Performance máxima', value: 'performance' },
            { text: 'Escalabilidade infinita', value: 'scalability' },
            { text: 'Segurança robusta', value: 'security' },
            { text: 'Time to Market rápido', value: 'speed' },
            { text: 'Custo de manutenção baixo', value: 'cost' }
          ],
          order_number: 2
        },
        {
          question_text: 'Tamanho da sua equipe de desenvolvimento?',
          answer_format: 'single_choice',
          options: [
            { text: 'Solo developer', value: 'solo' },
            { text: '2-5 desenvolvedores', value: 'small' },
            { text: '6-20 desenvolvedores', value: 'medium' },
            { text: '21-50 desenvolvedores', value: 'large' },
            { text: 'Mais de 50 devs', value: 'enterprise' }
          ],
          order_number: 3
        },
        {
          question_text: 'Experiência da equipe com cloud computing?',
          answer_format: 'single_choice',
          options: [
            { text: 'Iniciante - primeira vez', value: 'beginner' },
            { text: 'Intermediário - alguns projetos', value: 'intermediate' },
            { text: 'Avançado - vários projetos', value: 'advanced' },
            { text: 'Expert - arquitetura cloud nativa', value: 'expert' }
          ],
          order_number: 4
        },
        {
          question_text: 'Necessidade de suporte em tempo real?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, essencial', value: 'yes' },
            { text: 'Não necessário', value: 'no' }
          ],
          order_number: 5
        },
        {
          question_text: 'Modelo de dados esperado?',
          answer_format: 'single_choice',
          options: [
            { text: 'SQL Relacional estruturado', value: 'sql' },
            { text: 'NoSQL Documento flexível', value: 'nosql' },
            { text: 'Graph database relacionamentos', value: 'graph' },
            { text: 'Time-series para IoT', value: 'timeseries' },
            { text: 'Híbrido - múltiplos bancos', value: 'hybrid' }
          ],
          order_number: 6
        },
        {
          question_text: 'Volume de usuários esperado no primeiro ano?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até 1.000 usuários', value: 'small' },
            { text: '1.000 - 10.000 usuários', value: 'medium' },
            { text: '10.000 - 100.000 usuários', value: 'large' },
            { text: '100.000 - 1M usuários', value: 'huge' },
            { text: 'Mais de 1M usuários', value: 'massive' }
          ],
          order_number: 7
        },
        {
          question_text: 'Necessita de inteligência artificial?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Machine Learning', value: 'ml' },
            { text: 'Processamento de linguagem', value: 'nlp' },
            { text: 'Visão computacional', value: 'vision' },
            { text: 'Recomendação personalizada', value: 'recommendation' },
            { text: 'Não necessário', value: 'none' }
          ],
          order_number: 8
        },
        {
          question_text: 'Orçamento mensal para infraestrutura cloud?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até $100/mês', value: 'minimal' },
            { text: '$100 - $500/mês', value: 'low' },
            { text: '$500 - $2000/mês', value: 'medium' },
            { text: '$2000 - $10k/mês', value: 'high' },
            { text: 'Acima de $10k/mês', value: 'enterprise' }
          ],
          order_number: 9
        },
        {
          question_text: 'Deadline para lançamento do MVP?',
          answer_format: 'single_choice',
          options: [
            { text: '1-2 meses', value: 'urgent' },
            { text: '3-4 meses', value: 'soon' },
            { text: '5-6 meses', value: 'moderate' },
            { text: 'Mais de 6 meses', value: 'flexible' }
          ],
          order_number: 10
        }
      ],
      formConfig: {
        collect_name: true,
        collect_email: true,
        collect_whatsapp: false,
        collection_timing: 'after'
      },
      results: [
        {
          result_text: '🚀 Stack Tecnológica Recomendada\n\nBaseado em suas respostas, preparamos a arquitetura ideal e stack de tecnologias para seu projeto. Nossa equipe está pronta para desenvolver sua solução!',
          button_text: 'Ver Arquitetura Completa',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'saude-medico',
    name: 'Saúde & Medicina',
    description: 'Clean e confiável para área da saúde',
    category: 'lead_qualification',
    icon: '🏥',
    preview: {
      title: 'Avaliação de Saúde',
      description: 'Check-up personalizado completo',
      questionCount: 10,
      template: 'minimalista'
    },
    config: {
      title: 'Avaliação de Saúde Personalizada',
      description: 'Responda e receba orientações personalizadas para seu bem-estar',
      questionCount: 10,
      template: 'minimalista',
      questions: [
        {
          question_text: 'Qual sua faixa etária?',
          answer_format: 'single_choice',
          options: [
            { text: '18-30 anos', value: 'young' },
            { text: '31-45 anos', value: 'adult' },
            { text: '46-60 anos', value: 'mature' },
            { text: '61-75 anos', value: 'senior' },
            { text: 'Acima de 75 anos', value: 'elderly' }
          ],
          order_number: 1
        },
        {
          question_text: 'Como você avalia sua saúde geral?',
          answer_format: 'single_choice',
          options: [
            { text: 'Excelente - sem queixas', value: 'excellent' },
            { text: 'Boa - pequenas queixas', value: 'good' },
            { text: 'Regular - alguns problemas', value: 'fair' },
            { text: 'Ruim - problemas frequentes', value: 'poor' }
          ],
          order_number: 2
        },
        {
          question_text: 'Com que frequência pratica atividades físicas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sedentário - não pratico', value: 'sedentary' },
            { text: '1-2 vezes por semana', value: 'light' },
            { text: '3-4 vezes por semana', value: 'moderate' },
            { text: '5-6 vezes por semana', value: 'active' },
            { text: 'Diariamente - atleta', value: 'athlete' }
          ],
          order_number: 3
        },
        {
          question_text: 'Como você descreveria sua alimentação habitual?',
          answer_format: 'single_choice',
          options: [
            { text: 'Fast food frequente', value: 'poor' },
            { text: 'Equilibrada com exceções', value: 'moderate' },
            { text: 'Saudável e balanceada', value: 'good' },
            { text: 'Dieta específica acompanhada', value: 'excellent' },
            { text: 'Vegetariana/Vegana', value: 'plant' }
          ],
          order_number: 4
        },
        {
          question_text: 'Possui histórico familiar de doenças?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Diabetes', value: 'diabetes' },
            { text: 'Hipertensão arterial', value: 'hypertension' },
            { text: 'Problemas cardíacos', value: 'heart' },
            { text: 'Colesterol alto', value: 'cholesterol' },
            { text: 'Câncer', value: 'cancer' },
            { text: 'Nenhum histórico', value: 'none' }
          ],
          order_number: 5
        },
        {
          question_text: 'Qual seu principal objetivo de saúde?',
          answer_format: 'single_choice',
          options: [
            { text: 'Prevenir doenças', value: 'prevention' },
            { text: 'Perder peso', value: 'weight' },
            { text: 'Ganhar massa muscular', value: 'muscle' },
            { text: 'Melhorar saúde mental', value: 'mental' },
            { text: 'Controlar condição existente', value: 'control' },
            { text: 'Melhorar saúde geral', value: 'general' }
          ],
          order_number: 6
        },
        {
          question_text: 'Qualidade do seu sono?',
          answer_format: 'single_choice',
          options: [
            { text: 'Excelente - 7-9h profundo', value: 'excellent' },
            { text: 'Bom - durmo bem geralmente', value: 'good' },
            { text: 'Regular - acordo cansado', value: 'fair' },
            { text: 'Ruim - insônia frequente', value: 'poor' }
          ],
          order_number: 7
        },
        {
          question_text: 'Nível de estresse no dia a dia?',
          answer_format: 'single_choice',
          options: [
            { text: 'Baixo - vida tranquila', value: 'low' },
            { text: 'Moderado - gerenciável', value: 'moderate' },
            { text: 'Alto - constante pressão', value: 'high' },
            { text: 'Muito alto - burnout', value: 'veryhigh' }
          ],
          order_number: 8
        },
        {
          question_text: 'Faz check-ups médicos regularmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, anualmente ou mais', value: 'yes' },
            { text: 'Não, raramente vou ao médico', value: 'no' }
          ],
          order_number: 9
        },
        {
          question_text: 'Possui plano de saúde?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, plano completo', value: 'full' },
            { text: 'Sim, plano básico', value: 'basic' },
            { text: 'Não, uso sistema público', value: 'public' },
            { text: 'Não, pago particular', value: 'private' }
          ],
          order_number: 10
        }
      ],
      formConfig: {
        collect_name: true,
        collect_email: true,
        collect_whatsapp: true,
        collection_timing: 'after'
      },
      results: [
        {
          result_text: '🏥 Avaliação de Saúde Completa\n\nCom base no seu perfil, recomendamos consulta com nossos especialistas para um plano de saúde personalizado. Agende sua avaliação inicial gratuita.',
          button_text: 'Agendar Consulta Gratuita',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'fitness-energia',
    name: 'Fitness & Energia',
    description: 'Design energético e motivacional',
    category: 'engagement',
    icon: '💪',
    preview: {
      title: 'Seu Plano de Treino Ideal',
      description: 'Descubra seu programa fitness personalizado',
      questionCount: 10,
      template: 'criativo'
    },
    config: {
      title: 'Monte seu Plano de Treino Personalizado',
      description: 'Programa fitness customizado para seus objetivos',
      questionCount: 10,
      template: 'criativo',
      questions: [
        {
          question_text: 'Qual seu principal objetivo fitness?',
          answer_format: 'single_choice',
          options: [
            { text: 'Perder peso/gordura', value: 'weightloss' },
            { text: 'Ganhar massa muscular', value: 'muscle' },
            { text: 'Definição corporal', value: 'definition' },
            { text: 'Aumentar resistência', value: 'endurance' },
            { text: 'Melhorar saúde geral', value: 'health' },
            { text: 'Performance atlética', value: 'performance' }
          ],
          order_number: 1
        },
        {
          question_text: 'Nível atual de condicionamento físico?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sedentário - iniciante', value: 'beginner' },
            { text: 'Iniciante - pouca atividade', value: 'novice' },
            { text: 'Intermediário - treino regular', value: 'intermediate' },
            { text: 'Avançado - treino intenso', value: 'advanced' },
            { text: 'Atleta competitivo', value: 'athlete' }
          ],
          order_number: 2
        },
        {
          question_text: 'Quantos dias por semana pode treinar?',
          answer_format: 'single_choice',
          options: [
            { text: '1-2 dias', value: 'minimal' },
            { text: '3 dias', value: 'moderate' },
            { text: '4-5 dias', value: 'regular' },
            { text: '6 dias', value: 'intense' },
            { text: 'Todos os dias', value: 'daily' }
          ],
          order_number: 3
        },
        {
          question_text: 'Tempo disponível por treino?',
          answer_format: 'single_choice',
          options: [
            { text: '30 minutos', value: 'short' },
            { text: '45 minutos', value: 'medium' },
            { text: '60 minutos', value: 'standard' },
            { text: '90 minutos', value: 'long' },
            { text: 'Mais de 2 horas', value: 'extended' }
          ],
          order_number: 4
        },
        {
          question_text: 'Preferência de tipo de treino?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Musculação/peso livre', value: 'weights' },
            { text: 'Treino funcional', value: 'functional' },
            { text: 'Cardio/corrida', value: 'cardio' },
            { text: 'Natação', value: 'swimming' },
            { text: 'Lutas/artes marciais', value: 'martial' },
            { text: 'Yoga/pilates', value: 'flexibility' }
          ],
          order_number: 5
        },
        {
          question_text: 'Onde prefere treinar?',
          answer_format: 'single_choice',
          options: [
            { text: 'Academia completa', value: 'gym' },
            { text: 'Em casa', value: 'home' },
            { text: 'Ao ar livre', value: 'outdoor' },
            { text: 'Híbrido - varia', value: 'hybrid' }
          ],
          order_number: 6
        },
        {
          question_text: 'Possui alguma restrição física ou lesão?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, tenho restrições', value: 'yes' },
            { text: 'Não, estou liberado', value: 'no' }
          ],
          order_number: 7
        },
        {
          question_text: 'Experiência com suplementação?',
          answer_format: 'single_choice',
          options: [
            { text: 'Nunca usei', value: 'none' },
            { text: 'Uso básico (whey/creatina)', value: 'basic' },
            { text: 'Stack intermediário', value: 'intermediate' },
            { text: 'Stack avançado', value: 'advanced' }
          ],
          order_number: 8
        },
        {
          question_text: 'Acompanhamento nutricional atual?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sem acompanhamento', value: 'none' },
            { text: 'Faço por conta própria', value: 'self' },
            { text: 'Nutricionista eventual', value: 'occasional' },
            { text: 'Acompanhamento regular', value: 'regular' }
          ],
          order_number: 9
        },
        {
          question_text: 'Quanto pretende investir mensalmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 100', value: 'minimal' },
            { text: 'R$ 100 - R$ 300', value: 'basic' },
            { text: 'R$ 300 - R$ 600', value: 'standard' },
            { text: 'R$ 600 - R$ 1000', value: 'premium' },
            { text: 'Acima de R$ 1000', value: 'vip' }
          ],
          order_number: 10
        }
      ],
      formConfig: {
        collect_name: true,
        collect_email: true,
        collect_whatsapp: true,
        collection_timing: 'after'
      },
      results: [
        {
          result_text: '💪 Seu Plano Fitness Personalizado\n\nCom base no seu perfil e objetivos, montamos o programa ideal! Inclui treinos, nutrição e suporte contínuo para você alcançar seus resultados.',
          button_text: 'Começar Minha Transformação',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  }
];

export const getAllTemplates = () => {
  const { quizTemplates } = require('./quizTemplates');
  return [...quizTemplates, ...premiumQuizTemplates];
};