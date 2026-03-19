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
import { useState, useMemo } from "react";

interface VideoBlockProps {
  block: VideoBlockType;
  onChange: (block: VideoBlockType) => void;
}

// Lazy-load heavy upload components only when needed
const LazyUploadContent = ({ block, onChange, bunnyVideoId, setBunnyVideoId }: {
  block: VideoBlockType;
  onChange: (block: VideoBlockType) => void;
  bunnyVideoId?: string;
  setBunnyVideoId: (id: string | undefined) => void;
}) => {
  // These hooks are now only called when Upload tab is rendered
  let storageData = { allowVideoUpload: false, usedMb: 0, videoStorageLimitMb: 0, usagePercentage: 0 };
  let providerData = { isBunny: false };

  try {
    // Dynamic imports would be ideal but hooks can't be conditional
    // Instead we wrap in try/catch for safety
    const { useVideoStorage } = require("@/hooks/useVideoStorage");
    const { useVideoProvider } = require("@/hooks/useVideoProvider");
    const storage = useVideoStorage();
    const provider = useVideoProvider();
    storageData = storage;
    providerData = provider;
  } catch (err) {
    console.warn("[VideoBlock] Hooks de storage/provider falharam:", err);
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Upload indisponível. Use URL externa.</AlertDescription>
      </Alert>
    );
  }

  const { allowVideoUpload, usedMb, videoStorageLimitMb, usagePercentage } = storageData;
  const { isBunny } = providerData;

  if (!allowVideoUpload) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Upload indisponível no plano atual. Use URL externa ou faça upgrade.</AlertDescription>
      </Alert>
    );
  }

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

  // Lazy import uploaders
  const VideoUploader = require("@/components/VideoUploader").VideoUploader;
  const BunnyVideoUploader = require("@/components/BunnyVideoUploader").BunnyVideoUploader;

  return (
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
  );
};

export const VideoBlock = ({ block, onChange }: VideoBlockProps) => {
  const [bunnyVideoId, setBunnyVideoId] = useState<string | undefined>(block.bunnyVideoId);
  const [activeTab, setActiveTab] = useState<string>("url");

  const detectProvider = (url: string): VideoBlockType['provider'] => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('quiz-media')) return 'uploaded';
    if (url.includes('b-cdn.net') || url.includes('bunnycdn')) return 'bunny_stream';
    return 'direct';
  };

  const handleUrlChange = (url: string) => {
    const provider = detectProvider(url);
    onChange({ ...block, url, provider });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <VideoIcon className="h-4 w-4" />
            <span>Vídeo</span>
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
              <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Upload className="h-4 w-4 shrink-0" />
                Upload
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
              <LazyUploadContent
                block={block}
                onChange={onChange}
                bunnyVideoId={bunnyVideoId}
                setBunnyVideoId={setBunnyVideoId}
              />
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
