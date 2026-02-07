import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EMOJI_CATEGORIES, EmojiCategoryKey } from '@/lib/constants';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const CATEGORY_LABELS: Record<EmojiCategoryKey, string> = {
  popular: '⭐',
  expressions: '😊',
  business: '💼',
  lifestyle: '🏠',
  health: '💪',
  education: '📚',
  food: '🍕',
  nature: '🌿',
  symbols: '🔢',
};

const CATEGORY_NAMES: Record<EmojiCategoryKey, string> = {
  popular: 'Popular',
  expressions: 'Expressões',
  business: 'Negócios',
  lifestyle: 'Lifestyle',
  health: 'Saúde',
  education: 'Educação',
  food: 'Comida',
  nature: 'Natureza',
  symbols: 'Símbolos',
};

export const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 text-lg relative shrink-0"
        >
          {value ? (
            <>
              <span className="text-xl">{value}</span>
              {value && (
                <span
                  onClick={handleClear}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-destructive/80"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </>
          ) : (
            <Smile className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="w-full grid grid-cols-9 h-10">
            {(Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[]).map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="text-lg px-2"
                title={CATEGORY_NAMES[category]}
              >
                {CATEGORY_LABELS[category]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-48">
            {(Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[]).map((category) => (
              <TabsContent key={category} value={category} className="p-2 m-0">
                <div className="grid grid-cols-5 gap-1">
                  {EMOJI_CATEGORIES[category].map((emoji, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={value === emoji ? 'secondary' : 'ghost'}
                      className="h-10 w-10 text-xl p-0 hover:bg-accent"
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
        
        <div className="border-t p-2 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Selecione um emoji
          </span>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelect('')}
              className="text-xs h-7"
            >
              Remover
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
