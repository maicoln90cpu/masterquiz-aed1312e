import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Music, Upload, AlertCircle, HelpCircle } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import type { AudioBlock as AudioBlockType } from "@/types/blocks";

interface AudioBlockProps {
  block: AudioBlockType;
  onChange: (block: AudioBlockType) => void;
}

export const AudioBlock = ({ block, onChange }: AudioBlockProps) => {
  const { 
    allowVideoUpload, 
    videoStorageLimitMb, 
    usedMb, 
    remainingMb, 
    usagePercentage 
  } = useVideoStorage();

  const updateBlock = (updates: Partial<AudioBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const handleAudioUpload = (url: string) => {
    updateBlock({ url, provider: 'uploaded' });
  };

  const handleRemoveAudio = () => {
    updateBlock({ url: '', provider: undefined });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <Music className="h-4 w-4" />
            <span>Áudio</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione arquivos de áudio para narração, podcasts ou músicas</p>
              </TooltipContent>
            </Tooltip>
          </div>

        {allowVideoUpload && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Armazenamento usado</span>
              <span>{usedMb.toFixed(2)}MB / {videoStorageLimitMb}MB</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            
            {usagePercentage >= 100 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Limite de armazenamento atingido. Remova arquivos ou faça upgrade do plano.
                </AlertDescription>
              </Alert>
            )}
            
            {usagePercentage >= 80 && usagePercentage < 100 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Você está usando {usagePercentage.toFixed(0)}% do seu armazenamento.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL Externa</TabsTrigger>
            <TabsTrigger value="upload" disabled={!allowVideoUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`audio-url-${block.id}`}>URL do Áudio</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Link direto para arquivo de áudio hospedado externamente</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id={`audio-url-${block.id}`}
                placeholder="https://exemplo.com/audio.mp3"
                value={block.url}
                onChange={(e) => updateBlock({ url: e.target.value, provider: 'external' })}
              />
              <p className="text-xs text-muted-foreground">
                Formatos suportados: MP3, WAV, OGG, M4A
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {allowVideoUpload ? (
              <AudioUploader
                value={block.provider === 'uploaded' ? block.url : undefined}
                onChange={handleAudioUpload}
                onRemove={handleRemoveAudio}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload de áudio não disponível no seu plano. Faça upgrade para desbloquear.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`caption-${block.id}`}>Descrição (opcional)</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Nome ou descrição do áudio que aparece para os usuários</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id={`caption-${block.id}`}
            placeholder="Nome ou descrição do áudio..."
            value={block.caption || ''}
            onChange={(e) => updateBlock({ caption: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              id={`autoplay-${block.id}`}
              checked={block.autoplay}
              onCheckedChange={(checked) => updateBlock({ autoplay: checked })}
            />
            <Label htmlFor={`autoplay-${block.id}`} className="cursor-pointer whitespace-nowrap text-sm">
              Reproduzir automaticamente
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>O áudio começa a tocar automaticamente quando o usuário visualiza esta pergunta</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
