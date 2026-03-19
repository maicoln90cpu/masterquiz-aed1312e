import { Card, CardContent } from "@/components/ui/card";
import type { AnimatedCounterBlock as AnimatedCounterBlockType } from "@/types/blocks";

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

        {/* Preview only — all config in properties panel */}
        <div className="p-6 bg-muted/50 rounded-lg text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className={`font-bold ${
            block.fontSize === 'xlarge' ? 'text-6xl' :
            block.fontSize === 'large' ? 'text-4xl' :
            block.fontSize === 'medium' ? 'text-2xl' : 'text-xl'
          }`} style={{ color: block.color || '#10b981' }}>
            {block.prefix}{block.separator ? block.endValue.toLocaleString('pt-BR') : block.endValue}{block.suffix}
          </p>
          {block.label && <p className="text-muted-foreground text-sm">{block.label}</p>}
          <p className="text-xs text-muted-foreground">
            {block.startValue} → {block.endValue} • {block.duration}s • {block.easing || 'easeOut'}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Configure valores, label, prefixo/sufixo, duração, easing e cor no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
