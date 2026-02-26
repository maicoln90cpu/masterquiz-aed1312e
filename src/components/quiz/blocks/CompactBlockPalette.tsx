import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  HelpCircle,
  Type,
  Minus,
  Image as ImageIcon,
  Video,
  Music,
  Images,
  Code,
  ChevronDown,
  ChevronUp,
  FileTextIcon,
  VideoIcon,
  ListIcon,
  ImagePlusIcon,
  MessageSquareIcon,
  BarChart3,
  Loader2,
  Timer,
  Star,
  TrendingUp,
  Columns,
  Bell,
} from "lucide-react";
import type { QuizBlock, BlockType } from "@/types/blocks";
import { createBlock } from "@/types/blocks";

interface CompactBlockPaletteProps {
  onAddBlock: (blockType: BlockType) => void;
  onAddTemplate: (blocks: QuizBlock[]) => void;
  currentBlockOrder: number;
}

// Componente de preview visual do template
const TemplatePreview = ({ blocks }: { blocks: QuizBlock[] }) => {
  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case 'question': return <HelpCircle className="h-3 w-3" />;
      case 'text': return <Type className="h-3 w-3" />;
      case 'separator': return <Minus className="h-3 w-3" />;
      case 'image': return <ImageIcon className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'audio': return <Music className="h-3 w-3" />;
      case 'gallery': return <Images className="h-3 w-3" />;
      case 'embed': return <Code className="h-3 w-3" />;
      case 'button': return <MessageSquareIcon className="h-3 w-3" />;
      case 'price': return <FileTextIcon className="h-3 w-3" />;
      case 'metrics': return <BarChart3 className="h-3 w-3" />;
      case 'loading': return <Loader2 className="h-3 w-3" />;
      case 'progress': return <TrendingUp className="h-3 w-3" />;
      case 'countdown': return <Timer className="h-3 w-3" />;
      case 'testimonial': return <Star className="h-3 w-3" />;
      case 'slider': return <TrendingUp className="h-3 w-3" />;
      case 'textInput': return <Type className="h-3 w-3" />;
      case 'nps': return <Star className="h-3 w-3" />;
      case 'accordion': return <ChevronDown className="h-3 w-3" />;
      case 'comparison': return <Columns className="h-3 w-3" />;
      case 'socialProof': return <Bell className="h-3 w-3" />;
      case 'animatedCounter': return <TrendingUp className="h-3 w-3" />;
    }
  };

  const getBlockLabel = (type: BlockType) => {
    const labels: Record<BlockType, string> = {
      question: 'Pergunta',
      text: 'Texto',
      separator: 'Separador',
      image: 'Imagem',
      video: 'Vídeo',
      audio: 'Áudio',
      gallery: 'Galeria',
      embed: 'Embed',
      button: 'Botão',
      price: 'Preço',
      metrics: 'Métricas',
      loading: 'Loading',
      progress: 'Progresso',
      countdown: 'Countdown',
      testimonial: 'Depoimento',
      slider: 'Slider/Range',
      textInput: 'Input de Texto',
      nps: 'NPS',
      accordion: 'Acordeão FAQ',
      comparison: 'Comparação',
      socialProof: 'Prova Social',
      animatedCounter: 'Contador Animado'
    };
    return labels[type];
  };

  return (
    <div className="space-y-2 p-3 bg-background rounded-lg border w-[280px]">
      <div className="text-xs font-semibold text-muted-foreground mb-3">Preview do Template:</div>
      {blocks.map((block, index) => (
        <div 
          key={index}
          className="flex items-center gap-2 p-2 rounded bg-muted/50 border border-border"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
            {getBlockIcon(block.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{getBlockLabel(block.type)}</div>
            <div className="text-[10px] text-muted-foreground">
              {block.type === 'question' ? 'Múltipla escolha' : 'Conteúdo editável'}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">#{index + 1}</div>
        </div>
      ))}
      <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
        {blocks.length} bloco{blocks.length !== 1 ? 's' : ''} neste template
      </div>
    </div>
  );
};

export const CompactBlockPalette = ({
  onAddBlock,
  onAddTemplate,
  currentBlockOrder,
}: CompactBlockPaletteProps) => {
  const { t } = useTranslation();
  const [templatesExpanded, setTemplatesExpanded] = useState(true);

  const blockTypes = [
    { type: "question" as BlockType, icon: HelpCircle, name: t('createQuiz.blockPalette.blocks.question'), tooltip: t('createQuiz.blockPalette.tooltips.question') },
    { type: "text" as BlockType, icon: Type, name: t('createQuiz.blockPalette.blocks.text'), tooltip: t('createQuiz.blockPalette.tooltips.text') },
    { type: "separator" as BlockType, icon: Minus, name: t('createQuiz.blockPalette.blocks.separator'), tooltip: t('createQuiz.blockPalette.tooltips.separator') },
    { type: "image" as BlockType, icon: ImageIcon, name: t('createQuiz.blockPalette.blocks.image'), tooltip: t('createQuiz.blockPalette.tooltips.image') },
    { type: "video" as BlockType, icon: Video, name: t('createQuiz.blockPalette.blocks.video'), tooltip: t('createQuiz.blockPalette.tooltips.video') },
    { type: "audio" as BlockType, icon: Music, name: t('createQuiz.blockPalette.blocks.audio'), tooltip: t('createQuiz.blockPalette.tooltips.audio') },
    { type: "gallery" as BlockType, icon: Images, name: t('createQuiz.blockPalette.blocks.gallery'), tooltip: t('createQuiz.blockPalette.tooltips.gallery') },
    { type: "embed" as BlockType, icon: Code, name: t('createQuiz.blockPalette.blocks.embed'), tooltip: t('createQuiz.blockPalette.tooltips.embed') },
    { type: "button" as BlockType, icon: MessageSquareIcon, name: "Botão", tooltip: "Adiciona um botão clicável" },
    { type: "price" as BlockType, icon: FileTextIcon, name: "Preço", tooltip: "Adiciona uma tabela de preços" },
    { type: "metrics" as BlockType, icon: BarChart3, name: "Métricas", tooltip: "Adiciona gráficos editáveis" },
    { type: "loading" as BlockType, icon: Loader2, name: "Loading", tooltip: "Tela de carregamento configurável" },
    // Blocos de engajamento
    { type: "progress" as BlockType, icon: TrendingUp, name: "Progresso", tooltip: "Barra de progresso do quiz" },
    { type: "countdown" as BlockType, icon: Timer, name: "Countdown", tooltip: "Temporizador de urgência" },
    { type: "testimonial" as BlockType, icon: Star, name: "Depoimento", tooltip: "Adiciona depoimentos de clientes" },
    // Blocos de captura de dados
    { type: "slider" as BlockType, icon: TrendingUp, name: "Slider/Range", tooltip: "Captura valores numéricos com slider" },
    { type: "textInput" as BlockType, icon: Type, name: "Input de Texto", tooltip: "Captura respostas abertas" },
    { type: "nps" as BlockType, icon: Star, name: "NPS", tooltip: "Pesquisa de satisfação 0-10" },
    // Blocos de apresentação
    { type: "accordion" as BlockType, icon: ChevronDown, name: "Acordeão FAQ", tooltip: "FAQ expansível" },
    { type: "comparison" as BlockType, icon: Columns, name: "Comparação", tooltip: "Antes vs Depois, A vs B" },
    { type: "socialProof" as BlockType, icon: Bell, name: "Prova Social", tooltip: "Notificações animadas" },
  ];

  const templates = [
    {
      id: "question-image",
      name: t('createQuiz.blockPalette.templates.questionImage'),
      description: "Imagem + Pergunta", // Corrigido: ordem real dos blocos
      icon: ImageIcon,
      blocks: () => {
        const image = createBlock("image", currentBlockOrder);
        const question = createBlock("question", currentBlockOrder + 1);
        return [image, question];
      },
    },
    {
      id: "question-video",
      name: t('createQuiz.blockPalette.templates.questionVideo'),
      description: t('createQuiz.blockPalette.templates.questionVideoDesc'),
      icon: VideoIcon,
      blocks: () => {
        const video = createBlock("video", currentBlockOrder);
        const question = createBlock("question", currentBlockOrder + 1);
        return [video, question];
      },
    },
    {
      id: "intro-question",
      name: t('createQuiz.blockPalette.templates.introQuestion'),
      description: t('createQuiz.blockPalette.templates.introQuestionDesc'),
      icon: FileTextIcon,
      blocks: () => {
        const text = createBlock("text", currentBlockOrder);
        const separator = createBlock("separator", currentBlockOrder + 1);
        const question = createBlock("question", currentBlockOrder + 2);
        return [text, separator, question];
      },
    },
    {
      id: "gallery-description",
      name: t('createQuiz.blockPalette.templates.galleryDesc'),
      description: t('createQuiz.blockPalette.templates.galleryDescDesc'),
      icon: ImagePlusIcon,
      blocks: () => {
        const text = createBlock("text", currentBlockOrder);
        const gallery = createBlock("gallery", currentBlockOrder + 1);
        const question = createBlock("question", currentBlockOrder + 2);
        return [text, gallery, question];
      },
    },
    {
      id: "multi-media",
      name: t('createQuiz.blockPalette.templates.multiMedia'),
      description: t('createQuiz.blockPalette.templates.multiMediaDesc'),
      icon: ListIcon,
      blocks: () => {
        const text = createBlock("text", currentBlockOrder);
        const image = createBlock("image", currentBlockOrder + 1);
        const video = createBlock("video", currentBlockOrder + 2);
        const separator = createBlock("separator", currentBlockOrder + 3);
        const question = createBlock("question", currentBlockOrder + 4);
        return [text, image, video, separator, question];
      },
    },
    {
      id: "question-explanation",
      name: t('createQuiz.blockPalette.templates.questionExplanation'),
      description: t('createQuiz.blockPalette.templates.questionExplanationDesc'),
      icon: MessageSquareIcon,
      blocks: () => {
        const question = createBlock("question", currentBlockOrder);
        const text = createBlock("text", currentBlockOrder + 1);
        const separator = createBlock("separator", currentBlockOrder + 2);
        return [question, text, separator];
      },
    },
    // 4 templates novos sincronizados do BlockTemplates.tsx
    {
      id: "testimonial-question",
      name: "Pergunta com Depoimento",
      description: "Depoimento + Separador + Pergunta",
      icon: Star,
      blocks: () => {
        const testimonial = createBlock("testimonial", currentBlockOrder);
        const separator = createBlock("separator", currentBlockOrder + 1);
        const question = createBlock("question", currentBlockOrder + 2);
        return [testimonial, separator, question];
      },
    },
    {
      id: "offer-urgency",
      name: "Oferta com Urgência",
      description: "Texto + Countdown + Preço + Botão",
      icon: Timer,
      blocks: () => {
        const text = createBlock("text", currentBlockOrder);
        const countdown = createBlock("countdown", currentBlockOrder + 1);
        const price = createBlock("price", currentBlockOrder + 2);
        const button = createBlock("button", currentBlockOrder + 3);
        return [text, countdown, price, button];
      },
    },
    {
      id: "progress-question",
      name: "Quiz com Progresso",
      description: "Progresso + Pergunta",
      icon: TrendingUp,
      blocks: () => {
        const progress = createBlock("progress", currentBlockOrder);
        const question = createBlock("question", currentBlockOrder + 1);
        return [progress, question];
      },
    },
    {
      id: "social-proof",
      name: "Prova Social Completa",
      description: "Texto + 2 Depoimentos + Separador + Pergunta",
      icon: ImagePlusIcon,
      blocks: () => {
        const text = createBlock("text", currentBlockOrder);
        const testimonial1 = createBlock("testimonial", currentBlockOrder + 1);
        const testimonial2 = createBlock("testimonial", currentBlockOrder + 2);
        const separator = createBlock("separator", currentBlockOrder + 3);
        const question = createBlock("question", currentBlockOrder + 4);
        return [text, testimonial1, testimonial2, separator, question];
      },
    },
  ];

  return (
    <div className="h-full flex flex-col border-r bg-card">
      {/* Header */}
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">{t('createQuiz.blockPalette.title')}</h3>
        <p className="text-xs text-muted-foreground">{t('createQuiz.blockPalette.subtitle')}</p>
      </div>

      {/* Blocos Section */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <h4 className="text-xs font-semibold mb-2 px-2 text-muted-foreground">{t('createQuiz.blockPalette.blocksSection')}</h4>
          <TooltipProvider>
            {blockTypes.map((block) => (
              <Tooltip key={block.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-10 text-xs hover:bg-accent"
                    onClick={() => onAddBlock(block.type)}
                  >
                    <block.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{block.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{block.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Templates Section (Collapsible) */}
        <Collapsible open={templatesExpanded} onOpenChange={setTemplatesExpanded}>
          <div className="px-2 py-1 border-t mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 hover:bg-accent">
                <span className="text-xs font-semibold text-muted-foreground">{t('createQuiz.blockPalette.templatesSection')}</span>
                {templatesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="p-2 space-y-1">
              {templates.map((template) => (
                <HoverCard key={template.id} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-auto min-h-12 text-xs flex flex-col items-start px-2 py-2 hover:bg-accent hover:border-primary/50 transition-all"
                      onClick={() => onAddTemplate(template.blocks())}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <template.icon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="font-semibold text-xs truncate">{template.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground text-left line-clamp-2 w-full">
                        {template.description}
                      </span>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start" className="w-auto p-0">
                    <TemplatePreview blocks={template.blocks()} />
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ScrollArea>
    </div>
  );
};
