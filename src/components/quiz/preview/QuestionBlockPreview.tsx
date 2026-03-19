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

export const QuestionBlockPreview = ({ block, selectedAnswer, onAnswerSelect, onTextChange }: QuestionBlockPreviewProps) => {
  const emojis = block.emojis || [];
  const isInteractive = !!onAnswerSelect;
  const currentSelection = selectedAnswer || [];
  const selectedArray = Array.isArray(currentSelection) ? currentSelection : [currentSelection];

  const handleOptionClick = (option: string, isMultiple: boolean) => {
    if (onAnswerSelect) onAnswerSelect(option, isMultiple);
  };

  const renderOption = (rawOption: any, idx: number, isMultiple: boolean) => {
    const option = normalizeOption(rawOption);
    const isSelected = selectedArray.includes(option);
    return (
      <div
        key={idx}
        className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
          isInteractive ? 'cursor-pointer' : ''
        } ${isSelected ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
        onClick={isInteractive ? () => handleOptionClick(option, isMultiple) : undefined}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
          {emojis[idx] || (block.answerFormat === 'yes_no' ? (idx === 0 ? '✅' : '❌') : String.fromCharCode(65 + idx))}
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
          className="space-y-2"
        >
          {(block.options || ['Sim', 'Não']).map((rawOption, idx) => renderOption(rawOption, idx, false))}
        </RadioGroup>
      )}

      {block.answerFormat === "single_choice" && block.options && (
        <RadioGroup
          value={selectedArray[0] || ''}
          onValueChange={isInteractive ? (v) => handleOptionClick(v, false) : undefined}
          className="space-y-2"
        >
          {block.options.map((rawOption, idx) => renderOption(rawOption, idx, false))}
        </RadioGroup>
      )}

      {block.answerFormat === "multiple_choice" && block.options && (
        <div className="space-y-2">
          {block.options.map((rawOption, idx) => renderOption(rawOption, idx, true))}
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
