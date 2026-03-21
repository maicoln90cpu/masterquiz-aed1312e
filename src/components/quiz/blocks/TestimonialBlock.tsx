import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TestimonialBlock as TestimonialBlockType } from "@/types/blocks";
import { ImageUploader } from "@/components/ImageUploader";
import { TestimonialBlockPreview } from "../preview/InteractiveBlockPreviews";

interface TestimonialBlockProps {
  block: TestimonialBlockType;
  onChange: (block: TestimonialBlockType) => void;
}

export default function TestimonialBlock({ block, onChange }: TestimonialBlockProps) {
  return (
    <div className="space-y-4">
      {/* Content: Quote */}
      <div className="space-y-2">
        <Label>Citação / Depoimento</Label>
        <Textarea
          value={block.quote}
          onChange={(e) => onChange({ ...block, quote: e.target.value })}
          placeholder="Este produto mudou minha vida!"
          rows={3}
        />
      </div>

      {/* Content: Author photo */}
      <div className="space-y-2">
        <Label>Foto do Autor</Label>
        <ImageUploader
          value={block.authorImage}
          onChange={(url) => onChange({ ...block, authorImage: url })}
          onRemove={() => onChange({ ...block, authorImage: undefined })}
        />
      </div>

      {/* ✅ Etapa 3: Preview real — WYSIWYG com carrossel, rating, estilos */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview (ao vivo)</p>
        <TestimonialBlockPreview block={block as any} />
      </div>

      <p className="text-xs text-muted-foreground">
        Configure nome, cargo, empresa, avaliação, estilo e cores no painel de propriedades →
      </p>
    </div>
  );
}
