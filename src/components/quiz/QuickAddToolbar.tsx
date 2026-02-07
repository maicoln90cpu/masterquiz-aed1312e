import { Button } from '@/components/ui/button';
import { 
  Image, 
  Type, 
  Video, 
  FileQuestion, 
  Sparkles,
  Plus,
  LayoutGrid,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BlockType } from '@/types/blocks';

interface QuickAddToolbarProps {
  onAddBlock: (type: BlockType) => void;
  onOpenFullPalette?: () => void;
  disabled?: boolean;
  position?: 'fixed' | 'inline';
  className?: string;
}

interface QuickBlockItem {
  type: BlockType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  color: string;
}

export const QuickAddToolbar = ({
  onAddBlock,
  onOpenFullPalette,
  disabled = false,
  position = 'inline',
  className
}: QuickAddToolbarProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const quickBlocks: QuickBlockItem[] = [
    {
      type: 'image',
      icon: <Image className="h-4 w-4" />,
      label: t('blocks.image', 'Imagem'),
      shortcut: 'I',
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/30'
    },
    {
      type: 'text',
      icon: <Type className="h-4 w-4" />,
      label: t('blocks.text', 'Texto'),
      shortcut: 'T',
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/30'
    },
    {
      type: 'video',
      icon: <Video className="h-4 w-4" />,
      label: t('blocks.video', 'Vídeo'),
      shortcut: 'V',
      color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/30'
    },
    {
      type: 'audio',
      icon: <Music className="h-4 w-4" />,
      label: t('blocks.audio', 'Áudio'),
      shortcut: 'A',
      color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30'
    },
    {
      type: 'question',
      icon: <FileQuestion className="h-4 w-4" />,
      label: t('blocks.question', 'Pergunta'),
      shortcut: 'Q',
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30'
    }
  ];

  const handleAddBlock = (type: BlockType) => {
    onAddBlock(type);
    setIsOpen(false);
  };

  if (position === 'fixed') {
    return (
      <TooltipProvider delayDuration={200}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <motion.div
              className={cn(
                "fixed z-50",
                className
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                disabled={disabled}
                className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className={cn("h-6 w-6 transition-transform", isOpen && "rotate-45")} />
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent 
            side="top" 
            align="end" 
            className="w-auto p-2"
            sideOffset={8}
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
                Adicionar bloco
              </p>
              {quickBlocks.map((block) => (
                <Tooltip key={block.type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBlock(block.type)}
                      disabled={disabled}
                      className={cn("justify-start gap-2 h-9", block.color)}
                    >
                      {block.icon}
                      <span>{block.label}</span>
                      {block.shortcut && (
                        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                          {block.shortcut}
                        </kbd>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>{block.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {onOpenFullPalette && (
                <>
                  <div className="border-t my-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenFullPalette();
                      setIsOpen(false);
                    }}
                    className="justify-start gap-2 h-9"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span>Ver todos os blocos</span>
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    );
  }

  // Inline toolbar
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex items-center gap-1 p-1 bg-muted/50 rounded-lg border", className)}>
        <span className="text-xs text-muted-foreground px-2 hidden sm:inline">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Quick add:
        </span>
        {quickBlocks.map((block) => (
          <Tooltip key={block.type}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddBlock(block.type)}
                disabled={disabled}
                className={cn("h-8 w-8 p-0 sm:w-auto sm:px-2 sm:gap-1", block.color)}
              >
                {block.icon}
                <span className="hidden sm:inline text-xs">{block.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{block.label}</p>
              {block.shortcut && (
                <p className="text-xs text-muted-foreground">Atalho: {block.shortcut}</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {onOpenFullPalette && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenFullPalette}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver todos os blocos</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
