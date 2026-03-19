import { ProgressBlock as ProgressBlockType } from "@/types/blocks";

interface ProgressBlockProps {
  block: ProgressBlockType;
  onChange: (block: ProgressBlockType) => void;
}

export default function ProgressBlock({ block, onChange }: ProgressBlockProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>📊 Barra de Progresso</span>
      </div>

      {/* Preview only — all config in properties panel */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-2">Preview (50%)</p>
        <div className="space-y-2">
          {block.style === 'bar' && (
            <div className="w-full bg-secondary rounded-full" style={{ height: block.height === 'thin' ? '4px' : block.height === 'thick' ? '12px' : '8px' }}>
              <div
                className={`h-full rounded-full ${block.animated ? 'transition-all duration-500' : ''}`}
                style={{ width: '50%', backgroundColor: block.color }}
              />
            </div>
          )}
          {block.style === 'percentage' && (
            <div className="text-center text-3xl font-bold" style={{ color: block.color }}>50%</div>
          )}
          {block.showPercentage && block.style !== 'percentage' && (
            <p className="text-sm text-center" style={{ color: block.color }}>50%</p>
          )}
          {block.showCounter && (
            <p className="text-sm text-center text-muted-foreground">Pergunta 5 de 10</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Configure estilo, cor, altura e opções no painel de propriedades →
      </p>
    </div>
  );
}
