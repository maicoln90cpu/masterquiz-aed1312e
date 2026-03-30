import { ProgressBlock as ProgressBlockType } from "@/types/blocks";
import { ProgressBlockPreview } from "../preview/InteractiveBlockPreviews";
import type { QuizBlock } from "@/types/blocks";

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

      {/* Preview WYSIWYG real */}
      <div className="p-4 border rounded-lg bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Preview (50%)</p>
        <ProgressBlockPreview
          block={block as unknown as QuizBlock & { type: 'progress' }}
          currentQuestion={5}
          totalQuestions={10}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Configure estilo, cor, altura e opções no painel de propriedades →
      </p>
    </div>
  );
}
