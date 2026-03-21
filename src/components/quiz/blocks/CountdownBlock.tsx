import { CountdownBlock as CountdownBlockType } from "@/types/blocks";
import { CountdownBlockPreview } from "../preview/InteractiveBlockPreviews";

interface CountdownBlockProps {
  block: CountdownBlockType;
  onChange: (block: CountdownBlockType) => void;
}

export default function CountdownBlock({ block, onChange }: CountdownBlockProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>⏱️ Countdown</span>
      </div>

      {/* ✅ Etapa 3: Preview real — WYSIWYG */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview (ao vivo)</p>
        <CountdownBlockPreview block={block as any} />
      </div>

      <p className="text-xs text-muted-foreground">
        Configure modo, duração, estilo, cores e ação ao expirar no painel de propriedades →
      </p>
    </div>
  );
}
