import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";
import { Images, Plus, Trash2 } from "lucide-react";
import type { GalleryBlock as GalleryBlockType } from "@/types/blocks";

interface GalleryBlockProps {
  block: GalleryBlockType;
  onChange: (block: GalleryBlockType) => void;
}

export const GalleryBlock = ({ block, onChange }: GalleryBlockProps) => {
  // Normalização defensiva
  const images = block.images || [];
  const safeBlock = { ...block, images };

  const updateBlock = (updates: Partial<GalleryBlockType>) => {
    onChange({ ...safeBlock, ...updates });
  };

  const addImage = () => updateBlock({ images: [...images, { url: '', alt: '', caption: '' }] });

  const updateImage = (index: number, updates: Partial<GalleryBlockType['images'][0]>) => {
    const imgs = [...images];
    imgs[index] = { ...imgs[index], ...updates };
    updateBlock({ images: imgs });
  };

  const removeImage = (index: number) => updateBlock({ images: images.filter((_, i) => i !== index) });

  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Images className="h-4 w-4" />
            <span>Galeria de Imagens</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addImage} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Imagem
          </Button>
        </div>

        {/* Content: Image list */}
        {images.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Images className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image, index) => (
              <Card key={index} className="bg-muted/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Imagem {index + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <ImageUploader value={image.url} onChange={(url) => updateImage(index, { url })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="Texto alternativo..." value={image.alt || ''} onChange={(e) => updateImage(index, { alt: e.target.value })} />
                    <Input placeholder="Legenda..." value={image.caption || ''} onChange={(e) => updateImage(index, { caption: e.target.value })} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Configure layout (grid/carrossel/masonry) no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
