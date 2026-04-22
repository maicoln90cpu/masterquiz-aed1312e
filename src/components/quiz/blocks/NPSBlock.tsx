import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NPSBlock as NPSBlockType, QuizBlock } from "@/types/blocks";
import { NPSBlockPreview } from "../preview/InteractiveBlockPreviews";

interface NPSBlockProps {
  block: NPSBlockType;
  onChange: (block: NPSBlockType) => void;
}

export const NPSBlock = ({ block, onChange }: NPSBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>⭐ Bloco NPS (Net Promoter Score)</span>
        </div>

        {/* ✅ Onda 3 — pergunta principal editável no cartão */}
        <div className="space-y-1">
          <Label htmlFor={`nps-question-${block.id}`} className="text-xs">Pergunta</Label>
          <Input
            id={`nps-question-${block.id}`}
            value={block.question}
            onChange={(e) => onChange({ ...block, question: e.target.value })}
            placeholder="Ex: De 0 a 10, qual a probabilidade de você recomendar?"
          />
        </div>

        {/* Preview WYSIWYG real */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <NPSBlockPreview block={block as unknown as QuizBlock & { type: 'nps' }} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure pergunta, labels, obrigatoriedade e opções no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
