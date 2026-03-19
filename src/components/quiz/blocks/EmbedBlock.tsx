import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code } from "lucide-react";
import type { EmbedBlock as EmbedBlockType } from "@/types/blocks";

interface EmbedBlockProps {
  block: EmbedBlockType;
  onChange: (block: EmbedBlockType) => void;
}

export const EmbedBlock = ({ block, onChange }: EmbedBlockProps) => {
  const updateBlock = (updates: Partial<EmbedBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const detectProvider = (url: string): string | undefined => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('spotify.com')) return 'Spotify';
    if (url.includes('forms.gle') || url.includes('docs.google.com/forms')) return 'Google Forms';
    return undefined;
  };

  const handleUrlChange = (url: string) => {
    updateBlock({ url, provider: detectProvider(url) });
  };

  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Code className="h-4 w-4" />
          <span>Conteúdo Incorporado (Embed)</span>
        </div>

        {/* Content: URL */}
        <div className="space-y-2">
          <Label htmlFor={`embed-url-${block.id}`}>URL ou Código Embed</Label>
          <Input
            id={`embed-url-${block.id}`}
            placeholder="https://... ou cole o código iframe"
            value={block.url}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            YouTube, Vimeo, Twitter, Instagram, Spotify, Google Forms...
            {block.provider && <span className="text-primary ml-1">✓ {block.provider}</span>}
          </p>
        </div>

        {/* Content: Custom HTML */}
        <div className="space-y-2">
          <Label htmlFor={`embed-html-${block.id}`}>Código HTML (opcional)</Label>
          <Textarea
            id={`embed-html-${block.id}`}
            placeholder="<iframe src='...'></iframe>"
            value={block.html || ''}
            onChange={(e) => updateBlock({ html: e.target.value })}
            rows={3}
            className="font-mono text-xs"
          />
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ Apenas incorpore conteúdo de fontes confiáveis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
