// Block system types for quiz questions

export type BlockType = 
  | 'question'
  | 'text'
  | 'separator'
  | 'image'
  | 'video'
  | 'audio'
  | 'gallery'
  | 'embed'
  | 'button'
  | 'price'
  | 'metrics'
  | 'loading'
  | 'progress'
  | 'countdown'
  | 'testimonial'
  | 'slider'
  | 'textInput'
  | 'nps'
  | 'accordion'
  | 'comparison'
  | 'socialProof'
  | 'animatedCounter'
  | 'callout'
  | 'iconList'
  | 'quote'
  | 'badgeRow'
  | 'banner'
  | 'answerSummary'
  | 'progressMessage'
  | 'avatarGroup'
  | 'conditionalText'
  | 'comparisonResult'
  | 'personalizedCTA'
  | 'recommendation'
  | 'calculator';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface QuestionBlock extends BaseBlock {
  type: 'question';
  questionText: string;
  answerFormat: 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text';
  options?: string[];
  scores?: number[]; // Pontuação para cada opção (índice corresponde ao índice de options)
  emojis?: string[]; // Emojis para cada opção (índice corresponde ao índice de options)
  required?: boolean;
  subtitle?: string;
  hint?: string;
  autoAdvance?: boolean;
  nextButtonText?: string; // Texto personalizado do botão "Próxima Pergunta"
  randomizeOptions?: boolean; // ✅ Etapa 2C: Randomizar ordem das opções
  optionImages?: string[]; // ✅ Etapa 2E: Imagem por opção de resposta (cards visuais)
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: 'small' | 'medium' | 'large';
  imageUrl?: string;
  imagePosition?: 'above' | 'below';
  imageSize?: 'small' | 'medium' | 'large' | 'full';
}

export interface SeparatorBlock extends BaseBlock {
  type: 'separator';
  style?: 'line' | 'dots' | 'dashes' | 'space';
  color?: string;
  thickness?: 'thin' | 'medium' | 'thick';
  animateFade?: boolean; // ✅ Etapa 2F: Animação fade-in ao aparecer
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  enableLightbox?: boolean; // ✅ Etapa 2F: Clicar para expandir em tela cheia
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'uploaded' | 'bunny_stream' | 'loom'; // ✅ Etapa 2C: Loom support
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  // Configurações de reprodução
  autoplay?: boolean;           // Iniciar automaticamente
  muted?: boolean;              // Iniciar mutado (necessário para autoplay)
  loop?: boolean;               // Repetir vídeo
  hideControls?: boolean;       // Ocultar controles do player
  hidePlayButton?: boolean;     // Ocultar botão play central
  startTime?: number;           // Iniciar em X segundos
  endTime?: number;             // Parar em X segundos
  playbackSpeed?: number;       // Velocidade padrão (0.5, 0.75, 1, 1.25, 1.5, 2)
  // Legendas e thumbnail
  showCaptions?: boolean;       // Mostrar legendas se disponível
  captionsUrl?: string;         // URL do arquivo VTT de legendas
  thumbnailUrl?: string;        // Thumbnail customizado
  // Layout
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16'; // Aspecto do vídeo
  // Bunny Stream
  bunnyVideoId?: string;        // ID do vídeo no Bunny Stream
}

export interface AudioBlock extends BaseBlock {
  type: 'audio';
  url: string;
  provider?: 'external' | 'uploaded';
  caption?: string;
  autoplay?: boolean;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  images: {
    url: string;
    alt?: string;
    caption?: string;
  }[];
  layout?: 'grid' | 'carousel' | 'masonry';
  enableLightbox?: boolean; // ✅ Etapa 2F: Lightbox ao clicar
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  url: string;
  html?: string;
  provider?: string;
  allowedDomains?: string[]; // ✅ Etapa 2F: Whitelist de domínios permitidos
  showPreview?: boolean; // ✅ Etapa 2F: Preview inline no editor
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  // Ação do botão
  action?: 'link' | 'next_question' | 'go_to_question';
  url?: string; // Usado quando action = 'link'
  targetQuestionIndex?: number; // Usado quando action = 'go_to_question' (1-based para o usuário)
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  openInNewTab?: boolean;
  icon?: string;
  // Personalização dinâmica (unificado do antigo personalizedCTA)
  sourceQuestionId?: string;
  textTemplate?: string;
  conditions?: { answer: string; text: string; url?: string }[];
  fallbackText?: string;
}

export interface PriceBlock extends BaseBlock {
  type: 'price';
  planName: string;
  price: string;
  currency?: string;
  period?: string;
  originalPrice?: string;
  discount?: string;
  features: string[];
  buttonText?: string;
  buttonUrl?: string;
  highlighted?: boolean;
}

export interface MetricsBlock extends BaseBlock {
  type: 'metrics';
  title: string;
  chartType: 'bar' | 'pie' | 'line' | 'donut';
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  showLegend?: boolean;
  showValues?: boolean;
}

export interface LoadingBlock extends BaseBlock {
  type: 'loading';
  duration: number; // em segundos
  message?: string;
  completionMessage?: string;
  spinnerType?: 'spinner' | 'dots' | 'pulse' | 'bars';
  autoAdvance?: boolean;
  showProgress?: boolean;
  loadingMessages?: string[];
  progressColor?: string; // ✅ Etapa 2E: Cor customizável da barra de progresso
  rotateMessages?: boolean; // ✅ Etapa 2E: Mensagens rotativas com fade
}

export interface ProgressBlock extends BaseBlock {
  type: 'progress';
  style?: 'bar' | 'steps' | 'circle' | 'percentage';
  showPercentage?: boolean;
  showCounter?: boolean;
  color?: string;
  height?: 'thin' | 'medium' | 'thick';
  animated?: boolean;
  label?: string;
  colorByRange?: boolean; // ✅ Etapa 2C: Cor por faixa (vermelho→amarelo→verde)
  showCompletionIcon?: boolean; // ✅ Etapa 2C: Ícone de conclusão ao 100%
}

export interface CountdownBlock extends BaseBlock {
  type: 'countdown';
  mode?: 'date' | 'duration';
  targetDate?: string; // ISO string
  duration?: number; // em segundos
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  style?: 'default' | 'minimal' | 'bold' | 'card' | 'flip'; // ✅ Etapa 2F: Flip-clock style
  expiryMessage?: string;
  expiryAction?: 'none' | 'hide' | 'redirect';
  redirectUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TestimonialBlock extends BaseBlock {
  type: 'testimonial';
  quote: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  authorImage?: string;
  rating?: number; // 1-5
  showRating?: boolean;
  style?: 'default' | 'minimal' | 'card' | 'quote';
  primaryColor?: string;
  secondaryColor?: string;
  // ✅ Etapa 2F: Carrossel de depoimentos
  additionalTestimonials?: {
    quote: string;
    authorName: string;
    authorRole?: string;
    authorCompany?: string;
    authorImage?: string;
    rating?: number;
  }[];
  autoSlide?: boolean;
  slideInterval?: number; // em segundos
}

export interface SliderBlock extends BaseBlock {
  type: 'slider';
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue?: number;
  unit?: string;
  showValue?: boolean;
  required?: boolean;
  minLabel?: string;
  maxLabel?: string;
  showDots?: boolean;
  webhookUrl?: string; // ✅ Etapa 4: Webhook ao submeter valor
  webhookOnSubmit?: boolean; // ✅ Etapa 4: Ativar disparo
}

export interface TextInputBlock extends BaseBlock {
  type: 'textInput';
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  required?: boolean;
  validation?: 'none' | 'email' | 'phone' | 'number' | 'cpf' | 'cnpj';
  showValidationFeedback?: boolean;
  useMask?: boolean;
  webhookUrl?: string; // ✅ Etapa 4: Webhook ao submeter valor
  webhookOnSubmit?: boolean; // ✅ Etapa 4: Ativar disparo
}

export interface NPSBlock extends BaseBlock {
  type: 'nps';
  question: string;
  lowLabel?: string;
  highLabel?: string;
  showLabels?: boolean;
  required?: boolean;
  showComment?: boolean;
  commentPlaceholder?: string;
  webhookUrl?: string; // ✅ Etapa 4: Webhook ao submeter nota
  webhookOnSubmit?: boolean; // ✅ Etapa 4: Ativar disparo
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  title: string;
  items: {
    question: string;
    answer: string;
  }[];
  style?: 'default' | 'minimal' | 'bordered';
  allowMultiple?: boolean;
  iconType?: 'chevron' | 'plus'; // ✅ Etapa 2C: Ícone customizável
}

export interface ComparisonBlock extends BaseBlock {
  type: 'comparison';
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  leftStyle?: 'negative' | 'neutral';
  rightStyle?: 'positive' | 'neutral';
  showIcons?: boolean;
  highlightWinner?: 'left' | 'right' | 'none'; // ✅ Etapa 2D: Highlight da coluna vencedora
  itemIcons?: { left?: string; right?: string }; // ✅ Etapa 2D: Ícones customizados por coluna
}

export interface SocialProofBlock extends BaseBlock {
  type: 'socialProof';
  notifications: {
    name: string;
    action: string;
    time: string;
    avatar?: string;
  }[];
  interval: number;
  style?: 'toast' | 'banner' | 'floating';
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showAvatar?: boolean;
}

export interface AnimatedCounterBlock extends BaseBlock {
  type: 'animatedCounter';
  startValue: number;
  endValue: number;
  duration: number;
  prefix?: string;
  suffix?: string;
  easing?: 'linear' | 'easeOut' | 'easeInOut';
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  color?: string;
  label?: string;
  separator?: boolean;
  currencyFormat?: boolean; // ✅ Etapa 2D: Formato de moeda (R$ 1.234,56)
  decimalPlaces?: number; // ✅ Etapa 2D: Casas decimais para moeda
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: 'warning' | 'info' | 'success' | 'error';
  title: string;
  items: string[];
  footnote?: string;
  icon?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  dismissible?: boolean; // ✅ Etapa 2D: Callout dismissível
}

export interface IconListBlock extends BaseBlock {
  type: 'iconList';
  items: { icon: string; text: string; color?: string }[]; // ✅ Etapa 2D: Cor individual por item
  iconColor?: string;
  layout?: 'vertical' | 'horizontal';
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  author?: string;
  borderColor?: string;
  style?: 'default' | 'large' | 'minimal';
  backgroundImageUrl?: string; // ✅ Etapa 2D: Imagem de fundo opcional
}

export interface BadgeRowBlock extends BaseBlock {
  type: 'badgeRow';
  badges: { icon: string; text: string; tooltip?: string; color?: string }[]; // ✅ Etapa 2C: Tooltip + cor individual
  variant?: 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export interface BannerBlock extends BaseBlock {
  type: 'banner';
  text: string;
  variant?: 'warning' | 'success' | 'info' | 'promo';
  icon?: string;
  dismissible?: boolean;
  linkUrl?: string; // ✅ Etapa 2D: Link clicável
  linkTarget?: '_blank' | '_self'; // ✅ Etapa 2D: Abrir em nova aba
}

export interface AnswerSummaryBlock extends BaseBlock {
  type: 'answerSummary';
  title?: string;
  subtitle?: string;
  style?: 'card' | 'list' | 'minimal';
  showQuestionText?: boolean;
  showIcon?: boolean;
  accentColor?: string;
  selectedQuestionIds?: string[];
  showCopyButton?: boolean; // ✅ Etapa 2E: Botão copiar respostas como texto
}

export interface ProgressMessageBlock extends BaseBlock {
  type: 'progressMessage';
  messages: { threshold: number; text: string; icon?: string }[]; // ✅ Etapa 2D: Ícone por faixa
  style?: 'card' | 'inline' | 'toast';
  icon?: string;
  accentColor?: string;
  animateFade?: boolean; // ✅ Etapa 2D: Animação fade entre mensagens
}

export interface AvatarGroupBlock extends BaseBlock {
  type: 'avatarGroup';
  count: number;
  label?: string;
  maxVisible?: number;
  showCount?: boolean;
  avatarStyle?: 'circle' | 'square';
  profileUrl?: string; // ✅ Etapa 2D: Link para perfil ao clicar
}

export interface ConditionalTextBlock extends BaseBlock {
  type: 'conditionalText';
  sourceQuestionId?: string;
  conditions: { answer: string; text: string }[];
  fallbackText?: string;
  style?: 'default' | 'highlighted' | 'card';
}

export interface ComparisonResultBlock extends BaseBlock {
  type: 'comparisonResult';
  sourceQuestionIds?: string[];
  beforeTitle?: string;
  afterTitle?: string;
  beforeTemplate?: string;
  afterTemplate?: string;
  beforeItems?: string[];
  afterItems?: string[];
  showIcons?: boolean;
  beforeColor?: string; // ✅ Etapa 2D: Cor configurável coluna antes
  afterColor?: string; // ✅ Etapa 2D: Cor configurável coluna depois
  beforeIcon?: string; // ✅ Etapa 2D: Ícone personalizado antes
  afterIcon?: string; // ✅ Etapa 2D: Ícone personalizado depois
}

export interface PersonalizedCTABlock extends BaseBlock {
  type: 'personalizedCTA';
  sourceQuestionId?: string;
  textTemplate: string;
  url?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  openInNewTab?: boolean;
  conditions?: { answer: string; text: string; url?: string }[];
  fallbackText?: string;
}

export interface RecommendationBlock extends BaseBlock {
  type: 'recommendation';
  title?: string;
  subtitle?: string;
  recommendations: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    badge?: string;
    rules: {
      questionId: string;
      answers: string[];
      weight: number;
    }[];
  }[];
  displayMode?: 'best_match' | 'top_3' | 'all_scored';
  style?: 'card' | 'list' | 'grid';
  showScore?: boolean;
  fallbackText?: string;
  maxDisplay?: number; // ✅ Etapa 2D: Limite máximo de exibição
}

export interface CalculatorBlock extends BaseBlock {
  type: 'calculator';
  formula: string;
  variables: {
    id: string;
    name: string;
    sourceQuestionId?: string;
    defaultValue?: number;
  }[];
  resultUnit?: string;
  resultPrefix?: string;
  decimalPlaces?: number;
  resultLabel?: string;
  ranges?: {
    min: number;
    max: number;
    label: string;
    color?: string;
  }[];
  formulaTemplate?: string; // ✅ Etapa 2F: Template de fórmula pré-configurada
  showGauge?: boolean; // ✅ Etapa 2F: Exibir resultado como gauge visual
}

export type QuizBlock =
  | QuestionBlock
  | TextBlock
  | SeparatorBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | GalleryBlock
  | EmbedBlock
  | ButtonBlock
  | PriceBlock
  | MetricsBlock
  | LoadingBlock
  | ProgressBlock
  | CountdownBlock
  | TestimonialBlock
  | SliderBlock
  | TextInputBlock
  | NPSBlock
  | AccordionBlock
  | ComparisonBlock
  | SocialProofBlock
  | AnimatedCounterBlock
  | CalloutBlock
  | IconListBlock
  | QuoteBlock
  | BadgeRowBlock
  | BannerBlock
  | AnswerSummaryBlock
  | ProgressMessageBlock
  | AvatarGroupBlock
  | ConditionalTextBlock
  | ComparisonResultBlock
  | PersonalizedCTABlock
  | RecommendationBlock
  | CalculatorBlock;

// Helper function to create a new block
export const createBlock = (type: BlockType, order: number): QuizBlock => {
  const baseBlock = {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    order,
  };

  switch (type) {
    case 'question':
      return {
        ...baseBlock,
        type: 'question',
        questionText: '',
        answerFormat: 'single_choice',
        options: ['', ''],
        scores: [0, 0],
        emojis: ['', ''],
        required: true,
      } as QuestionBlock;
    
    case 'text':
      return {
        ...baseBlock,
        type: 'text',
        content: '',
        alignment: 'left',
        fontSize: 'medium',
      } as TextBlock;
    
    case 'separator':
      return {
        ...baseBlock,
        type: 'separator',
        style: 'line',
        thickness: 'medium',
      } as SeparatorBlock;
    
    case 'image':
      return {
        ...baseBlock,
        type: 'image',
        url: '',
        size: 'medium',
      } as ImageBlock;
    
    case 'video':
      return {
        ...baseBlock,
        type: 'video',
        url: '',
        provider: 'youtube',
        size: 'medium',
        autoplay: false,
        muted: false,
        loop: false,
        hideControls: false,
        hidePlayButton: false,
        playbackSpeed: 1,
        aspectRatio: '16:9',
        showCaptions: true,
      } as VideoBlock;
    
    case 'audio':
      return {
        ...baseBlock,
        type: 'audio',
        url: '',
        autoplay: false,
      } as AudioBlock;
    
    case 'gallery':
      return {
        ...baseBlock,
        type: 'gallery',
        images: [],
        layout: 'grid',
      } as GalleryBlock;
    
    case 'embed':
      return {
        ...baseBlock,
        type: 'embed',
        url: '',
      } as EmbedBlock;
    
    case 'button':
      return {
        ...baseBlock,
        type: 'button',
        text: 'Clique aqui',
        action: 'link',
        variant: 'default',
        size: 'default',
        openInNewTab: false,
      } as ButtonBlock;
    
    case 'price':
      return {
        ...baseBlock,
        type: 'price',
        planName: 'Plano Premium',
        price: '99,90',
        currency: 'R$',
        period: '/mês',
        features: ['Recurso 1', 'Recurso 2', 'Recurso 3'],
        buttonText: 'Assinar agora',
        highlighted: false,
      } as PriceBlock;
    
    case 'metrics':
      return {
        ...baseBlock,
        type: 'metrics',
        title: 'Estatísticas',
        chartType: 'bar',
        data: [
          { label: 'Item A', value: 30, color: '#3b82f6' },
          { label: 'Item B', value: 45, color: '#10b981' },
          { label: 'Item C', value: 25, color: '#f59e0b' },
        ],
        showLegend: true,
        showValues: true,
      } as MetricsBlock;
    
    case 'loading':
      return {
        ...baseBlock,
        type: 'loading',
        duration: 3,
        message: 'Carregando...',
        spinnerType: 'spinner',
        autoAdvance: true,
      } as LoadingBlock;
    
    case 'progress':
      return {
        ...baseBlock,
        type: 'progress',
        style: 'bar',
        showPercentage: true,
        showCounter: false,
        color: '#3b82f6',
        height: 'medium',
        animated: true,
      } as ProgressBlock;
    
    case 'countdown':
      return {
        ...baseBlock,
        type: 'countdown',
        mode: 'duration',
        duration: 300,
        showDays: false,
        showHours: true,
        showMinutes: true,
        showSeconds: true,
        style: 'default',
        expiryMessage: 'Oferta expirada!',
        expiryAction: 'none',
        primaryColor: '#ef4444',
        secondaryColor: '#fef2f2',
      } as CountdownBlock;
    
    case 'testimonial':
      return {
        ...baseBlock,
        type: 'testimonial',
        quote: 'Este produto mudou minha vida!',
        authorName: 'João Silva',
        authorRole: 'CEO',
        authorCompany: 'Empresa XYZ',
        rating: 5,
        showRating: true,
        style: 'default',
        primaryColor: '#3b82f6',
        secondaryColor: '#f3f4f6',
      } as TestimonialBlock;
    
    case 'slider':
      return {
        ...baseBlock,
        type: 'slider',
        label: 'Selecione um valor',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        unit: '',
        showValue: true,
        required: true,
      } as SliderBlock;
    
    case 'textInput':
      return {
        ...baseBlock,
        type: 'textInput',
        label: 'Digite sua resposta',
        placeholder: 'Sua resposta aqui...',
        multiline: false,
        maxLength: 500,
        required: true,
        validation: 'none',
      } as TextInputBlock;
    
    case 'nps':
      return {
        ...baseBlock,
        type: 'nps',
        question: 'De 0 a 10, qual a probabilidade de você recomendar nosso produto?',
        lowLabel: 'Pouco provável',
        highLabel: 'Muito provável',
        showLabels: true,
        required: true,
      } as NPSBlock;
    
    case 'accordion':
      return {
        ...baseBlock,
        type: 'accordion',
        title: 'Perguntas Frequentes',
        items: [
          { question: 'Como funciona?', answer: 'Explicação detalhada aqui...' },
          { question: 'Quanto custa?', answer: 'Detalhes sobre preços...' },
        ],
        style: 'default',
        allowMultiple: false,
      } as AccordionBlock;
    
    case 'comparison':
      return {
        ...baseBlock,
        type: 'comparison',
        leftTitle: 'Antes',
        rightTitle: 'Depois',
        leftItems: ['Problema 1', 'Problema 2', 'Problema 3'],
        rightItems: ['Solução 1', 'Solução 2', 'Solução 3'],
        leftStyle: 'negative',
        rightStyle: 'positive',
        showIcons: true,
      } as ComparisonBlock;
    
    case 'socialProof':
      return {
        ...baseBlock,
        type: 'socialProof',
        notifications: [
          { name: 'João Silva', action: 'acabou de completar o quiz', time: 'agora' },
          { name: 'Maria Santos', action: 'acabou de se inscrever', time: '2 min atrás' },
          { name: 'Pedro Costa', action: 'acabou de comprar', time: '5 min atrás' },
        ],
        interval: 5,
        style: 'toast',
        position: 'bottom-left',
        showAvatar: true,
      } as SocialProofBlock;

    case 'animatedCounter':
      return {
        ...baseBlock,
        type: 'animatedCounter',
        startValue: 0,
        endValue: 1000,
        duration: 2,
        prefix: '',
        suffix: '+',
        easing: 'easeOut',
        fontSize: 'large',
        label: 'Clientes satisfeitos',
        separator: true,
      } as AnimatedCounterBlock;
    
    case 'callout':
      return {
        ...baseBlock,
        type: 'callout',
        variant: 'warning',
        title: 'Atenção',
        items: ['Item importante 1', 'Item importante 2'],
        footnote: '',
      } as CalloutBlock;

    case 'iconList':
      return {
        ...baseBlock,
        type: 'iconList',
        items: [
          { icon: '✅', text: 'Benefício 1' },
          { icon: '✅', text: 'Benefício 2' },
          { icon: '✅', text: 'Benefício 3' },
        ],
        layout: 'vertical',
      } as IconListBlock;

    case 'quote':
      return {
        ...baseBlock,
        type: 'quote',
        text: 'Uma citação inspiradora ou destaque importante.',
        author: '',
        style: 'default',
      } as QuoteBlock;

    case 'badgeRow':
      return {
        ...baseBlock,
        type: 'badgeRow',
        badges: [
          { icon: '🔒', text: 'Seguro' },
          { icon: '⚡', text: 'Rápido' },
          { icon: '✅', text: 'Garantido' },
        ],
        variant: 'outline',
        size: 'md',
      } as BadgeRowBlock;

    case 'banner':
      return {
        ...baseBlock,
        type: 'banner',
        text: '🔥 Oferta por tempo limitado!',
        variant: 'promo',
        dismissible: false,
      } as BannerBlock;

    case 'answerSummary':
      return {
        ...baseBlock,
        type: 'answerSummary',
        title: '📋 Resumo das suas respostas',
        subtitle: 'De acordo com suas respostas, preparamos algo personalizado para você!',
        style: 'card',
        showQuestionText: true,
        showIcon: true,
      } as AnswerSummaryBlock;

    case 'progressMessage':
      return {
        ...baseBlock,
        type: 'progressMessage',
        messages: [
          { threshold: 25, text: '🚀 Ótimo começo! Continue assim.' },
          { threshold: 50, text: '💪 Você já está na metade! Falta pouco.' },
          { threshold: 75, text: '🔥 Quase lá! Só mais algumas perguntas.' },
          { threshold: 100, text: '🎉 Parabéns! Você completou tudo!' },
        ],
        style: 'card',
        icon: '💬',
      } as ProgressMessageBlock;

    case 'avatarGroup':
      return {
        ...baseBlock,
        type: 'avatarGroup',
        count: 1234,
        label: 'pessoas já fizeram este quiz',
        maxVisible: 5,
        showCount: true,
        avatarStyle: 'circle',
      } as AvatarGroupBlock;

    case 'conditionalText':
      return {
        ...baseBlock,
        type: 'conditionalText',
        conditions: [
          { answer: 'Opção A', text: 'Texto quando o usuário escolher Opção A' },
          { answer: 'Opção B', text: 'Texto quando o usuário escolher Opção B' },
        ],
        fallbackText: 'Texto padrão quando nenhuma condição corresponder.',
        style: 'default',
      } as ConditionalTextBlock;

    case 'comparisonResult':
      return {
        ...baseBlock,
        type: 'comparisonResult',
        beforeTitle: 'Sem nosso produto',
        afterTitle: 'Com nosso produto',
        beforeItems: ['Problema 1', 'Problema 2', 'Problema 3'],
        afterItems: ['Solução personalizada 1', 'Solução personalizada 2', 'Solução personalizada 3'],
        showIcons: true,
      } as ComparisonResultBlock;

    case 'personalizedCTA':
      return {
        ...baseBlock,
        type: 'personalizedCTA',
        textTemplate: 'Ver plano para {resposta}',
        url: '',
        variant: 'default',
        size: 'lg',
        openInNewTab: false,
        fallbackText: 'Ver plano personalizado',
        conditions: [],
      } as PersonalizedCTABlock;

    case 'recommendation':
      return {
        ...baseBlock,
        type: 'recommendation',
        title: '🎯 Recomendação para você',
        subtitle: 'Baseado nas suas respostas, recomendamos:',
        recommendations: [
          {
            id: `rec-${Date.now()}-1`,
            name: 'Produto Recomendado',
            description: 'A melhor opção para o seu perfil.',
            buttonText: 'Saiba mais',
            buttonUrl: '',
            badge: '⭐ Top Pick',
            rules: [],
          },
        ],
        displayMode: 'best_match',
        style: 'card',
        showScore: false,
        fallbackText: 'Não encontramos uma recomendação específica para você.',
      } as RecommendationBlock;

    case 'calculator':
      return {
        ...baseBlock,
        type: 'calculator',
        formula: '',
        variables: [],
        resultUnit: '',
        resultPrefix: '',
        decimalPlaces: 2,
        resultLabel: 'Resultado',
        ranges: [],
      } as CalculatorBlock;
    
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

// Helper to migrate old question format to blocks
export const migrateQuestionToBlocks = (
  questionText: string,
  answerFormat: string,
  options: any,
  mediaUrl?: string,
  mediaType?: string
): QuizBlock[] => {
  const blocks: QuizBlock[] = [];
  let order = 0;

  // Add media block if exists
  if (mediaUrl && mediaType) {
    if (mediaType === 'image') {
      blocks.push({
        id: `block-migrated-${Date.now()}-${order}`,
        type: 'image',
        order: order++,
        url: mediaUrl,
        size: 'medium',
      } as ImageBlock);
    } else if (mediaType === 'video') {
      blocks.push({
        id: `block-migrated-${Date.now()}-${order}`,
        type: 'video',
        order: order++,
        url: mediaUrl,
        provider: 'youtube',
      } as VideoBlock);
    }
  }

  // Add question block
  blocks.push({
    id: `block-migrated-${Date.now()}-${order}`,
    type: 'question',
    order: order++,
    questionText,
    answerFormat: answerFormat as any,
    options: Array.isArray(options) ? options : [],
    required: true,
  } as QuestionBlock);

  return blocks;
};

/** Normaliza uma opção que pode ser string ou objeto {text, score} para string */
export const normalizeOption = (option: unknown): string => {
  if (typeof option === 'string') return option;
  if (option && typeof option === 'object' && 'text' in option) return String((option as any).text);
  return String(option ?? '');
};

/**
 * Normaliza um bloco garantindo que todos os campos obrigatórios existam
 * com valores padrão seguros. Previne crashes por dados legados/malformados.
 */
export const normalizeBlock = (block: QuizBlock): QuizBlock => {
  if (!block || !block.type) return block;

  switch (block.type) {
    case 'question':
      return {
        ...block,
        questionText: block.questionText || '',
        answerFormat: block.answerFormat || 'single_choice',
        options: Array.isArray(block.options) ? block.options : ['', ''],
        scores: Array.isArray(block.scores) ? block.scores : [0, 0],
        emojis: Array.isArray(block.emojis) ? block.emojis : ['', ''],
      };
    case 'text':
      return { ...block, content: block.content || '', alignment: block.alignment || 'left', fontSize: block.fontSize || 'medium' };
    case 'separator':
      return { ...block, style: block.style || 'line', thickness: block.thickness || 'medium' };
    case 'image':
      return { ...block, url: block.url || '', size: block.size || 'medium' };
    case 'video':
      return { ...block, url: block.url || '', provider: block.provider || 'youtube', size: block.size || 'medium', aspectRatio: block.aspectRatio || '16:9' };
    case 'audio':
      return { ...block, url: block.url || '' };
    case 'gallery':
      return { ...block, images: Array.isArray(block.images) ? block.images : [], layout: block.layout || 'grid' };
    case 'embed':
      return { ...block, url: block.url || '' };
    case 'button':
      return { ...block, text: block.text || 'Clique aqui', action: block.action || 'link', variant: block.variant || 'default', size: block.size || 'default' };
    case 'price':
      return { ...block, planName: block.planName || 'Plano', price: block.price || '0', features: Array.isArray(block.features) ? block.features : ['Recurso 1'] };
    case 'metrics':
      return { ...block, title: block.title || 'Métricas', chartType: block.chartType || 'bar', data: Array.isArray(block.data) ? block.data : [] };
    case 'loading':
      return { ...block, duration: block.duration || 3, spinnerType: block.spinnerType || 'spinner' };
    case 'progress':
      return { ...block, style: block.style || 'bar', height: block.height || 'medium' };
    case 'countdown':
      return { ...block, mode: block.mode || 'duration', duration: block.duration || 300, style: block.style || 'default' };
    case 'testimonial':
      return { ...block, quote: block.quote || '', authorName: block.authorName || '', style: block.style || 'default' };
    case 'slider':
      return { ...block, label: block.label || '', min: block.min ?? 0, max: block.max ?? 100, step: block.step || 1 };
    case 'textInput':
      return { ...block, label: block.label || '', placeholder: block.placeholder || '' };
    case 'nps':
      return { ...block, question: block.question || '' };
    case 'accordion':
      return {
        ...block,
        title: block.title || 'FAQ',
        items: Array.isArray(block.items) && block.items.length > 0
          ? block.items
          : [{ question: 'Nova pergunta', answer: 'Resposta...' }],
        style: block.style || 'default',
      };
    case 'comparison':
      return {
        ...block,
        leftTitle: block.leftTitle || 'Antes',
        rightTitle: block.rightTitle || 'Depois',
        leftItems: Array.isArray(block.leftItems) && block.leftItems.length > 0 ? block.leftItems : ['Item 1'],
        rightItems: Array.isArray(block.rightItems) && block.rightItems.length > 0 ? block.rightItems : ['Item 1'],
      };
    case 'socialProof':
      return {
        ...block,
        notifications: Array.isArray(block.notifications) && block.notifications.length > 0
          ? block.notifications
          : [{ name: 'Cliente', action: 'acabou de comprar', time: 'agora' }],
        interval: block.interval || 5,
      };
    case 'animatedCounter':
      return {
        ...block,
        startValue: block.startValue ?? 0,
        endValue: block.endValue ?? 1000,
        duration: block.duration || 2,
        fontSize: block.fontSize || 'large',
        easing: block.easing || 'easeOut',
      };
    case 'callout':
      return {
        ...block,
        variant: block.variant || 'warning',
        title: block.title || 'Atenção',
        items: Array.isArray(block.items) ? block.items : [],
      };
    case 'iconList':
      return {
        ...block,
        items: Array.isArray(block.items) ? block.items : [],
        layout: block.layout || 'vertical',
      };
    case 'quote':
      return {
        ...block,
        text: block.text || '',
        style: block.style || 'default',
      };
    case 'badgeRow':
      return {
        ...block,
        badges: Array.isArray(block.badges) ? block.badges : [],
        variant: block.variant || 'outline',
        size: block.size || 'md',
      };
    case 'banner':
      return {
        ...block,
        text: block.text || '',
        variant: block.variant || 'promo',
      };
    case 'answerSummary':
      return {
        ...block,
        title: block.title || '📋 Resumo das suas respostas',
        style: block.style || 'card',
        showQuestionText: block.showQuestionText !== false,
        showIcon: block.showIcon !== false,
      };
    case 'progressMessage':
      return {
        ...block,
        messages: Array.isArray(block.messages) && block.messages.length > 0
          ? block.messages
          : [{ threshold: 50, text: 'Você está indo bem!' }],
        style: block.style || 'card',
      };
    case 'avatarGroup':
      return {
        ...block,
        count: block.count ?? 1234,
        label: block.label || 'pessoas já fizeram este quiz',
        maxVisible: block.maxVisible ?? 5,
        showCount: block.showCount !== false,
        avatarStyle: block.avatarStyle || 'circle',
      };
    case 'conditionalText':
      return {
        ...block,
        conditions: Array.isArray(block.conditions) ? block.conditions : [],
        fallbackText: block.fallbackText || '',
        style: block.style || 'default',
      };
    case 'comparisonResult':
      return {
        ...block,
        beforeTitle: block.beforeTitle || 'Antes',
        afterTitle: block.afterTitle || 'Depois',
        beforeItems: Array.isArray(block.beforeItems) ? block.beforeItems : ['Item 1'],
        afterItems: Array.isArray(block.afterItems) ? block.afterItems : ['Item 1'],
        showIcons: block.showIcons !== false,
      };
    case 'personalizedCTA':
      return {
        ...block,
        textTemplate: block.textTemplate || 'Clique aqui',
        variant: block.variant || 'default',
        size: block.size || 'lg',
        conditions: Array.isArray(block.conditions) ? block.conditions : [],
        fallbackText: block.fallbackText || 'Ver mais',
      };
    case 'recommendation':
      return {
        ...block,
        title: block.title || '🎯 Recomendação',
        recommendations: Array.isArray(block.recommendations) ? block.recommendations : [],
        displayMode: block.displayMode || 'best_match',
        style: block.style || 'card',
        showScore: block.showScore || false,
        fallbackText: block.fallbackText || 'Nenhuma recomendação encontrada.',
      };
    case 'calculator':
      return {
        ...block,
        formula: block.formula || '',
        variables: Array.isArray(block.variables) ? block.variables : [],
        resultUnit: block.resultUnit || '',
        decimalPlaces: block.decimalPlaces ?? 2,
        resultLabel: block.resultLabel || 'Resultado',
        ranges: Array.isArray(block.ranges) ? block.ranges : [],
      };
    default:
      return block;
  }
};
