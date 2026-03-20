import {
  HelpCircle, Type, Minus, Image, Video, Music, Images, Code,
  SlidersHorizontal, MessageSquare, Star, ChevronDown, Columns, Bell,
  MousePointerClick, DollarSign, BarChart3, Loader2, TrendingUp, Timer,
  AlertTriangle, List, Quote, Award, Flag, ClipboardList, Users, GitBranch, ArrowRightLeft
} from "lucide-react";
import type { BlockType } from "@/types/blocks";
import type { LucideIcon } from "lucide-react";

export interface BlockCatalogItem {
  type: BlockType;
  icon: LucideIcon;
  labelKey: string;
  defaultLabel: string;
}

export interface BlockCatalogSection {
  titleKey: string;
  defaultTitle: string;
  items: BlockCatalogItem[];
}

export const blockCatalogSections: BlockCatalogSection[] = [
  {
    titleKey: 'createQuiz.blockEditor.contentBlocks',
    defaultTitle: 'Blocos de Conteúdo',
    items: [
      { type: 'question', icon: HelpCircle, labelKey: 'createQuiz.blocks.question', defaultLabel: 'Pergunta' },
      { type: 'text', icon: Type, labelKey: 'createQuiz.blocks.text', defaultLabel: 'Texto' },
      { type: 'separator', icon: Minus, labelKey: 'createQuiz.blocks.separator', defaultLabel: 'Separador' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.mediaBlocks',
    defaultTitle: 'Mídia',
    items: [
      { type: 'image', icon: Image, labelKey: 'createQuiz.blocks.image', defaultLabel: 'Imagem' },
      { type: 'video', icon: Video, labelKey: 'createQuiz.blocks.video', defaultLabel: 'Vídeo' },
      { type: 'audio', icon: Music, labelKey: 'createQuiz.blocks.audio', defaultLabel: 'Áudio' },
      { type: 'gallery', icon: Images, labelKey: 'createQuiz.blocks.gallery', defaultLabel: 'Galeria' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.advancedBlocks',
    defaultTitle: 'Avançado',
    items: [
      { type: 'embed', icon: Code, labelKey: 'createQuiz.blocks.embed', defaultLabel: 'Conteúdo Incorporado' },
      { type: 'button', icon: MousePointerClick, labelKey: 'createQuiz.blocks.button', defaultLabel: 'Botão' },
      { type: 'price', icon: DollarSign, labelKey: 'createQuiz.blocks.price', defaultLabel: 'Preço' },
      { type: 'metrics', icon: BarChart3, labelKey: 'createQuiz.blocks.metrics', defaultLabel: 'Métricas/Gráfico' },
      { type: 'loading', icon: Loader2, labelKey: 'createQuiz.blocks.loading', defaultLabel: 'Loading/Carregamento' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.dataCapture',
    defaultTitle: 'Captura de Dados',
    items: [
      { type: 'slider', icon: SlidersHorizontal, labelKey: 'createQuiz.blocks.slider', defaultLabel: 'Slider/Range' },
      { type: 'textInput', icon: MessageSquare, labelKey: 'createQuiz.blocks.textInput', defaultLabel: 'Input de Texto' },
      { type: 'nps', icon: Star, labelKey: 'createQuiz.blocks.nps', defaultLabel: 'NPS (Satisfação)' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.presentationBlocks',
    defaultTitle: 'Apresentação',
    items: [
      { type: 'accordion', icon: ChevronDown, labelKey: 'createQuiz.blocks.accordion', defaultLabel: 'Acordeão FAQ' },
      { type: 'comparison', icon: Columns, labelKey: 'createQuiz.blocks.comparison', defaultLabel: 'Comparação' },
      { type: 'socialProof', icon: Bell, labelKey: 'createQuiz.blocks.socialProof', defaultLabel: 'Prova Social' },
      { type: 'testimonial', icon: Star, labelKey: 'createQuiz.blocks.testimonial', defaultLabel: 'Depoimento' },
      { type: 'animatedCounter', icon: SlidersHorizontal, labelKey: 'createQuiz.blocks.animatedCounter', defaultLabel: 'Contador Animado' },
      { type: 'progress', icon: TrendingUp, labelKey: 'createQuiz.blocks.progress', defaultLabel: 'Barra de Progresso' },
      { type: 'countdown', icon: Timer, labelKey: 'createQuiz.blocks.countdown', defaultLabel: 'Countdown/Timer' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.visualBlocks',
    defaultTitle: 'Visual',
    items: [
      { type: 'callout', icon: AlertTriangle, labelKey: 'createQuiz.blocks.callout', defaultLabel: 'Callout/Alerta' },
      { type: 'iconList', icon: List, labelKey: 'createQuiz.blocks.iconList', defaultLabel: 'Lista com Ícones' },
      { type: 'quote', icon: Quote, labelKey: 'createQuiz.blocks.quote', defaultLabel: 'Citação/Destaque' },
      { type: 'badgeRow', icon: Award, labelKey: 'createQuiz.blocks.badgeRow', defaultLabel: 'Selos/Badges' },
      { type: 'banner', icon: Flag, labelKey: 'createQuiz.blocks.banner', defaultLabel: 'Banner/Faixa' },
    ],
  },
  {
    titleKey: 'createQuiz.blockEditor.dynamicBlocks',
    defaultTitle: 'Dinâmico',
    items: [
      { type: 'answerSummary', icon: ClipboardList, labelKey: 'createQuiz.blocks.answerSummary', defaultLabel: 'Resumo de Respostas' },
      { type: 'progressMessage', icon: TrendingUp, labelKey: 'createQuiz.blocks.progressMessage', defaultLabel: 'Mensagem de Progresso' },
      { type: 'avatarGroup', icon: Users, labelKey: 'createQuiz.blocks.avatarGroup', defaultLabel: 'Grupo de Avatares' },
      { type: 'conditionalText', icon: GitBranch, labelKey: 'createQuiz.blocks.conditionalText', defaultLabel: 'Texto Condicional' },
      { type: 'comparisonResult', icon: ArrowRightLeft, labelKey: 'createQuiz.blocks.comparisonResult', defaultLabel: 'Comparação Dinâmica' },
      { type: 'personalizedCTA', icon: MousePointerClick, labelKey: 'createQuiz.blocks.personalizedCTA', defaultLabel: 'CTA Personalizado' },
      { type: 'recommendation', icon: Award, labelKey: 'createQuiz.blocks.recommendation', defaultLabel: 'Recomendação' },
    ],
  },
];
