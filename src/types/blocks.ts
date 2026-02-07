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
  | 'socialProof';

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
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface SeparatorBlock extends BaseBlock {
  type: 'separator';
  style?: 'line' | 'dots' | 'dashes' | 'space';
  color?: string;
  thickness?: 'thin' | 'medium' | 'thick';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'uploaded' | 'bunny_stream';
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
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  url: string;
  html?: string;
  provider?: string;
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
}

export interface ProgressBlock extends BaseBlock {
  type: 'progress';
  style?: 'bar' | 'steps' | 'circle' | 'percentage';
  showPercentage?: boolean;
  showCounter?: boolean;
  color?: string;
  height?: 'thin' | 'medium' | 'thick';
  animated?: boolean;
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
  style?: 'default' | 'minimal' | 'bold' | 'card';
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
}

export interface TextInputBlock extends BaseBlock {
  type: 'textInput';
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  required?: boolean;
  validation?: 'none' | 'email' | 'phone' | 'number';
}

export interface NPSBlock extends BaseBlock {
  type: 'nps';
  question: string;
  lowLabel?: string;
  highLabel?: string;
  showLabels?: boolean;
  required?: boolean;
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
}

export interface SocialProofBlock extends BaseBlock {
  type: 'socialProof';
  notifications: {
    name: string;
    action: string;
    time: string;
    avatar?: string;
  }[];
  interval: number; // em segundos
  style?: 'toast' | 'banner' | 'floating';
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showAvatar?: boolean;
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
  | SocialProofBlock;

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
