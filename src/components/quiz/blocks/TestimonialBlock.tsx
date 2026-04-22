import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TestimonialBlock as TestimonialBlockType } from "@/types/blocks";
import { ImageUploader } from "@/components/ImageUploader";
import { TestimonialBlockPreview } from "../preview/InteractiveBlockPreviews";
import { X } from "lucide-react";

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

      {/* ✅ Onda 3: Nome + Cargo/Empresa visíveis no cartão (antes só no painel) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Nome do autor</Label>
          <Input
            value={block.authorName || ''}
            onChange={(e) => onChange({ ...block, authorName: e.target.value })}
            placeholder="Maria Silva"
          />
        </div>
        <div className="space-y-2">
          <Label>Cargo / Empresa</Label>
          <Input
            value={block.authorRole || ''}
            onChange={(e) => onChange({ ...block, authorRole: e.target.value })}
            placeholder="CEO • Acme Inc."
          />
        </div>
      </div>

      {/* Content: Author photo — preview único */}
      <div className="space-y-2">
        <Label>Foto do Autor</Label>
        {block.authorImage ? (
          <div className="relative inline-block">
            <img
              src={block.authorImage}
              alt={block.authorName || 'Autor'}
              className="w-16 h-16 rounded-full object-cover border-2 border-muted"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
              onClick={() => onChange({ ...block, authorImage: undefined })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <ImageUploader
            value={block.authorImage}
            onChange={(url) => onChange({ ...block, authorImage: url })}
          />
        )}
      </div>

      {/* ✅ Preview real — WYSIWYG */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview (ao vivo)</p>
        <TestimonialBlockPreview block={block as any} />
      </div>

      <p className="text-xs text-muted-foreground">
        Avaliação, estilo, cores e carrossel de depoimentos no painel de propriedades →
      </p>
    </div>
  );
}
