import { Card, CardContent } from "@/components/ui/card";
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
