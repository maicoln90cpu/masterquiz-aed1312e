import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { LoadingBlock as LoadingBlockType } from "@/types/blocks";
import type { QuizBlock } from "@/types/blocks";
import { LoadingBlockPreview } from "../preview/InteractiveBlockPreviews";

interface LoadingBlockProps {
  block: LoadingBlockType;
  onChange: (block: LoadingBlockType) => void;
}

export const LoadingBlock = ({ block, onChange }: LoadingBlockProps) => {
  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4" />
          <span>Loading / Carregamento</span>
        </div>

        {/* Preview WYSIWYG real */}
        <div className="border rounded-lg bg-muted/10 overflow-hidden">
          <LoadingBlockPreview key={(block as any)._previewKey || 0} block={block as unknown as QuizBlock & { type: 'loading' }} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure duração, mensagem, tipo de animação e comportamento no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
