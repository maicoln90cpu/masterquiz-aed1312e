// Templates de calculadoras prontas para uso rápido

export interface CalculatorTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'finance' | 'business' | 'other';
  formula: string;
  displayFormat: 'number' | 'currency' | 'percentage' | 'custom';
  resultUnit: string;
  decimalPlaces: number;
  variables: {
    name: string;
    label: string;
    description: string;
  }[];
  ranges: {
    min: number;
    max: number;
    label: string;
    description: string;
  }[];
  suggestedQuestions: {
    text: string;
    options: { label: string; value: number }[];
  }[];
}

export const calculatorTemplates: CalculatorTemplate[] = [
  // === SAÚDE ===
  {
    id: 'imc',
    name: 'Calculadora de IMC',
    description: 'Calcula o Índice de Massa Corporal baseado em peso e altura',
    icon: '⚖️',
    category: 'health',
    formula: '{peso} / ({altura} * {altura})',
    displayFormat: 'custom',
    resultUnit: 'kg/m²',
    decimalPlaces: 1,
    variables: [
      { name: 'peso', label: 'Peso', description: 'Peso em kg' },
      { name: 'altura', label: 'Altura', description: 'Altura em metros' },
    ],
    ranges: [
      { min: 0, max: 18.4, label: 'Abaixo do peso', description: 'Seu IMC indica que você está abaixo do peso ideal. Consulte um profissional de saúde.' },
      { min: 18.5, max: 24.9, label: 'Peso normal', description: 'Parabéns! Seu IMC está na faixa considerada saudável.' },
      { min: 25, max: 29.9, label: 'Sobrepeso', description: 'Seu IMC indica sobrepeso. Considere ajustes na alimentação e atividade física.' },
      { min: 30, max: 34.9, label: 'Obesidade Grau I', description: 'Seu IMC indica obesidade grau I. Recomendamos acompanhamento profissional.' },
      { min: 35, max: 100, label: 'Obesidade Grau II+', description: 'Seu IMC indica obesidade severa. Procure orientação médica especializada.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual é o seu peso atual?',
        options: [
          { label: '50-60 kg', value: 55 },
          { label: '61-70 kg', value: 65 },
          { label: '71-80 kg', value: 75 },
          { label: '81-90 kg', value: 85 },
          { label: '91-100 kg', value: 95 },
          { label: 'Acima de 100 kg', value: 110 },
        ],
      },
      {
        text: 'Qual é a sua altura?',
        options: [
          { label: '1,50 - 1,60 m', value: 1.55 },
          { label: '1,61 - 1,70 m', value: 1.65 },
          { label: '1,71 - 1,80 m', value: 1.75 },
          { label: '1,81 - 1,90 m', value: 1.85 },
          { label: 'Acima de 1,90 m', value: 1.95 },
        ],
      },
    ],
  },

  // === FINANÇAS ===
  {
    id: 'roi',
    name: 'Calculadora de ROI',
    description: 'Calcula o Retorno sobre Investimento em porcentagem',
    icon: '📈',
    category: 'finance',
    formula: '(({ganho} - {investimento}) / {investimento}) * 100',
    displayFormat: 'percentage',
    resultUnit: '',
    decimalPlaces: 1,
    variables: [
      { name: 'investimento', label: 'Investimento inicial', description: 'Valor investido' },
      { name: 'ganho', label: 'Retorno obtido', description: 'Valor total retornado' },
    ],
    ranges: [
      { min: -100, max: 0, label: 'Prejuízo', description: 'O investimento resultou em prejuízo. Analise o que pode ser melhorado.' },
      { min: 0.1, max: 50, label: 'Retorno baixo', description: 'O retorno foi positivo, mas há espaço para melhorar a estratégia.' },
      { min: 50.1, max: 100, label: 'Retorno bom', description: 'Ótimo! Seu investimento teve um retorno sólido.' },
      { min: 100.1, max: 200, label: 'Retorno excelente', description: 'Excelente! Você mais que dobrou seu investimento.' },
      { min: 200.1, max: 10000, label: 'Retorno excepcional', description: 'Resultado excepcional! Continue com essa estratégia.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual foi o valor do seu investimento inicial?',
        options: [
          { label: 'R$ 1.000', value: 1000 },
          { label: 'R$ 5.000', value: 5000 },
          { label: 'R$ 10.000', value: 10000 },
          { label: 'R$ 50.000', value: 50000 },
          { label: 'R$ 100.000+', value: 100000 },
        ],
      },
      {
        text: 'Qual foi o retorno total obtido?',
        options: [
          { label: 'R$ 500', value: 500 },
          { label: 'R$ 2.000', value: 2000 },
          { label: 'R$ 5.000', value: 5000 },
          { label: 'R$ 15.000', value: 15000 },
          { label: 'R$ 50.000+', value: 50000 },
        ],
      },
    ],
  },

  {
    id: 'economia-mensal',
    name: 'Economia Mensal',
    description: 'Calcula quanto você pode economizar por mês com base em seus hábitos',
    icon: '💰',
    category: 'finance',
    formula: '{renda} * ({percentual_economia} / 100)',
    displayFormat: 'currency',
    resultUnit: '',
    decimalPlaces: 2,
    variables: [
      { name: 'renda', label: 'Renda mensal', description: 'Sua renda líquida mensal' },
      { name: 'percentual_economia', label: 'Percentual', description: 'Porcentagem que pode economizar' },
    ],
    ranges: [
      { min: 0, max: 200, label: 'Economia básica', description: 'Comece pequeno! Cada real poupado faz diferença a longo prazo.' },
      { min: 201, max: 500, label: 'Economia moderada', description: 'Boa meta! Com disciplina, você construirá uma reserva sólida.' },
      { min: 501, max: 1000, label: 'Economia significativa', description: 'Excelente! Você está no caminho para independência financeira.' },
      { min: 1001, max: 5000, label: 'Economia robusta', description: 'Impressionante! Sua disciplina financeira é admirável.' },
      { min: 5001, max: 100000, label: 'Alta capacidade', description: 'Você tem grande potencial de acumulação de patrimônio!' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual é sua renda mensal líquida?',
        options: [
          { label: 'R$ 2.000 - R$ 3.000', value: 2500 },
          { label: 'R$ 3.001 - R$ 5.000', value: 4000 },
          { label: 'R$ 5.001 - R$ 8.000', value: 6500 },
          { label: 'R$ 8.001 - R$ 15.000', value: 11500 },
          { label: 'Acima de R$ 15.000', value: 20000 },
        ],
      },
      {
        text: 'Quanto da sua renda você consegue guardar?',
        options: [
          { label: '5% - Mínimo', value: 5 },
          { label: '10% - Recomendado', value: 10 },
          { label: '20% - Bom', value: 20 },
          { label: '30% - Excelente', value: 30 },
          { label: '50%+ - Excepcional', value: 50 },
        ],
      },
    ],
  },

  {
    id: 'meta-financeira',
    name: 'Tempo para Meta',
    description: 'Calcula quantos meses para atingir sua meta financeira',
    icon: '🎯',
    category: 'finance',
    formula: '({meta} - {atual}) / {mensal}',
    displayFormat: 'custom',
    resultUnit: 'meses',
    decimalPlaces: 0,
    variables: [
      { name: 'meta', label: 'Meta', description: 'Valor que deseja atingir' },
      { name: 'atual', label: 'Atual', description: 'Quanto já tem guardado' },
      { name: 'mensal', label: 'Aporte mensal', description: 'Quanto vai guardar por mês' },
    ],
    ranges: [
      { min: 0, max: 6, label: 'Curto prazo', description: 'Meta de curto prazo! Você atingirá em menos de 6 meses.' },
      { min: 7, max: 12, label: 'Até 1 ano', description: 'Em até 1 ano você alcançará sua meta. Mantenha o foco!' },
      { min: 13, max: 24, label: '1 a 2 anos', description: 'Meta de médio prazo. Considere aumentar o aporte para acelerar.' },
      { min: 25, max: 60, label: '2 a 5 anos', description: 'Projeto de longo prazo. Considere investimentos para potencializar.' },
      { min: 61, max: 10000, label: 'Longo prazo', description: 'Meta ambiciosa! Revise o aporte mensal ou considere novas estratégias.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual é sua meta financeira?',
        options: [
          { label: 'R$ 5.000', value: 5000 },
          { label: 'R$ 10.000', value: 10000 },
          { label: 'R$ 50.000', value: 50000 },
          { label: 'R$ 100.000', value: 100000 },
          { label: 'R$ 500.000', value: 500000 },
        ],
      },
      {
        text: 'Quanto você já tem guardado?',
        options: [
          { label: 'Nada ainda', value: 0 },
          { label: 'R$ 1.000', value: 1000 },
          { label: 'R$ 5.000', value: 5000 },
          { label: 'R$ 10.000', value: 10000 },
          { label: 'R$ 50.000+', value: 50000 },
        ],
      },
      {
        text: 'Quanto pode guardar por mês?',
        options: [
          { label: 'R$ 200', value: 200 },
          { label: 'R$ 500', value: 500 },
          { label: 'R$ 1.000', value: 1000 },
          { label: 'R$ 2.000', value: 2000 },
          { label: 'R$ 5.000+', value: 5000 },
        ],
      },
    ],
  },

  // === NEGÓCIOS ===
  {
    id: 'margem-lucro',
    name: 'Margem de Lucro',
    description: 'Calcula a margem de lucro do seu produto ou serviço',
    icon: '💼',
    category: 'business',
    formula: '(({preco_venda} - {custo}) / {preco_venda}) * 100',
    displayFormat: 'percentage',
    resultUnit: '',
    decimalPlaces: 1,
    variables: [
      { name: 'preco_venda', label: 'Preço de venda', description: 'Por quanto você vende' },
      { name: 'custo', label: 'Custo total', description: 'Custo de produção/aquisição' },
    ],
    ranges: [
      { min: -100, max: 0, label: 'Prejuízo', description: 'Atenção! Você está vendendo abaixo do custo. Revise sua precificação.' },
      { min: 0.1, max: 20, label: 'Margem baixa', description: 'Margem apertada. Considere otimizar custos ou aumentar o valor percebido.' },
      { min: 20.1, max: 40, label: 'Margem saudável', description: 'Margem adequada para a maioria dos negócios. Continue monitorando.' },
      { min: 40.1, max: 60, label: 'Margem boa', description: 'Excelente margem! Seu posicionamento de preço está bem calibrado.' },
      { min: 60.1, max: 100, label: 'Margem alta', description: 'Margem premium! Certifique-se de que o valor entregue justifica.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual é o preço de venda do seu produto/serviço?',
        options: [
          { label: 'R$ 50', value: 50 },
          { label: 'R$ 100', value: 100 },
          { label: 'R$ 500', value: 500 },
          { label: 'R$ 1.000', value: 1000 },
          { label: 'R$ 5.000+', value: 5000 },
        ],
      },
      {
        text: 'Qual é o custo total para produzir/adquirir?',
        options: [
          { label: 'R$ 20', value: 20 },
          { label: 'R$ 50', value: 50 },
          { label: 'R$ 200', value: 200 },
          { label: 'R$ 500', value: 500 },
          { label: 'R$ 2.000+', value: 2000 },
        ],
      },
    ],
  },

  {
    id: 'cac',
    name: 'CAC - Custo de Aquisição',
    description: 'Calcula o custo para adquirir cada novo cliente',
    icon: '👥',
    category: 'business',
    formula: '{investimento_marketing} / {clientes_novos}',
    displayFormat: 'currency',
    resultUnit: '',
    decimalPlaces: 2,
    variables: [
      { name: 'investimento_marketing', label: 'Investimento em Marketing', description: 'Valor investido em marketing/vendas' },
      { name: 'clientes_novos', label: 'Clientes novos', description: 'Quantidade de clientes conquistados' },
    ],
    ranges: [
      { min: 0, max: 50, label: 'CAC excelente', description: 'Custo de aquisição muito baixo! Sua estratégia é eficiente.' },
      { min: 50.01, max: 150, label: 'CAC bom', description: 'Custo de aquisição saudável para a maioria dos negócios.' },
      { min: 150.01, max: 300, label: 'CAC moderado', description: 'CAC aceitável, mas há espaço para otimização.' },
      { min: 300.01, max: 500, label: 'CAC alto', description: 'CAC elevado. Analise seus canais e otimize conversões.' },
      { min: 500.01, max: 100000, label: 'CAC crítico', description: 'CAC muito alto! Revise toda sua estratégia de aquisição.' },
    ],
    suggestedQuestions: [
      {
        text: 'Quanto você investiu em marketing/vendas no mês?',
        options: [
          { label: 'R$ 500', value: 500 },
          { label: 'R$ 1.000', value: 1000 },
          { label: 'R$ 5.000', value: 5000 },
          { label: 'R$ 10.000', value: 10000 },
          { label: 'R$ 50.000+', value: 50000 },
        ],
      },
      {
        text: 'Quantos clientes novos você conquistou?',
        options: [
          { label: '5 clientes', value: 5 },
          { label: '10 clientes', value: 10 },
          { label: '25 clientes', value: 25 },
          { label: '50 clientes', value: 50 },
          { label: '100+ clientes', value: 100 },
        ],
      },
    ],
  },

  // === OUTROS ===
  {
    id: 'score-lead',
    name: 'Score de Lead',
    description: 'Calcula uma pontuação de qualificação para leads',
    icon: '⭐',
    category: 'other',
    formula: '({interesse} * 3) + ({budget} * 2) + ({urgencia} * 2) + ({autoridade} * 1)',
    displayFormat: 'custom',
    resultUnit: 'pontos',
    decimalPlaces: 0,
    variables: [
      { name: 'interesse', label: 'Nível de interesse', description: 'Pontuação de 1-10' },
      { name: 'budget', label: 'Budget disponível', description: 'Pontuação de 1-10' },
      { name: 'urgencia', label: 'Urgência', description: 'Pontuação de 1-10' },
      { name: 'autoridade', label: 'Autoridade decisória', description: 'Pontuação de 1-10' },
    ],
    ranges: [
      { min: 0, max: 30, label: 'Lead frio', description: 'Lead com baixo potencial. Nutra com conteúdo antes de abordar.' },
      { min: 31, max: 50, label: 'Lead morno', description: 'Lead com potencial moderado. Continue o relacionamento.' },
      { min: 51, max: 70, label: 'Lead quente', description: 'Lead qualificado! Priorize contato comercial.' },
      { min: 71, max: 80, label: 'Lead muito quente', description: 'Excelente lead! Contate imediatamente.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual o nível de interesse no produto?',
        options: [
          { label: 'Apenas curioso', value: 2 },
          { label: 'Interessado', value: 5 },
          { label: 'Muito interessado', value: 8 },
          { label: 'Preciso urgente', value: 10 },
        ],
      },
      {
        text: 'Tem orçamento disponível?',
        options: [
          { label: 'Sem orçamento', value: 1 },
          { label: 'Orçamento limitado', value: 4 },
          { label: 'Orçamento adequado', value: 7 },
          { label: 'Orçamento flexível', value: 10 },
        ],
      },
      {
        text: 'Qual a urgência da solução?',
        options: [
          { label: 'Sem prazo', value: 2 },
          { label: 'Próximos meses', value: 5 },
          { label: 'Este mês', value: 8 },
          { label: 'Imediato', value: 10 },
        ],
      },
      {
        text: 'Você é o decisor?',
        options: [
          { label: 'Não influencio', value: 2 },
          { label: 'Influenciador', value: 5 },
          { label: 'Co-decisor', value: 8 },
          { label: 'Decisor final', value: 10 },
        ],
      },
    ],
  },

  {
    id: 'nps',
    name: 'Calculadora NPS',
    description: 'Calcula o Net Promoter Score com base nas respostas',
    icon: '📊',
    category: 'other',
    formula: '{promotores} - {detratores}',
    displayFormat: 'custom',
    resultUnit: 'NPS',
    decimalPlaces: 0,
    variables: [
      { name: 'promotores', label: '% Promotores', description: 'Porcentagem de notas 9-10' },
      { name: 'detratores', label: '% Detratores', description: 'Porcentagem de notas 0-6' },
    ],
    ranges: [
      { min: -100, max: 0, label: 'NPS Crítico', description: 'Zona crítica! Há mais detratores que promotores. Ação urgente necessária.' },
      { min: 1, max: 30, label: 'NPS Razoável', description: 'Há espaço para melhorias significativas na experiência do cliente.' },
      { min: 31, max: 50, label: 'NPS Bom', description: 'Resultado positivo! Continue trabalhando para aumentar promotores.' },
      { min: 51, max: 75, label: 'NPS Ótimo', description: 'Excelente! Seus clientes são verdadeiros promotores da marca.' },
      { min: 76, max: 100, label: 'NPS Excepcional', description: 'Classe mundial! Referência em satisfação de clientes.' },
    ],
    suggestedQuestions: [
      {
        text: 'Qual % de clientes deu nota 9-10?',
        options: [
          { label: '10%', value: 10 },
          { label: '30%', value: 30 },
          { label: '50%', value: 50 },
          { label: '70%', value: 70 },
          { label: '90%', value: 90 },
        ],
      },
      {
        text: 'Qual % de clientes deu nota 0-6?',
        options: [
          { label: '5%', value: 5 },
          { label: '15%', value: 15 },
          { label: '30%', value: 30 },
          { label: '50%', value: 50 },
          { label: '70%', value: 70 },
        ],
      },
    ],
  },
];

export const getTemplatesByCategory = () => {
  const categories = {
    health: { label: 'Saúde', icon: '❤️', templates: [] as CalculatorTemplate[] },
    finance: { label: 'Finanças', icon: '💰', templates: [] as CalculatorTemplate[] },
    business: { label: 'Negócios', icon: '💼', templates: [] as CalculatorTemplate[] },
    other: { label: 'Outros', icon: '📊', templates: [] as CalculatorTemplate[] },
  };

  calculatorTemplates.forEach(template => {
    categories[template.category].templates.push(template);
  });

  return categories;
};

export const getTemplateById = (id: string): CalculatorTemplate | undefined => {
  return calculatorTemplates.find(t => t.id === id);
};
