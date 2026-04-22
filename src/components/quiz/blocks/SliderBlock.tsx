import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SliderBlock as SliderBlockType, QuizBlock } from "@/types/blocks";
import { SliderBlockPreview } from "../preview/InteractiveBlockPreviews";

interface SliderBlockProps {
  block: SliderBlockType;
  onChange: (block: SliderBlockType) => void;
}

export const SliderBlock = ({ block, onChange }: SliderBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>📊 Bloco Slider/Range</span>
        </div>

        {/* ✅ Onda 3 — pergunta principal editável no cartão (texto que aparece no quiz) */}
        <div className="space-y-1">
          <Label htmlFor={`slider-label-${block.id}`} className="text-xs">Pergunta</Label>
          <Input
            id={`slider-label-${block.id}`}
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Ex: Qual sua renda mensal?"
          />
        </div>

        {/* Preview WYSIWYG real */}
        <div className="p-4 border rounded-lg bg-muted/10">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <SliderBlockPreview block={block as unknown as QuizBlock & { type: 'slider' }} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure pergunta, min/max, incremento, unidade e opções no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
