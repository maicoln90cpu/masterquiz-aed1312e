import { useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import type { QuizBlock } from "@/types/blocks";
import { normalizeOption } from "@/types/blocks";
import { sanitizeHtml } from "@/lib/sanitize";

interface QuestionBlockPreviewProps {
  block: QuizBlock & { type: 'question' };
  selectedAnswer?: string | string[];
  onAnswerSelect?: (value: string, isMultiple: boolean) => void;
  onTextChange?: (text: string) => void;
}

// ✅ Etapa 2C: Fisher-Yates shuffle determinístico por block.id
const shuffleArray = <T,>(arr: T[], seed: string): T[] => {
  const result = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash) + i;
    hash |= 0;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const QuestionBlockPreview = ({ block, selectedAnswer, onAnswerSelect, onTextChange }: QuestionBlockPreviewProps) => {
  const emojis = block.emojis || [];
  const optionImages = block.optionImages || []; // ✅ Etapa 2E
  const isInteractive = !!onAnswerSelect;
  const currentSelection = selectedAnswer || [];
  const selectedArray = Array.isArray(currentSelection) ? currentSelection : [currentSelection];

  // ✅ Etapa 2C: Randomizar opções (mantém emojis e imagens sincronizados)
  const { displayOptions, displayEmojis, displayImages } = useMemo(() => {
    const opts = block.options || (block.answerFormat === 'yes_no' ? ['Sim', 'Não'] : []);
    if (!block.randomizeOptions || opts.length <= 1) {
      return { displayOptions: opts, displayEmojis: emojis, displayImages: optionImages };
    }
    const indices = opts.map((_, i) => i);
    const shuffled = shuffleArray(indices, block.id);
    return {
      displayOptions: shuffled.map(i => opts[i]),
      displayEmojis: shuffled.map(i => emojis[i] || ''),
      displayImages: shuffled.map(i => optionImages[i] || ''),
    };
  }, [block.options, block.randomizeOptions, block.id, block.answerFormat, emojis, optionImages]);

  // ✅ Layout and size from block properties
  const optionImageLayout = (block as any).optionImageLayout || '2x2';
  const optionImageSize = (block as any).optionImageSize || 'medium';

  const handleOptionClick = (option: string, isMultiple: boolean) => {
    if (onAnswerSelect) onAnswerSelect(option, isMultiple);
  };

  // ✅ Etapa 2E: Detectar se tem imagens para renderizar cards visuais
  const hasImages = displayImages.some(img => img && img.trim() !== '');

  const renderOption = (rawOption: any, idx: number, isMultiple: boolean) => {
    const option = normalizeOption(rawOption);
    const isSelected = selectedArray.includes(option);
    const image = displayImages[idx];
    const imageAspect = optionImageSize === 'tiny' ? 'aspect-[4/2]' : optionImageSize === 'small' ? 'aspect-[4/2.5]' : optionImageSize === 'large' ? 'aspect-[4/4]' : 'aspect-[4/3]';

    // ✅ Etapa 2E: Card visual com imagem
    if (hasImages && image) {
      return (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
            isSelected ? 'border-primary ring-2 ring-primary/30 shadow-lg' : 'border-muted-foreground/20 hover:border-primary/50 hover:shadow-md'
          }`}
          onClick={isInteractive ? () => handleOptionClick(option, isMultiple) : undefined}
        >
          <div className={`${imageAspect} overflow-hidden`}>
            <img src={image} alt={option} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="p-3 flex items-center gap-2">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
              {displayEmojis[idx] || String.fromCharCode(65 + idx)}
            </div>
            <span className="font-medium text-sm flex-1">{option}</span>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
          {isMultiple ? (
            <Checkbox id={`${block.id}-${idx}`} checked={isSelected} className="sr-only" />
          ) : (
            <RadioGroupItem value={option} id={`${block.id}-${idx}`} className="sr-only" />
          )}
        </div>
      );
    }

    return (
      <div
        key={idx}
        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
          isInteractive ? 'cursor-pointer' : ''
        } ${isSelected ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
        onClick={isInteractive ? () => handleOptionClick(option, isMultiple) : undefined}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
          {displayEmojis[idx] || (block.answerFormat === 'yes_no' ? (idx === 0 ? '✅' : '❌') : String.fromCharCode(65 + idx))}
        </div>
        {isMultiple ? (
          <Checkbox id={`${block.id}-${idx}`} checked={isSelected} className="sr-only" />
        ) : (
          <RadioGroupItem value={option} id={`${block.id}-${idx}`} className="sr-only" />
        )}
        <Label htmlFor={`${block.id}-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    );
  };

  // ✅ Etapa 2E: Grid layout when images are present
  const optionContainerClass = hasImages ? 'grid grid-cols-2 gap-3' : 'space-y-2';

  return (
    <div className="space-y-4">
      <div>
        <div
          className="prose prose-sm max-w-none text-xl font-semibold mb-2 [&>p]:m-0 [&>h1]:m-0 [&>h2]:m-0 [&>h3]:m-0"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.questionText) }}
        />
        {block.subtitle && (
          <div
            className="prose prose-sm max-w-none text-sm text-muted-foreground mb-2 [&>p]:m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.subtitle) }}
          />
        )}
        {block.hint && (
          <p className="text-xs text-muted-foreground italic mb-4">💡 {block.hint}</p>
        )}
      </div>

      {block.answerFormat === "yes_no" && (
        <RadioGroup
          value={selectedArray[0] || ''}
          onValueChange={isInteractive ? (v) => handleOptionClick(v, false) : undefined}
          className={optionContainerClass}
        >
          {displayOptions.map((rawOption, idx) => renderOption(rawOption, idx, false))}
        </RadioGroup>
      )}

      {block.answerFormat === "single_choice" && displayOptions.length > 0 && (
        <RadioGroup
          value={selectedArray[0] || ''}
          onValueChange={isInteractive ? (v) => handleOptionClick(v, false) : undefined}
          className={optionContainerClass}
        >
          {displayOptions.map((rawOption, idx) => renderOption(rawOption, idx, false))}
        </RadioGroup>
      )}

      {block.answerFormat === "multiple_choice" && displayOptions.length > 0 && (
        <div className={optionContainerClass}>
          {displayOptions.map((rawOption, idx) => renderOption(rawOption, idx, true))}
        </div>
      )}

      {block.answerFormat === "short_text" && (
        <Input
          placeholder="Digite sua resposta..."
          value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
          onChange={(e) => onTextChange?.(e.target.value)}
        />
      )}
    </div>
  );
};
