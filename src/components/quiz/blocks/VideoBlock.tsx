import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GripVertical, Video as VideoIcon, Link, Upload, HelpCircle, Cloud, Zap, Settings2, ChevronDown, Play, Gauge, Image, Subtitles } from "lucide-react";
import type { VideoBlock as VideoBlockType } from "@/types/blocks";
import { VideoUploader } from "@/components/VideoUploader";
import { BunnyVideoUploader } from "@/components/BunnyVideoUploader";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { useVideoProvider } from "@/hooks/useVideoProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ImageUploader";

interface VideoBlockProps {
  block: VideoBlockType;
  onChange: (block: VideoBlockType) => void;
}

export const VideoBlock = ({ block, onChange }: VideoBlockProps) => {
  const { allowVideoUpload, usedMb, videoStorageLimitMb, remainingMb, usagePercentage } = useVideoStorage();
  const { provider: videoProvider, isBunny } = useVideoProvider();
  const [bunnyVideoId, setBunnyVideoId] = useState<string | undefined>(block.bunnyVideoId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateBlock = (updates: Partial<VideoBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const detectProvider = (url: string): VideoBlockType['provider'] => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('quiz-media')) return 'uploaded';
    if (url.includes('b-cdn.net') || url.includes('bunnycdn')) return 'bunny_stream';
    return 'direct';
  };

  const handleUrlChange = (url: string) => {
    const provider = detectProvider(url);
    updateBlock({ url, provider });
  };

  const handleVideoUpload = (url: string) => {
    updateBlock({ url, provider: 'uploaded' });
  };

  const handleBunnyVideoUpload = (url: string, videoId: string) => {
    setBunnyVideoId(videoId);
    updateBlock({ url, provider: 'bunny_stream', bunnyVideoId: videoId });
  };

  const handleRemoveVideo = () => {
    setBunnyVideoId(undefined);
    updateBlock({ url: '', provider: 'direct', bunnyVideoId: undefined });
  };

  const handleThumbnailUpload = (url: string) => {
    updateBlock({ thumbnailUrl: url });
  };

  const handleRemoveThumbnail = () => {
    updateBlock({ thumbnailUrl: undefined });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4" />
              <VideoIcon className="h-4 w-4" />
              <span>Vídeo</span>
            </div>
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
                <p>Adicione vídeos do YouTube, Vimeo ou faça upload de arquivos MP4/WebM</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Link className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline">URL Externa</span>
                <span className="xs:hidden">URL</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3" disabled={!allowVideoUpload}>
                <Upload className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline">Upload</span>
                <span className="xs:hidden">Upload</span>
                {isBunny && <Zap className="h-3 w-3 text-primary shrink-0" />}
                {!allowVideoUpload && <span className="text-xs hidden sm:inline">(Premium)</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`video-url-${block.id}`}>URL do Vídeo</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cole o link do vídeo do YouTube, Vimeo ou link direto para arquivo de vídeo</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id={`video-url-${block.id}`}
                  placeholder="https://youtube.com/watch?v=..."
                  value={block.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Suporta: YouTube, Vimeo ou link direto para arquivo de vídeo
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`provider-${block.id}`}>Provedor</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Plataforma de hospedagem do vídeo. Detectado automaticamente pela URL</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={block.provider} onValueChange={(value: any) => updateBlock({ provider: value })}>
                  <SelectTrigger id={`provider-${block.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="direct">Arquivo Direto (MP4, WebM)</SelectItem>
                    <SelectItem value="bunny_stream">Stream CDN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              {allowVideoUpload ? (
                <>
                  {/* Storage usage display */}
                  {videoStorageLimitMb > 0 && (
                    <Alert>
                      <AlertDescription className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            Armazenamento usado
                            {isBunny && <Cloud className="h-3 w-3 text-primary" />}
                          </span>
                          <span className="font-medium">
                            {usedMb.toFixed(2)}MB / {videoStorageLimitMb}MB
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {remainingMb.toFixed(2)}MB disponíveis
                          {isBunny && " • CDN ativo"}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Conditional uploader based on provider */}
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
                  <AlertDescription>
                    Upload de vídeos não está disponível no seu plano atual. 
                    Faça upgrade para desbloquear esta funcionalidade.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`video-size-${block.id}`}>Tamanho</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tamanho do player de vídeo no quiz</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={block.size || 'medium'} onValueChange={(value: any) => updateBlock({ size: value })}>
                <SelectTrigger id={`video-size-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="full">Largura Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`aspect-ratio-${block.id}`}>Proporção</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Proporção de aspecto do vídeo</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={block.aspectRatio || '16:9'} onValueChange={(value: any) => updateBlock({ aspectRatio: value })}>
                <SelectTrigger id={`aspect-ratio-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="4:3">4:3 (Padrão)</SelectItem>
                  <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`caption-${block.id}`}>Legenda (opcional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descrição ou título que aparece abaixo do vídeo</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`caption-${block.id}`}
              placeholder="Descrição do vídeo..."
              value={block.caption || ''}
              onChange={(e) => updateBlock({ caption: e.target.value })}
            />
          </div>

          {/* Advanced Settings Collapsible */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-2 hover:bg-muted/50">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Configurações Avançadas
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Playback Settings */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Play className="h-4 w-4" />
                  Reprodução
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`autoplay-${block.id}`} className="text-sm cursor-pointer">
                      Autoplay
                    </Label>
                    <Switch
                      id={`autoplay-${block.id}`}
                      checked={block.autoplay || false}
                      onCheckedChange={(checked) => updateBlock({ 
                        autoplay: checked, 
                        muted: checked ? true : block.muted // Autoplay requires muted
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`muted-${block.id}`} className="text-sm cursor-pointer">
                      Mutado
                    </Label>
                    <Switch
                      id={`muted-${block.id}`}
                      checked={block.muted || false}
                      onCheckedChange={(checked) => updateBlock({ muted: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`loop-${block.id}`} className="text-sm cursor-pointer">
                      Loop
                    </Label>
                    <Switch
                      id={`loop-${block.id}`}
                      checked={block.loop || false}
                      onCheckedChange={(checked) => updateBlock({ loop: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`hide-controls-${block.id}`} className="text-sm cursor-pointer">
                      Ocultar Controles
                    </Label>
                    <Switch
                      id={`hide-controls-${block.id}`}
                      checked={block.hideControls || false}
                      onCheckedChange={(checked) => updateBlock({ hideControls: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between col-span-2">
                    <Label htmlFor={`hide-play-${block.id}`} className="text-sm cursor-pointer">
                      Ocultar Botão Play Central
                    </Label>
                    <Switch
                      id={`hide-play-${block.id}`}
                      checked={block.hidePlayButton || false}
                      onCheckedChange={(checked) => updateBlock({ hidePlayButton: checked })}
                    />
                  </div>
                </div>

                {block.autoplay && (
                  <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
                    ⚠️ Autoplay requer que o vídeo comece mutado (política dos navegadores)
                  </p>
                )}
              </div>

              {/* Speed & Time Settings */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Gauge className="h-4 w-4" />
                  Velocidade e Tempo
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`speed-${block.id}`}>Velocidade Padrão</Label>
                  <Select 
                    value={String(block.playbackSpeed || 1)} 
                    onValueChange={(value) => updateBlock({ playbackSpeed: parseFloat(value) })}
                  >
                    <SelectTrigger id={`speed-${block.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x (Lento)</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x (Normal)</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x (Rápido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`start-time-${block.id}`}>Iniciar em (segundos)</Label>
                    <Input
                      id={`start-time-${block.id}`}
                      type="number"
                      min={0}
                      placeholder="0"
                      value={block.startTime || ''}
                      onChange={(e) => updateBlock({ startTime: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`end-time-${block.id}`}>Parar em (segundos)</Label>
                    <Input
                      id={`end-time-${block.id}`}
                      type="number"
                      min={0}
                      placeholder="Final"
                      value={block.endTime || ''}
                      onChange={(e) => updateBlock({ endTime: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>

              {/* Thumbnail & Captions Settings */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Image className="h-4 w-4" />
                  Thumbnail e Legendas
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail Customizado</Label>
                  <ImageUploader
                    value={block.thumbnailUrl || ''}
                    onChange={handleThumbnailUpload}
                    onRemove={handleRemoveThumbnail}
                  />
                  <p className="text-xs text-muted-foreground">
                    Imagem exibida antes do vídeo iniciar
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`show-captions-${block.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <Subtitles className="h-4 w-4" />
                      Mostrar Legendas
                    </Label>
                    <Switch
                      id={`show-captions-${block.id}`}
                      checked={block.showCaptions ?? true}
                      onCheckedChange={(checked) => updateBlock({ showCaptions: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`captions-url-${block.id}`}>URL do Arquivo de Legendas (VTT)</Label>
                  <Input
                    id={`captions-url-${block.id}`}
                    placeholder="https://example.com/subtitles.vtt"
                    value={block.captionsUrl || ''}
                    onChange={(e) => updateBlock({ captionsUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Arquivo de legendas no formato WebVTT (.vtt)
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
