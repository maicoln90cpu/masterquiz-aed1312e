import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { NPSBlock as NPSBlockType } from "@/types/blocks";

interface NPSBlockProps {
  block: NPSBlockType;
  onChange: (block: NPSBlockType) => void;
}

export const NPSBlock = ({ block, onChange }: NPSBlockProps) => {
  const [previewValue, setPreviewValue] = useState<number | null>(null);

  const getNPSColor = (value: number) => {
    if (value <= 6) return "bg-red-500 hover:bg-red-600";
    if (value <= 8) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-green-500 hover:bg-green-600";
  };

  const getNPSLabel = (value: number | null) => {
    if (value === null) return "";
    if (value <= 6) return "Detrator";
    if (value <= 8) return "Neutro";
    return "Promotor";
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>⭐ Bloco NPS (Net Promoter Score)</span>
        </div>

        {/* Content: Question */}
        <div className="space-y-2">
          <Label htmlFor="nps-question">Pergunta</Label>
          <Input
            id="nps-question"
            value={block.question}
            onChange={(e) => onChange({ ...block, question: e.target.value })}
            placeholder="Ex: De 0 a 10, qual a probabilidade de você recomendar?"
          />
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className="font-medium text-center">{block.question}</p>
          
          {block.showLabels && (
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{block.lowLabel}</span>
              <span>{block.highLabel}</span>
            </div>
          )}
          
          <div className="flex justify-center gap-0.5 sm:gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setPreviewValue(i)}
                className={cn(
                  "w-7 h-7 sm:w-9 sm:h-9 rounded-full font-semibold text-xs sm:text-sm transition-all",
                  previewValue === i
                    ? `${getNPSColor(i)} text-white scale-110 shadow-lg`
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                {i}
              </button>
            ))}
          </div>
          
          {previewValue !== null && (
            <p className={cn(
              "text-center text-sm font-medium",
              previewValue <= 6 ? "text-red-600" : previewValue <= 8 ? "text-yellow-600" : "text-green-600"
            )}>
              {getNPSLabel(previewValue)} ({previewValue})
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Configure labels, obrigatoriedade e opções no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
