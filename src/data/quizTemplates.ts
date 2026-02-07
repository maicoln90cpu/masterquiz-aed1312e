export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_qualification' | 'product_discovery' | 'customer_satisfaction' | 'engagement';
  icon: string;
  preview: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
  };
  config: {
    title: string;
    description: string;
    questionCount: number;
    template: string;
    questions: Array<{
      id?: string;
      question_text: string;
      custom_label?: string;
      answer_format: 'single_choice' | 'multiple_choice';
      options: Array<{ text: string; value: string; imageUrl?: string }>;
      order_number: number;
      blocks?: any[];
    }>;
    formConfig: {
      collect_name: boolean;
      collect_email: boolean;
      collect_whatsapp: boolean;
      collection_timing: 'before' | 'after';
    };
    results: Array<{
      result_text: string;
      button_text: string;
      condition_type: 'always' | 'score_range' | 'specific_answers';
      order_number: number;
    }>;
  };
}

export const quizTemplates: QuizTemplate[] = [
  {
    id: 'qualificacao-lead',
    name: '⭐ Qualificação de Lead (Exemplo Completo)',
    description: 'Template completo com blocos enriquecidos - Use como referência!',
    category: 'lead_qualification',
    icon: '🎯',
    preview: {
      title: 'Qual solução ideal para seu negócio?',
      description: 'Descubra em 2 minutos',
      questionCount: 10,
      template: 'moderno'
    },
    config: {
      title: 'Qual solução ideal para seu negócio?',
      description: 'Responda 10 perguntas rápidas e descubra a melhor opção para você',
      questionCount: 10,
      template: 'moderno',
      questions: [
        {
          id: 'q1-lead-qual',
          question_text: 'Qual o tamanho da sua empresa?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Apenas eu (Freelancer)', value: 'freelancer', imageUrl: '' },
            { text: '2-10 pessoas', value: 'small', imageUrl: '' },
            { text: '11-50 pessoas', value: 'medium', imageUrl: '' },
            { text: 'Mais de 50 pessoas', value: 'large', imageUrl: '' }
          ],
          order_number: 1,
          blocks: [
            {
              id: 'block-q1-image',
              type: 'image',
              order: 0,
              content: '',
              imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
              imageAlt: 'Equipe trabalhando em escritório moderno'
            },
            {
              id: 'block-q1-text',
              type: 'text',
              order: 1,
              content: '<h2>Vamos conhecer sua empresa</h2><p>Queremos entender melhor o tamanho da sua operação para oferecer a solução mais adequada às suas necessidades.</p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q1-separator',
              type: 'separator',
              order: 2,
              content: '',
              style: 'solid'
            },
            {
              id: 'block-q1-question',
              type: 'question',
              order: 3,
              content: 'Qual o tamanho da sua empresa?',
              options: [
                { text: 'Apenas eu (Freelancer)', value: 'freelancer', imageUrl: '' },
                { text: '2-10 pessoas', value: 'small', imageUrl: '' },
                { text: '11-50 pessoas', value: 'medium', imageUrl: '' },
                { text: 'Mais de 50 pessoas', value: 'large', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q2-lead-qual',
          question_text: 'Qual seu principal desafio hoje?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Gerar mais leads qualificados', value: 'leads', imageUrl: '' },
            { text: 'Aumentar conversão de vendas', value: 'conversion', imageUrl: '' },
            { text: 'Automatizar processos', value: 'automation', imageUrl: '' },
            { text: 'Reduzir custos', value: 'costs', imageUrl: '' }
          ],
          order_number: 2,
          blocks: [
            {
              id: 'block-q2-text',
              type: 'text',
              order: 0,
              content: '<h3>Identificando seus desafios</h3><p>Cada negócio tem suas prioridades. Nos conte qual é a sua maior dor hoje.</p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q2-question',
              type: 'question',
              order: 1,
              content: 'Qual seu principal desafio hoje?',
              options: [
                { text: 'Gerar mais leads qualificados', value: 'leads', imageUrl: '' },
                { text: 'Aumentar conversão de vendas', value: 'conversion', imageUrl: '' },
                { text: 'Automatizar processos', value: 'automation', imageUrl: '' },
                { text: 'Reduzir custos', value: 'costs', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q3-lead-qual',
          question_text: 'Qual seu orçamento mensal para ferramentas?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 200', value: 'low', imageUrl: '' },
            { text: 'R$ 200 - R$ 500', value: 'medium', imageUrl: '' },
            { text: 'R$ 500 - R$ 1.000', value: 'high', imageUrl: '' },
            { text: 'Acima de R$ 1.000', value: 'enterprise', imageUrl: '' }
          ],
          order_number: 3,
          blocks: [
            {
              id: 'block-q3-image',
              type: 'image',
              order: 0,
              content: '',
              imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
              imageAlt: 'Planejamento financeiro'
            },
            {
              id: 'block-q3-question',
              type: 'question',
              order: 1,
              content: 'Qual seu orçamento mensal para ferramentas?',
              options: [
                { text: 'Até R$ 200', value: 'low', imageUrl: '' },
                { text: 'R$ 200 - R$ 500', value: 'medium', imageUrl: '' },
                { text: 'R$ 500 - R$ 1.000', value: 'high', imageUrl: '' },
                { text: 'Acima de R$ 1.000', value: 'enterprise', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q4-lead-qual',
          question_text: 'Quando pretende implementar uma solução?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Imediatamente (esta semana)', value: 'immediate', imageUrl: '' },
            { text: 'Próximo mês', value: 'month', imageUrl: '' },
            { text: 'Próximos 3 meses', value: 'quarter', imageUrl: '' },
            { text: 'Apenas pesquisando', value: 'research', imageUrl: '' }
          ],
          order_number: 4,
          blocks: [
            {
              id: 'block-q4-video',
              type: 'video',
              order: 0,
              content: '',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              videoTitle: 'Como nossa solução funciona'
            },
            {
              id: 'block-q4-text',
              type: 'text',
              order: 1,
              content: '<p>Entender seu prazo nos ajuda a priorizar e oferecer o melhor suporte na implementação.</p>',
              fontSize: 'small',
              textAlign: 'left'
            },
            {
              id: 'block-q4-question',
              type: 'question',
              order: 2,
              content: 'Quando pretende implementar uma solução?',
              options: [
                { text: 'Imediatamente (esta semana)', value: 'immediate', imageUrl: '' },
                { text: 'Próximo mês', value: 'month', imageUrl: '' },
                { text: 'Próximos 3 meses', value: 'quarter', imageUrl: '' },
                { text: 'Apenas pesquisando', value: 'research', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q5-lead-qual',
          question_text: 'Já usa alguma ferramenta similar?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Não, seria minha primeira', value: 'no', imageUrl: '' },
            { text: 'Sim, mas não estou satisfeito', value: 'unsatisfied', imageUrl: '' },
            { text: 'Sim, e funciona bem', value: 'satisfied', imageUrl: '' }
          ],
          order_number: 5,
          blocks: [
            {
              id: 'block-q5-text',
              type: 'text',
              order: 0,
              content: '<h3>Experiência anterior</h3><p>Saber se você já tem familiaridade com ferramentas similares nos ajuda a personalizar sua experiência.</p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q5-separator',
              type: 'separator',
              order: 1,
              content: '',
              style: 'dashed'
            },
            {
              id: 'block-q5-question',
              type: 'question',
              order: 2,
              content: 'Já usa alguma ferramenta similar?',
              options: [
                { text: 'Não, seria minha primeira', value: 'no', imageUrl: '' },
                { text: 'Sim, mas não estou satisfeito', value: 'unsatisfied', imageUrl: '' },
                { text: 'Sim, e funciona bem', value: 'satisfied', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q6-lead-qual',
          question_text: 'Em qual região você atua?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Região Sul', value: 'sul', imageUrl: '' },
            { text: 'Região Sudeste', value: 'sudeste', imageUrl: '' },
            { text: 'Região Centro-Oeste', value: 'centro', imageUrl: '' },
            { text: 'Região Nordeste', value: 'nordeste', imageUrl: '' },
            { text: 'Região Norte', value: 'norte', imageUrl: '' },
            { text: 'Todo Brasil', value: 'nacional', imageUrl: '' }
          ],
          order_number: 6,
          blocks: [
            {
              id: 'block-q6-image',
              type: 'image',
              order: 0,
              content: '',
              imageUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800',
              imageAlt: 'Mapa do Brasil'
            },
            {
              id: 'block-q6-text',
              type: 'text',
              order: 1,
              content: '<h3>Área de atuação</h3>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q6-question',
              type: 'question',
              order: 2,
              content: 'Em qual região você atua?',
              options: [
                { text: 'Região Sul', value: 'sul', imageUrl: '' },
                { text: 'Região Sudeste', value: 'sudeste', imageUrl: '' },
                { text: 'Região Centro-Oeste', value: 'centro', imageUrl: '' },
                { text: 'Região Nordeste', value: 'nordeste', imageUrl: '' },
                { text: 'Região Norte', value: 'norte', imageUrl: '' },
                { text: 'Todo Brasil', value: 'nacional', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q7-lead-qual',
          question_text: 'Quantos funcionários trabalham no setor comercial?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Apenas eu', value: '1', imageUrl: '' },
            { text: '2-5 pessoas', value: '2-5', imageUrl: '' },
            { text: '6-15 pessoas', value: '6-15', imageUrl: '' },
            { text: 'Mais de 15 pessoas', value: '15+', imageUrl: '' }
          ],
          order_number: 7,
          blocks: [
            {
              id: 'block-q7-metrics',
              type: 'metrics',
              order: 0,
              title: 'Nossos Resultados',
              chartType: 'bar',
              data: [
                { label: 'Empresas atendidas', value: 1000, color: '#3b82f6' },
                { label: 'Taxa de satisfação', value: 98, color: '#10b981' }
              ],
              showLegend: true,
              showValues: true
            },
            {
              id: 'block-q7-question',
              type: 'question',
              order: 1,
              content: 'Quantos funcionários trabalham no setor comercial?',
              options: [
                { text: 'Apenas eu', value: '1', imageUrl: '' },
                { text: '2-5 pessoas', value: '2-5', imageUrl: '' },
                { text: '6-15 pessoas', value: '6-15', imageUrl: '' },
                { text: 'Mais de 15 pessoas', value: '15+', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q8-lead-qual',
          question_text: 'Qual segmento do seu negócio?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'B2B (Vendas para empresas)', value: 'b2b', imageUrl: '' },
            { text: 'B2C (Vendas para consumidor final)', value: 'b2c', imageUrl: '' },
            { text: 'Ambos (B2B e B2C)', value: 'both', imageUrl: '' }
          ],
          order_number: 8,
          blocks: [
            {
              id: 'block-q8-text',
              type: 'text',
              order: 0,
              content: '<h3>Tipo de operação</h3><p>Cada modelo de negócio tem suas particularidades. Vamos personalizar a solução para você.</p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q8-gallery',
              type: 'gallery',
              order: 1,
              content: '',
              images: [
                { url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400', alt: 'B2B' },
                { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', alt: 'B2C' }
              ]
            },
            {
              id: 'block-q8-question',
              type: 'question',
              order: 2,
              content: 'Qual segmento do seu negócio?',
              options: [
                { text: 'B2B (Vendas para empresas)', value: 'b2b', imageUrl: '' },
                { text: 'B2C (Vendas para consumidor final)', value: 'b2c', imageUrl: '' },
                { text: 'Ambos (B2B e B2C)', value: 'both', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q9-lead-qual',
          question_text: 'Quais canais de marketing você usa?',
          custom_label: '',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Redes Sociais', value: 'social', imageUrl: '' },
            { text: 'Google Ads', value: 'google', imageUrl: '' },
            { text: 'E-mail Marketing', value: 'email', imageUrl: '' },
            { text: 'Indicação', value: 'referral', imageUrl: '' },
            { text: 'Eventos', value: 'events', imageUrl: '' }
          ],
          order_number: 9,
          blocks: [
            {
              id: 'block-q9-image',
              type: 'image',
              order: 0,
              content: '',
              imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
              imageAlt: 'Estratégia de marketing digital'
            },
            {
              id: 'block-q9-text',
              type: 'text',
              order: 1,
              content: '<h3>Seus canais de aquisição</h3><p><strong>Você pode selecionar múltiplas opções!</strong></p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q9-question',
              type: 'question',
              order: 2,
              content: 'Quais canais de marketing você usa?',
              options: [
                { text: 'Redes Sociais', value: 'social', imageUrl: '' },
                { text: 'Google Ads', value: 'google', imageUrl: '' },
                { text: 'E-mail Marketing', value: 'email', imageUrl: '' },
                { text: 'Indicação', value: 'referral', imageUrl: '' },
                { text: 'Eventos', value: 'events', imageUrl: '' }
              ],
              answerFormat: 'multiple_choice',
              required: true,
              autoAdvance: false
            }
          ]
        },
        {
          id: 'q10-lead-qual',
          question_text: 'Qual ROI você espera com a solução?',
          custom_label: '',
          answer_format: 'single_choice',
          options: [
            { text: 'Retorno em até 3 meses', value: '3m', imageUrl: '' },
            { text: 'Retorno em 6 meses', value: '6m', imageUrl: '' },
            { text: 'Retorno em 1 ano', value: '1y', imageUrl: '' },
            { text: 'Foco em longo prazo (2+ anos)', value: 'long', imageUrl: '' }
          ],
          order_number: 10,
          blocks: [
            {
              id: 'block-q10-image',
              type: 'image',
              order: 0,
              content: '',
              imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
              imageAlt: 'Crescimento e resultados'
            },
            {
              id: 'block-q10-text',
              type: 'text',
              order: 1,
              content: '<h2>Última pergunta!</h2><p>Entender suas expectativas de retorno nos ajuda a alinhar a proposta de valor ideal.</p>',
              fontSize: 'medium',
              textAlign: 'left'
            },
            {
              id: 'block-q10-separator',
              type: 'separator',
              order: 2,
              content: '',
              style: 'solid'
            },
            {
              id: 'block-q10-question',
              type: 'question',
              order: 3,
              content: 'Qual ROI você espera com a solução?',
              options: [
                { text: 'Retorno em até 3 meses', value: '3m', imageUrl: '' },
                { text: 'Retorno em 6 meses', value: '6m', imageUrl: '' },
                { text: 'Retorno em 1 ano', value: '1y', imageUrl: '' },
                { text: 'Foco em longo prazo (2+ anos)', value: 'long', imageUrl: '' }
              ],
              answerFormat: 'single_choice',
              required: true,
              autoAdvance: false
            }
          ]
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
          result_text: 'Você tem perfil de LEAD QUENTE! 🔥\n\nSua empresa está no momento ideal para implementar uma solução. Vamos conversar sobre como podemos ajudar você a alcançar seus objetivos.',
          button_text: 'Falar com especialista',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'descoberta-produto',
    name: 'Descoberta de Produto',
    description: 'Ajude clientes a encontrar o produto/serviço perfeito',
    category: 'product_discovery',
    icon: '🔍',
    preview: {
      title: 'Qual produto é ideal para você?',
      description: 'Quiz de recomendação personalizada',
      questionCount: 4,
      template: 'moderno'
    },
    config: {
      title: 'Encontre seu produto ideal',
      description: 'Responda 4 perguntas e receba uma recomendação personalizada',
      questionCount: 4,
      template: 'moderno',
      questions: [
        {
          question_text: 'Qual seu principal objetivo?',
          answer_format: 'single_choice',
          options: [
            { text: 'Aumentar produtividade', value: 'productivity' },
            { text: 'Economizar tempo', value: 'time' },
            { text: 'Melhorar qualidade', value: 'quality' },
            { text: 'Reduzir custos', value: 'cost' }
          ],
          order_number: 1
        },
        {
          question_text: 'Nível de experiência com ferramentas digitais?',
          answer_format: 'single_choice',
          options: [
            { text: 'Iniciante', value: 'beginner' },
            { text: 'Intermediário', value: 'intermediate' },
            { text: 'Avançado', value: 'advanced' }
          ],
          order_number: 2
        },
        {
          question_text: 'Quantas pessoas vão usar?',
          answer_format: 'single_choice',
          options: [
            { text: 'Apenas eu', value: 'solo' },
            { text: '2-5 pessoas', value: 'small_team' },
            { text: '6-20 pessoas', value: 'medium_team' },
            { text: 'Mais de 20', value: 'large_team' }
          ],
          order_number: 3
        },
        {
          question_text: 'Qual funcionalidade é mais importante?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Integração com outras ferramentas', value: 'integration' },
            { text: 'Relatórios detalhados', value: 'reports' },
            { text: 'Suporte 24/7', value: 'support' },
            { text: 'Personalização avançada', value: 'customization' }
          ],
          order_number: 4
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
          result_text: 'Com base nas suas respostas, recomendamos:\n\n✨ Nosso plano PROFISSIONAL\n\nEle oferece todas as funcionalidades que você precisa para alcançar seus objetivos!',
          button_text: 'Ver detalhes do plano',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'diagnostico-negocio',
    name: 'Diagnóstico de Negócio',
    description: 'Avalie a maturidade digital e identifique oportunidades',
    category: 'lead_qualification',
    icon: '📊',
    preview: {
      title: 'Diagnóstico Digital do seu Negócio',
      description: 'Descubra seu nível de maturidade',
      questionCount: 6,
      template: 'moderno'
    },
    config: {
      title: 'Diagnóstico Digital do seu Negócio',
      description: 'Avalie a maturidade digital da sua empresa em 6 perguntas',
      questionCount: 6,
      template: 'moderno',
      questions: [
        {
          question_text: 'Como você captura leads atualmente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Formulários manuais/papel', value: 'manual' },
            { text: 'Formulários digitais simples', value: 'basic' },
            { text: 'Sistema de CRM integrado', value: 'crm' },
            { text: 'Automação completa com IA', value: 'ai' }
          ],
          order_number: 1
        },
        {
          question_text: 'Como acompanha performance de vendas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Planilhas manuais', value: 'spreadsheet' },
            { text: 'Relatórios básicos', value: 'basic_reports' },
            { text: 'Dashboard em tempo real', value: 'dashboard' },
            { text: 'BI com previsões e insights', value: 'bi' }
          ],
          order_number: 2
        },
        {
          question_text: 'Nível de automação de marketing?',
          answer_format: 'single_choice',
          options: [
            { text: 'Nenhuma automação', value: 'none' },
            { text: 'E-mail marketing básico', value: 'email' },
            { text: 'Múltiplos canais automatizados', value: 'multi' },
            { text: 'Marketing totalmente automatizado', value: 'full' }
          ],
          order_number: 3
        },
        {
          question_text: 'Como qualifica leads?',
          answer_format: 'single_choice',
          options: [
            { text: 'Manualmente, um por um', value: 'manual' },
            { text: 'Critérios básicos (formulário)', value: 'basic' },
            { text: 'Lead scoring automatizado', value: 'scoring' },
            { text: 'IA preditiva + comportamento', value: 'ai' }
          ],
          order_number: 4
        },
        {
          question_text: 'Integração entre ferramentas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sem integração', value: 'none' },
            { text: '1-2 integrações básicas', value: 'few' },
            { text: 'Várias integrações nativas', value: 'many' },
            { text: 'Ecosistema totalmente integrado', value: 'ecosystem' }
          ],
          order_number: 5
        },
        {
          question_text: 'Tempo médio de resposta a leads?',
          answer_format: 'single_choice',
          options: [
            { text: 'Mais de 24 horas', value: 'slow' },
            { text: '4-24 horas', value: 'medium' },
            { text: '1-4 horas', value: 'fast' },
            { text: 'Imediato (minutos)', value: 'instant' }
          ],
          order_number: 6
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
          result_text: '📊 Diagnóstico completo!\n\nIdentificamos oportunidades de melhoria para escalar seu negócio. Vamos conversar sobre como implementar soluções que aumentem sua eficiência em até 300%.',
          button_text: 'Receber diagnóstico completo',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'satisfacao-cliente',
    name: 'Satisfação do Cliente',
    description: 'Colete feedback e melhore a experiência do cliente',
    category: 'customer_satisfaction',
    icon: '⭐',
    preview: {
      title: 'Como foi sua experiência?',
      description: 'Queremos ouvir você',
      questionCount: 4,
      template: 'moderno'
    },
    config: {
      title: 'Avalie sua experiência conosco',
      description: 'Sua opinião é muito importante para nós!',
      questionCount: 4,
      template: 'moderno',
      questions: [
        {
          question_text: 'Como avalia nosso atendimento?',
          answer_format: 'single_choice',
          options: [
            { text: '⭐ Ruim', value: '1' },
            { text: '⭐⭐ Regular', value: '2' },
            { text: '⭐⭐⭐ Bom', value: '3' },
            { text: '⭐⭐⭐⭐ Muito bom', value: '4' },
            { text: '⭐⭐⭐⭐⭐ Excelente', value: '5' }
          ],
          order_number: 1
        },
        {
          question_text: 'Nosso produto/serviço atendeu suas expectativas?',
          answer_format: 'single_choice',
          options: [
            { text: 'Superou expectativas', value: 'exceeded' },
            { text: 'Atendeu expectativas', value: 'met' },
            { text: 'Ficou abaixo das expectativas', value: 'below' }
          ],
          order_number: 2
        },
        {
          question_text: 'Recomendaria para um amigo?',
          answer_format: 'single_choice',
          options: [
            { text: 'Definitivamente sim', value: 'yes' },
            { text: 'Provavelmente sim', value: 'maybe' },
            { text: 'Não recomendaria', value: 'no' }
          ],
          order_number: 3
        },
        {
          question_text: 'O que podemos melhorar?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Velocidade de entrega', value: 'speed' },
            { text: 'Qualidade do produto', value: 'quality' },
            { text: 'Comunicação', value: 'communication' },
            { text: 'Preço', value: 'price' },
            { text: 'Está tudo ótimo!', value: 'nothing' }
          ],
          order_number: 4
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
          result_text: '🙏 Muito obrigado pelo seu feedback!\n\nSua opinião nos ajuda a melhorar continuamente. Conte sempre conosco!',
          button_text: 'Fechar',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'nps-survey',
    name: 'NPS - Net Promoter Score',
    description: 'Meça a lealdade dos clientes com metodologia NPS',
    category: 'customer_satisfaction',
    icon: '📈',
    preview: {
      title: 'Avalie nossa empresa',
      description: 'De 0 a 10, quanto você recomendaria?',
      questionCount: 5,
      template: 'moderno'
    },
    config: {
      title: 'Quanto você nos recomendaria?',
      description: 'Ajude-nos a melhorar com sua opinião sincera',
      questionCount: 5,
      template: 'moderno',
      questions: [
        {
          question_text: 'Em uma escala de 0 a 10, qual a probabilidade de você recomendar nossa empresa para um amigo ou colega?',
          answer_format: 'single_choice',
          options: [
            { text: '0 - Nada provável', value: '0' },
            { text: '1', value: '1' },
            { text: '2', value: '2' },
            { text: '3', value: '3' },
            { text: '4', value: '4' },
            { text: '5', value: '5' },
            { text: '6', value: '6' },
            { text: '7', value: '7' },
            { text: '8', value: '8' },
            { text: '9', value: '9' },
            { text: '10 - Extremamente provável', value: '10' }
          ],
          order_number: 1
        },
        {
          question_text: 'Qual o principal motivo da sua nota?',
          answer_format: 'single_choice',
          options: [
            { text: 'Qualidade do produto/serviço', value: 'quality' },
            { text: 'Atendimento ao cliente', value: 'service' },
            { text: 'Custo-benefício', value: 'value' },
            { text: 'Facilidade de uso', value: 'usability' },
            { text: 'Confiabilidade', value: 'reliability' },
            { text: 'Outro motivo', value: 'other' }
          ],
          order_number: 2
        },
        {
          question_text: 'Há quanto tempo você é nosso cliente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Menos de 1 mês', value: 'new' },
            { text: '1-6 meses', value: 'recent' },
            { text: '6-12 meses', value: 'regular' },
            { text: 'Mais de 1 ano', value: 'loyal' }
          ],
          order_number: 3
        },
        {
          question_text: 'Com que frequência você usa nosso produto/serviço?',
          answer_format: 'single_choice',
          options: [
            { text: 'Diariamente', value: 'daily' },
            { text: 'Semanalmente', value: 'weekly' },
            { text: 'Mensalmente', value: 'monthly' },
            { text: 'Raramente', value: 'rarely' }
          ],
          order_number: 4
        },
        {
          question_text: 'Qual funcionalidade você mais utiliza?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Recursos básicos', value: 'basic' },
            { text: 'Recursos avançados', value: 'advanced' },
            { text: 'Integrações', value: 'integrations' },
            { text: 'Relatórios', value: 'reports' },
            { text: 'Suporte', value: 'support' }
          ],
          order_number: 5
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
          result_text: '🎉 Obrigado por participar da nossa pesquisa NPS!\n\nSeu feedback é valioso para continuarmos melhorando nossos serviços. Em breve entraremos em contato com novidades!',
          button_text: 'Concluir',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'pos-compra-satisfacao',
    name: 'Satisfação Pós-Compra',
    description: 'Colete feedback sobre a experiência de compra',
    category: 'customer_satisfaction',
    icon: '🛍️',
    preview: {
      title: 'Como foi sua experiência de compra?',
      description: 'Conte-nos sobre sua compra recente',
      questionCount: 6,
      template: 'moderno'
    },
    config: {
      title: 'Avalie sua experiência de compra',
      description: 'Queremos saber como foi sua última compra conosco',
      questionCount: 6,
      template: 'moderno',
      questions: [
        {
          question_text: 'Qual produto você comprou recentemente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Produto físico', value: 'physical' },
            { text: 'Produto digital', value: 'digital' },
            { text: 'Serviço', value: 'service' },
            { text: 'Assinatura/Plano', value: 'subscription' }
          ],
          order_number: 1
        },
        {
          question_text: 'Como foi o processo de compra?',
          answer_format: 'single_choice',
          options: [
            { text: '😊 Muito fácil e rápido', value: 'excellent' },
            { text: '🙂 Tranquilo', value: 'good' },
            { text: '😐 Com algumas dificuldades', value: 'ok' },
            { text: '😞 Complicado', value: 'difficult' }
          ],
          order_number: 2
        },
        {
          question_text: 'O prazo de entrega/acesso foi adequado?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, mais rápido que o esperado', value: 'faster' },
            { text: 'Sim, dentro do prazo', value: 'ontime' },
            { text: 'Atrasou um pouco', value: 'delayed' },
            { text: 'Atrasou muito', value: 'very_delayed' }
          ],
          order_number: 3
        },
        {
          question_text: 'O produto atendeu suas expectativas?',
          answer_format: 'single_choice',
          options: [
            { text: '🌟 Superou minhas expectativas', value: 'exceeded' },
            { text: '✅ Atendeu perfeitamente', value: 'met' },
            { text: '😐 Atendeu parcialmente', value: 'partial' },
            { text: '😞 Não atendeu', value: 'not_met' }
          ],
          order_number: 4
        },
        {
          question_text: 'Como foi o atendimento/suporte durante a compra?',
          answer_format: 'single_choice',
          options: [
            { text: 'Excelente - Muito atencioso', value: '5' },
            { text: 'Bom - Resolveu minhas dúvidas', value: '4' },
            { text: 'Regular - Poderia ser melhor', value: '3' },
            { text: 'Ruim - Demorado ou incompleto', value: '2' },
            { text: 'Não precisei de suporte', value: 'na' }
          ],
          order_number: 5
        },
        {
          question_text: 'Você compraria novamente?',
          answer_format: 'single_choice',
          options: [
            { text: 'Sim, com certeza!', value: 'yes_definitely' },
            { text: 'Provavelmente sim', value: 'yes_probably' },
            { text: 'Talvez', value: 'maybe' },
            { text: 'Provavelmente não', value: 'no_probably' },
            { text: 'Definitivamente não', value: 'no_definitely' }
          ],
          order_number: 6
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
          result_text: '💙 Muito obrigado pelo seu feedback!\n\nSua opinião nos ajuda a melhorar cada vez mais. Esperamos vê-lo novamente em breve!',
          button_text: 'Finalizar',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  },
  {
    id: 'recomendacao-produto',
    name: 'Quiz de Recomendação de Produto',
    description: 'Ajude clientes a encontrar o produto perfeito',
    category: 'product_discovery',
    icon: '🎁',
    preview: {
      title: 'Qual produto é perfeito para você?',
      description: 'Descubra em 5 perguntas',
      questionCount: 5,
      template: 'moderno'
    },
    config: {
      title: 'Encontre seu produto ideal',
      description: 'Responda 5 perguntas e receba uma recomendação personalizada',
      questionCount: 5,
      template: 'moderno',
      questions: [
        {
          question_text: 'Qual é o seu objetivo principal?',
          answer_format: 'single_choice',
          options: [
            { text: 'Uso pessoal/hobby', value: 'personal' },
            { text: 'Trabalho/profissional', value: 'professional' },
            { text: 'Presente para alguém', value: 'gift' },
            { text: 'Estudo/aprendizado', value: 'learning' }
          ],
          order_number: 1
        },
        {
          question_text: 'Qual seu nível de experiência com produtos similares?',
          answer_format: 'single_choice',
          options: [
            { text: '🌱 Iniciante - Primeiro contato', value: 'beginner' },
            { text: '📚 Intermediário - Já usei antes', value: 'intermediate' },
            { text: '🚀 Avançado - Uso frequentemente', value: 'advanced' },
            { text: '⭐ Expert - Conheço muito bem', value: 'expert' }
          ],
          order_number: 2
        },
        {
          question_text: 'Qual faixa de preço você considera?',
          answer_format: 'single_choice',
          options: [
            { text: 'Até R$ 100 - Econômico', value: 'budget' },
            { text: 'R$ 100 - R$ 300 - Intermediário', value: 'mid' },
            { text: 'R$ 300 - R$ 600 - Premium', value: 'premium' },
            { text: 'Acima de R$ 600 - Top de linha', value: 'luxury' }
          ],
          order_number: 3
        },
        {
          question_text: 'Quais características são mais importantes para você?',
          answer_format: 'multiple_choice',
          options: [
            { text: 'Qualidade superior', value: 'quality' },
            { text: 'Facilidade de uso', value: 'easy' },
            { text: 'Design moderno', value: 'design' },
            { text: 'Durabilidade', value: 'durability' },
            { text: 'Funcionalidades avançadas', value: 'features' },
            { text: 'Melhor custo-benefício', value: 'value' }
          ],
          order_number: 4
        },
        {
          question_text: 'Quando você precisa do produto?',
          answer_format: 'single_choice',
          options: [
            { text: 'Urgente - Esta semana', value: 'urgent' },
            { text: 'Breve - Até 2 semanas', value: 'soon' },
            { text: 'Sem pressa - Até 1 mês', value: 'flexible' },
            { text: 'Só pesquisando por enquanto', value: 'researching' }
          ],
          order_number: 5
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
          result_text: '🎯 Recomendação Personalizada!\n\nCom base nas suas respostas, temos o produto perfeito para você. Nossa equipe entrará em contato com uma proposta exclusiva!',
          button_text: 'Receber recomendação',
          condition_type: 'always',
          order_number: 1
        }
      ]
    }
  }
];

export const getTemplateById = (id: string): QuizTemplate | undefined => {
  return quizTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: QuizTemplate['category']): QuizTemplate[] => {
  return quizTemplates.filter(t => t.category === category);
};
