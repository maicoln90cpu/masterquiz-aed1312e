import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestimonialBlock as TestimonialBlockType } from "@/types/blocks";
import { ImageUploader } from "@/components/ImageUploader";
import { Star } from "lucide-react";

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

      {/* Preview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview</p>
        <div className={`${block.style === 'card' ? 'p-4 bg-background rounded-lg shadow-md' : ''}`}>
          {block.style === 'quote' && <div className="text-6xl text-muted-foreground mb-2">"</div>}
          <p className={`${block.style === 'minimal' ? 'text-sm' : 'text-base'} italic mb-3`}>"{block.quote}"</p>
          {block.showRating && (
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-4 h-4 ${star <= (block.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            {block.authorImage && <img src={block.authorImage} alt={block.authorName} className="w-12 h-12 rounded-full object-cover" />}
            <div>
              <p className="font-semibold" style={{ color: block.primaryColor }}>{block.authorName}</p>
              {(block.authorRole || block.authorCompany) && (
                <p className="text-sm text-muted-foreground">
                  {block.authorRole}{block.authorRole && block.authorCompany && ' • '}{block.authorCompany}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Configure nome, cargo, empresa, avaliação, estilo e cores no painel de propriedades →
      </p>
    </div>
  );
}
