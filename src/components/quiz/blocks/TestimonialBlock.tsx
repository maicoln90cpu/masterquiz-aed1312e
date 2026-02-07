import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
      <div className="space-y-2">
        <Label>Citação / Depoimento</Label>
        <Textarea
          value={block.quote}
          onChange={(e) => onChange({ ...block, quote: e.target.value })}
          placeholder="Este produto mudou minha vida!"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Nome do Autor</Label>
        <Input
          value={block.authorName}
          onChange={(e) => onChange({ ...block, authorName: e.target.value })}
          placeholder="João Silva"
        />
      </div>

      <div className="space-y-2">
        <Label>Cargo</Label>
        <Input
          value={block.authorRole || ''}
          onChange={(e) => onChange({ ...block, authorRole: e.target.value })}
          placeholder="CEO"
        />
      </div>

      <div className="space-y-2">
        <Label>Empresa</Label>
        <Input
          value={block.authorCompany || ''}
          onChange={(e) => onChange({ ...block, authorCompany: e.target.value })}
          placeholder="Empresa XYZ"
        />
      </div>

      <div className="space-y-2">
        <Label>Foto do Autor</Label>
        <ImageUploader
          value={block.authorImage}
          onChange={(url) => onChange({ ...block, authorImage: url })}
          onRemove={() => onChange({ ...block, authorImage: undefined })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={block.showRating}
          onCheckedChange={(checked) => onChange({ ...block, showRating: checked })}
        />
        <Label className="text-sm whitespace-nowrap">Mostrar Avaliação</Label>
      </div>

      {block.showRating && (
        <div className="space-y-2">
          <Label>Avaliação (Estrelas)</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[block.rating || 5]}
              onValueChange={(value) => onChange({ ...block, rating: value[0] })}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8">{block.rating || 5}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${star <= (block.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Estilo Visual</Label>
        <Select
          value={block.style || 'default'}
          onValueChange={(value: any) => onChange({ ...block, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimalista</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="quote">Citação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cor Primária</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={block.primaryColor || '#3b82f6'}
            onChange={(e) => onChange({ ...block, primaryColor: e.target.value })}
            className="w-14 sm:w-20 h-10 shrink-0"
          />
          <Input
            type="text"
            value={block.primaryColor || '#3b82f6'}
            onChange={(e) => onChange({ ...block, primaryColor: e.target.value })}
            placeholder="#3b82f6"
            className="flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview</p>
        <div className={`${block.style === 'card' ? 'p-4 bg-background rounded-lg shadow-md' : ''}`}>
          {block.style === 'quote' && (
            <div className="text-6xl text-muted-foreground mb-2">"</div>
          )}
          <p className={`${block.style === 'minimal' ? 'text-sm' : 'text-base'} italic mb-3`}>
            "{block.quote}"
          </p>
          {block.showRating && (
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= (block.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            {block.authorImage && (
              <img
                src={block.authorImage}
                alt={block.authorName}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold" style={{ color: block.primaryColor }}>
                {block.authorName}
              </p>
              {(block.authorRole || block.authorCompany) && (
                <p className="text-sm text-muted-foreground">
                  {block.authorRole}
                  {block.authorRole && block.authorCompany && ' • '}
                  {block.authorCompany}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
