import { Card, CardContent } from "@/components/ui/card";
import type { AnimatedCounterBlock as AnimatedCounterBlockType } from "@/types/blocks";
import { AnimatedCounterBlockPreview } from "../preview/InteractiveBlockPreviews";

interface AnimatedCounterBlockProps {
  block: AnimatedCounterBlockType;
  onChange: (block: AnimatedCounterBlockType) => void;
}

export const AnimatedCounterBlock = ({ block, onChange }: AnimatedCounterBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>🔢 Contador Animado</span>
        </div>

        {/* ✅ Etapa 3: Preview real — WYSIWYG com animação, easing, formato moeda */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Preview (ao vivo)</p>
          <AnimatedCounterBlockPreview block={block as any} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure valores, label, prefixo/sufixo, duração, easing e cor no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
