import {
  HelpCircle, Type, Minus, Image, Video, Music, Images, Code,
  SlidersHorizontal, MessageSquare, Star, ChevronDown, Columns, Bell
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
    ],
  },
];
