import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Music, Upload, AlertCircle, HelpCircle } from "lucide-react";
import { AudioUploader } from "@/components/AudioUploader";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import type { AudioBlock as AudioBlockType } from "@/types/blocks";
import { useState } from "react";

interface AudioBlockProps {
  block: AudioBlockType;
  onChange: (block: AudioBlockType) => void;
}

export const AudioBlock = ({ block, onChange }: AudioBlockProps) => {
  const [activeTab, setActiveTab] = useState<string>("url");

  let allowVideoUpload = false;
  let usedMb = 0;
  let videoStorageLimitMb = 0;
  let usagePercentage = 0;

  try {
    const storage = useVideoStorage();
    allowVideoUpload = storage.allowVideoUpload;
    usedMb = storage.usedMb;
    videoStorageLimitMb = storage.videoStorageLimitMb;
    usagePercentage = storage.usagePercentage;
  } catch (err) {
    console.warn("[AudioBlock] Hook de storage falhou:", err);
  }

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>Áudio</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cole a URL ou faça upload. Configure legenda e autoplay no painel.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {allowVideoUpload && videoStorageLimitMb > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Armazenamento</span>
                <span>{usedMb.toFixed(1)}MB / {videoStorageLimitMb}MB</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL Externa</TabsTrigger>
              <TabsTrigger value="upload" disabled={!allowVideoUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`audio-url-${block.id}`}>URL do Áudio</Label>
                <Input
                  id={`audio-url-${block.id}`}
                  placeholder="https://exemplo.com/audio.mp3"
                  value={block.url}
                  onChange={(e) => onChange({ ...block, url: e.target.value, provider: 'external' })}
                />
                <p className="text-xs text-muted-foreground">MP3, WAV, OGG, M4A</p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              {allowVideoUpload ? (
                <AudioUploader
                  value={block.provider === 'uploaded' ? block.url : undefined}
                  onChange={(url) => onChange({ ...block, url, provider: 'uploaded' })}
                  onRemove={() => onChange({ ...block, url: '', provider: undefined })}
                />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Upload indisponível no plano atual.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {block.url && (
            <p className="text-xs text-muted-foreground">
              ✅ Áudio configurado • Ajuste legenda e autoplay no painel →
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
