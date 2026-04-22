import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, HelpCircle, Eye, Blocks, CheckCircle2, AlertCircle } from "lucide-react";
import type { QuizBlock, BlockType } from "@/types/blocks";
import { blockCatalogSections } from "./blockPaletteCatalog";
import { createBlock, normalizeBlock } from "@/types/blocks";
import { BlockTemplates } from "./BlockTemplates";
import { QuestionBlock } from "./QuestionBlock";
import { TextBlock } from "./TextBlock";
import { SeparatorBlock } from "./SeparatorBlock";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { AudioBlock } from "./AudioBlock";
import { GalleryBlock } from "./GalleryBlock";
import { EmbedBlock } from "./EmbedBlock";
import { ButtonBlock } from "./ButtonBlock";
import { PriceBlock } from "./PriceBlock";
import { MetricsBlock } from "./MetricsBlock";
import { LoadingBlock } from "./LoadingBlock";
import { SliderBlock } from "./SliderBlock";
import { TextInputBlock } from "./TextInputBlock";
import { NPSBlock } from "./NPSBlock";
import { AccordionBlock } from "./AccordionBlock";
import { ComparisonBlock } from "./ComparisonBlock";
import { SocialProofBlock } from "./SocialProofBlock";
import TestimonialBlock from "./TestimonialBlock";
import CountdownBlock from "./CountdownBlock";
import ProgressBlock from "./ProgressBlock";
import { AnimatedCounterBlock } from "./AnimatedCounterBlock";
import { BlockErrorBoundary } from "./BlockErrorBoundary";
import { CalloutBlockPreview as CalloutBlockPreviewInline, IconListBlockPreview as IconListBlockPreviewInline, QuoteBlockPreview as QuoteBlockPreviewInline, BadgeRowBlockPreview as BadgeRowBlockPreviewInline, BannerBlockPreview as BannerBlockPreviewInline } from "../preview/VisualBlockPreviews";
import { AnswerSummaryBlockPreview as AnswerSummaryBlockPreviewInline, ProgressMessageBlockPreview as ProgressMessageBlockPreviewInline, AvatarGroupBlockPreview as AvatarGroupBlockPreviewInline, ConditionalTextBlockPreview as ConditionalTextBlockPreviewInline, ComparisonResultBlockPreview as ComparisonResultBlockPreviewInline, PersonalizedCTABlockPreview as PersonalizedCTABlockPreviewInline } from "../preview/DynamicBlockPreviews";
import { RecommendationBlockPreview as RecommendationBlockPreviewInline } from "../preview/RecommendationBlockPreview";
import { CalculatorBlockPreview as CalculatorBlockPreviewInline, RatingBlockPreview as RatingBlockPreviewInline } from "../preview/InteractiveBlockPreviews";
import { BlockQuickEditFields } from "./BlockQuickEditFields";

interface BlockEditorProps {
  blocks: QuizBlock[];
  onChange: (blocks: QuizBlock[]) => void;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  /** Callback when a block is clicked/selected (for properties panel) */
  onBlockSelect?: (index: number) => void;
  /** Currently selected block index (for highlight) */
  selectedBlockIndex?: number | null;
}

interface SortableBlockProps {
  block: QuizBlock;
  blockIndex: number;
  onUpdate: (block: QuizBlock) => void;
  onDelete: () => void;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  t: (key: string, options?: Record<string, unknown>) => string;
  onBlockSelect?: (index: number) => void;
  isSelected?: boolean;
}

const SortableBlock = ({ block, blockIndex, onUpdate, onDelete, totalQuestions = 0, currentQuestionIndex = 0, t, onBlockSelect, isSelected }: SortableBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Verifica se o bloco está completo
  const isBlockComplete = () => {
    switch (block.type) {
      case 'question':
        return block.questionText && block.options && block.options.length > 0;
      case 'text':
        return block.content && block.content.trim().length > 0;
      case 'image':
        return block.url && block.url.trim().length > 0;
      case 'video':
        return block.url && block.url.trim().length > 0;
      case 'audio':
        return block.url && block.url.trim().length > 0;
      case 'button':
        const action = block.action || 'link';
        if (action === 'link') return block.text && block.url;
        else if (action === 'next_question') return !!block.text;
        else if (action === 'go_to_question') return block.text && block.targetQuestionIndex !== undefined;
        return !!block.text;
      case 'gallery':
        return block.images && block.images.length > 0;
      case 'embed':
        return block.url && block.url.trim().length > 0;
      case 'separator':
      case 'countdown':
      case 'progress':
      case 'testimonial':
      case 'price':
      case 'metrics':
      case 'loading':
      case 'slider':
      case 'textInput':
      case 'nps':
      case 'accordion':
      case 'comparison':
      case 'socialProof':
      case 'animatedCounter':
      case 'callout':
      case 'iconList':
      case 'quote':
      case 'badgeRow':
      case 'banner':
      case 'answerSummary':
      case 'progressMessage':
      case 'avatarGroup':
      case 'conditionalText':
      case 'comparisonResult':
      case 'personalizedCTA':
      case 'recommendation':
      case 'calculator':
      case 'rating':
        return true;
      default:
        return false;
    }
  };

  const blockComplete = isBlockComplete();

  const renderBlock = () => {
    switch (block.type) {
      case 'question':
        return <QuestionBlock block={block} onChange={onUpdate} />;
      case 'text':
        return <TextBlock block={block} onChange={onUpdate} />;
      case 'separator':
        return <SeparatorBlock block={block} onChange={onUpdate} />;
      case 'image':
        return <ImageBlock block={block} onChange={onUpdate} />;
      case 'video':
        return <VideoBlock block={block} onChange={onUpdate} />;
      case 'audio':
        return <AudioBlock block={block} onChange={onUpdate} />;
      case 'gallery':
        return <GalleryBlock block={block} onChange={onUpdate} />;
      case 'embed':
        return <EmbedBlock block={block} onChange={onUpdate} />;
      case 'button':
        return <ButtonBlock block={block} onChange={onUpdate} totalQuestions={totalQuestions} currentQuestionIndex={currentQuestionIndex} />;
      case 'price':
        return <PriceBlock block={block} onChange={onUpdate} />;
      case 'metrics':
        return <MetricsBlock block={block} onChange={onUpdate} />;
      case 'loading':
        return <LoadingBlock block={block} onChange={onUpdate} />;
      case 'slider':
        return <SliderBlock block={block} onChange={onUpdate} />;
      case 'textInput':
        return <TextInputBlock block={block} onChange={onUpdate} />;
      case 'nps':
        return <NPSBlock block={block} onChange={onUpdate} />;
      case 'accordion':
        return <AccordionBlock block={block} onChange={onUpdate} />;
      case 'comparison':
        return <ComparisonBlock block={block} onChange={onUpdate} />;
      case 'socialProof':
        return <SocialProofBlock block={block} onChange={onUpdate} />;
      case 'testimonial':
        return <TestimonialBlock block={block} onChange={onUpdate} />;
      case 'countdown':
        return <CountdownBlock block={block} onChange={onUpdate} />;
      case 'progress':
        return <ProgressBlock block={block} onChange={onUpdate} />;
      case 'animatedCounter':
        return <AnimatedCounterBlock block={block} onChange={onUpdate} />;
      case 'callout':
        return <CalloutBlockPreviewInline block={block as any} />;
      case 'iconList':
        return <IconListBlockPreviewInline block={block as any} />;
      case 'quote':
        return <QuoteBlockPreviewInline block={block as any} />;
      case 'badgeRow':
        return <BadgeRowBlockPreviewInline block={block as any} />;
      case 'banner':
        return <BannerBlockPreviewInline block={block as any} />;
      case 'answerSummary':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><AnswerSummaryBlockPreviewInline block={block as any} /></>;
      case 'progressMessage':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><ProgressMessageBlockPreviewInline block={block as any} /></>;
      case 'avatarGroup':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><AvatarGroupBlockPreviewInline block={block as any} /></>;
      case 'conditionalText':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><ConditionalTextBlockPreviewInline block={block as any} /></>;
      case 'comparisonResult':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><ComparisonResultBlockPreviewInline block={block as any} /></>;
      case 'personalizedCTA':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><PersonalizedCTABlockPreviewInline block={block as any} /></>;
      case 'recommendation':
        return <><BlockQuickEditFields block={block} onChange={onUpdate} /><RecommendationBlockPreviewInline block={block as any} /></>;
      case 'calculator':
        return <CalculatorBlockPreviewInline block={block as any} />;
      case 'rating':
        return <RatingBlockPreviewInline block={block as any} />;
      default:
        return null;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={(e) => {
        e.stopPropagation();
        onBlockSelect?.(blockIndex);
      }}
      className={cn(
        "relative group border-2 rounded-lg transition-all cursor-pointer",
        isDragging ? "border-primary shadow-2xl ring-4 ring-primary/20 scale-105 z-50" 
          : isSelected ? "border-primary ring-2 ring-primary/30"
          : "border-transparent hover:border-primary/30"
      )}
    >
      {/* Badge de Status e Controles - SEMPRE VISÍVEIS */}
      <div className="absolute -left-2 -top-2 flex items-center gap-2 z-10">
        {/* Badge de Status */}
        <div className={cn(
          "rounded-full px-2 py-1 text-xs font-semibold shadow-sm flex items-center gap-1",
          blockComplete ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"
        )}>
          {blockComplete ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden md:inline">{t('createQuiz.blockEditor.complete')}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              <span className="hidden md:inline">{t('createQuiz.blockEditor.incomplete')}</span>
            </>
          )}
        </div>
        
        {/* Controles de Ação - sempre visíveis em hover mais suave */}
        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 cursor-grab active:cursor-grabbing bg-background shadow-md"
            {...attributes}
            {...listeners}
            title={t('createQuiz.blockEditor.dragToMove')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-7 w-7 shadow-md"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title={t('createQuiz.blockEditor.deleteBlock')}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="pt-8">
        <BlockErrorBoundary blockType={block.type} onDelete={onDelete}>
          {renderBlock()}
        </BlockErrorBoundary>
      </div>
    </div>
  );
};

export const BlockEditor = ({ blocks, onChange, totalQuestions = 0, currentQuestionIndex = 0, onBlockSelect, selectedBlockIndex }: BlockEditorProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"edit" | "templates">("edit");
  const [showHelp, setShowHelp] = useState(false);
  
  // Ensure blocks is always an array
  const safeBlocks = blocks || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({
        ...block,
        order: index,
      }));

      onChange(reorderedBlocks);
    }
  };

  const addBlocksFromTemplate = (templateBlocks: QuizBlock[]) => {
    const maxOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) : -1;
    const newBlocks = templateBlocks.map((block, idx) => ({
      ...block,
      order: maxOrder + idx + 1,
    }));
    onChange([...blocks, ...newBlocks]);
    setActiveTab("edit");
  };

  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type, blocks.length);
    onChange([...blocks, newBlock]);
    setActiveTab('edit');
    
    // Usar catálogo para nome do bloco
    const catalogItem = blockCatalogSections.flatMap(s => s.items).find(i => i.type === type);
    const blockName = catalogItem ? t(catalogItem.labelKey, catalogItem.defaultLabel) : type;
    
    toast.success(
      t('createQuiz.blockAdded', { blockType: blockName })
    );
  };

  const updateBlock = (blockId: string, updatedBlock: QuizBlock) => {
    const updatedBlocks = safeBlocks.map((b) =>
      b.id === blockId ? updatedBlock : b
    );
    onChange(updatedBlocks);
  };

  const deleteBlock = (blockId: string) => {
    // Garantir que sempre exista pelo menos 1 bloco (de qualquer tipo)
    if (safeBlocks.length === 1) {
      toast.warning(t('createQuiz.blockEditor.keepAtLeastOneBlock'));
      return;
    }

    // Permitir deletar qualquer bloco (incluindo question)
    const filteredBlocks = safeBlocks.filter((b) => b.id !== blockId);
    const reindexedBlocks = filteredBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    onChange(reindexedBlocks);
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "templates")}>
      <Card>
        <CardHeader className="p-3 sm:p-6">
          {/* Layout vertical em mobile, horizontal em desktop */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">Blocos da Pergunta</CardTitle>
            <TabsList className="w-full sm:w-auto justify-center">
              <TabsTrigger value="edit" className="flex-1 sm:flex-none text-xs sm:text-sm gap-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 sm:flex-none text-xs sm:text-sm gap-1">
                <Blocks className="h-3 w-3 sm:h-4 sm:w-4" />
                Templates
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <TabsContent value="edit" className="mt-0">
            <div className="space-y-3 sm:space-y-4">
      {/* Layout vertical em mobile para Editor de Blocos */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm sm:text-lg font-semibold">Editor de Blocos</h3>
          <p className="text-[10px] sm:text-sm text-muted-foreground">
            Arraste para reordenar • {safeBlocks.length} {safeBlocks.length === 1 ? 'bloco' : 'blocos'}
          </p>
        </div>

        <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs h-7 sm:h-9"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden xs:inline">Ajuda</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="default" size="sm" className="flex-1 sm:flex-none text-xs h-7 sm:h-9">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
              {blockCatalogSections.map((section, sIdx) => (
                <div key={section.titleKey}>
                  {sIdx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel>{section.defaultTitle}</DropdownMenuLabel>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.type} onClick={() => addBlock(item.type)}>
                        <Icon className="h-4 w-4 mr-2" />
                        {t(item.labelKey, item.defaultLabel)}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showHelp && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Como usar o Editor de Blocos</h4>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              <li>• <strong>Arraste</strong> os blocos para reordenar</li>
              <li>• Use <strong>Adicionar Bloco</strong> para inserir novos elementos</li>
              <li>• Passe o mouse sobre um bloco para ver os controles</li>
              <li>• <strong>Blocos de Pergunta</strong> são obrigatórios (mínimo 1)</li>
              <li>• Use <strong>Texto</strong> para instruções ou contexto</li>
              <li>• Use <strong>Separadores</strong> para organizar visualmente</li>
              <li>• Adicione <strong>Mídia</strong> para enriquecer o conteúdo</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {safeBlocks.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum bloco adicionado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece adicionando uma pergunta ou outro tipo de bloco
            </p>
            <Button onClick={() => addBlock('question')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Pergunta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={safeBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {safeBlocks.map((block, index) => {
                  const normalizedBlock = normalizeBlock(block);
                  return (
                    <SortableBlock
                      key={block.id}
                      block={normalizedBlock}
                      blockIndex={index}
                      onUpdate={(updated) => updateBlock(block.id, updated)}
                      onDelete={() => deleteBlock(block.id)}
                      totalQuestions={totalQuestions}
                      currentQuestionIndex={currentQuestionIndex}
                      t={t}
                      onBlockSelect={onBlockSelect}
                      isSelected={selectedBlockIndex === index}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  </TabsContent>

  <TabsContent value="templates" className="mt-0">
    <BlockTemplates
      onSelectTemplate={addBlocksFromTemplate}
      currentOrder={safeBlocks.length > 0 ? Math.max(...safeBlocks.map(b => b.order)) : 0}
    />
  </TabsContent>
</CardContent>
</Card>
</Tabs>
);
};
