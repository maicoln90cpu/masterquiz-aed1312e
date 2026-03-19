import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video as VideoIcon, Link, Upload, HelpCircle, Cloud, Zap, AlertCircle } from "lucide-react";
import type { VideoBlock as VideoBlockType } from "@/types/blocks";
import { VideoUploader } from "@/components/VideoUploader";
import { BunnyVideoUploader } from "@/components/BunnyVideoUploader";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { useVideoProvider } from "@/hooks/useVideoProvider";
import { useState } from "react";

interface VideoBlockProps {
  block: VideoBlockType;
  onChange: (block: VideoBlockType) => void;
}

export const VideoBlock = ({ block, onChange }: VideoBlockProps) => {
  const [bunnyVideoId, setBunnyVideoId] = useState<string | undefined>(block.bunnyVideoId);
  const [activeTab, setActiveTab] = useState<string>("url");

  // Hooks called unconditionally (React rules) — handle errors via returned state
  const storage = useVideoStorage();
  const provider = useVideoProvider();
  
  const allowVideoUpload = storage?.allowVideoUpload ?? false;
  const usedMb = storage?.usedMb ?? 0;
  const videoStorageLimitMb = storage?.videoStorageLimitMb ?? 0;
  const usagePercentage = storage?.usagePercentage ?? 0;
  const isBunny = provider?.isBunny ?? false;

  const detectProvider = (url: string): VideoBlockType['provider'] => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('quiz-media')) return 'uploaded';
    if (url.includes('b-cdn.net') || url.includes('bunnycdn')) return 'bunny_stream';
    return 'direct';
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...block, url, provider: detectProvider(url) });
  };

  const handleVideoUpload = (url: string) => {
    onChange({ ...block, url, provider: 'uploaded' });
  };

  const handleBunnyVideoUpload = (url: string, videoId: string) => {
    setBunnyVideoId(videoId);
    onChange({ ...block, url, provider: 'bunny_stream', bunnyVideoId: videoId });
  };

  const handleRemoveVideo = () => {
    setBunnyVideoId(undefined);
    onChange({ ...block, url: '', provider: 'direct', bunnyVideoId: undefined });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <VideoIcon className="h-4 w-4" />
            <span>Vídeo</span>
            {isBunny && (
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                CDN
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cole a URL ou faça upload. Configure reprodução no painel de propriedades.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Link className="h-4 w-4 shrink-0" />
                URL Externa
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" disabled={!allowVideoUpload}>
                <Upload className="h-4 w-4 shrink-0" />
                Upload
                {isBunny && <Zap className="h-3 w-3 text-primary shrink-0" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor={`video-url-${block.id}`}>URL do Vídeo</Label>
                <Input
                  id={`video-url-${block.id}`}
                  placeholder="https://youtube.com/watch?v=..."
                  value={block.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  YouTube, Vimeo ou link direto • {block.provider && `Detectado: ${block.provider}`}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              {allowVideoUpload ? (
                <>
                  {videoStorageLimitMb > 0 && (
                    <Alert>
                      <AlertDescription className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Armazenamento</span>
                          <span className="font-medium">{usedMb.toFixed(1)}MB / {videoStorageLimitMb}MB</span>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                      </AlertDescription>
                    </Alert>
                  )}
                  {isBunny ? (
                    <BunnyVideoUploader
                      value={block.url}
                      videoId={bunnyVideoId}
                      onChange={handleBunnyVideoUpload}
                      onRemove={handleRemoveVideo}
                    />
                  ) : (
                    <VideoUploader
                      value={block.url}
                      onChange={handleVideoUpload}
                      onRemove={handleRemoveVideo}
                    />
                  )}
                </>
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
              ✅ Vídeo configurado • Ajuste reprodução, tamanho e proporção no painel →
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
