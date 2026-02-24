import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, Play, Pause, ChevronDown, X, User } from "lucide-react";
import type { QuizBlock, VideoBlock } from "@/types/blocks";
import { normalizeOption } from "@/types/blocks";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { CustomVideoPlayer } from "@/components/video/CustomVideoPlayer";
import { sanitizeHtml, sanitizeSimpleText } from "@/lib/sanitize";

// Simplified media player with direct src approach
const MediaPlayer = ({ url, type }: { url: string; type: 'video' | 'audio' }) => {
  const [error, setError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement, Event>) => {
    console.error(`❌ ${type} playback error:`, e);
    console.error(`❌ URL:`, url);
    setError(true);
  };

  if (error || !url) {
    return (
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Não foi possível reproduzir o {type === 'video' ? 'vídeo' : 'áudio'} diretamente.</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Clique aqui para abrir em nova aba →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        crossOrigin="anonymous"
        preload="metadata"
        className="w-full rounded-lg"
        playsInline
        onError={handleError}
      >
        Seu navegador não suporta vídeo.
      </video>
    );
  }

  return <AudioPlayerWhatsApp url={url} />;
};

// Player de áudio estilo WhatsApp
const AudioPlayerWhatsApp = ({ url }: { url: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changeSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    
    audio.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-3 max-w-md">
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button
        onClick={togglePlay}
        className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <button
            onClick={changeSpeed}
            className="hover:text-foreground transition-colors font-medium"
          >
            {playbackSpeed}x
          </button>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

interface QuizBlockPreviewProps {
  blocks: QuizBlock[];
  showNavigationButton?: boolean;
  wrapInCard?: boolean;
  nextButtonText?: string;
  onNavigateNext?: () => void;
  onNavigateToQuestion?: (index: number) => void;
  // Props para renderização interativa do bloco question
  selectedAnswer?: string | string[];
  onAnswerSelect?: (value: string, isMultiple: boolean) => void;
}

export const QuizBlockPreview = ({ 
  blocks, 
  showNavigationButton = true, 
  wrapInCard = true,
  nextButtonText = "Próxima Pergunta",
  onNavigateNext,
  onNavigateToQuestion,
  selectedAnswer,
  onAnswerSelect
}: QuizBlockPreviewProps) => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Função para rastrear eventos do Facebook Pixel
  const trackFacebookPixelEvent = useCallback((eventName: string, params: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        if (eventName === 'VideoView') {
          (window as any).fbq('track', eventName, params);
        } else {
          (window as any).fbq('trackCustom', eventName, params);
        }
        console.log(`Facebook Pixel: ${eventName}`, params);
      } catch (error) {
        console.error('Erro ao enviar evento para Facebook Pixel:', error);
      }
    }
  }, []);

  // Configurar tracking de vídeo HTML5
  const setupVideoTracking = useCallback((videoEl: HTMLVideoElement | null, block: VideoBlock) => {
    if (!videoEl || videoRefs.current.has(block.id)) return;
    
    videoRefs.current.set(block.id, videoEl);
    
    let tracked25 = false;
    let tracked50 = false;
    let tracked75 = false;
    let tracked100 = false;
    let hasStarted = false;

    // Evento: play
    const handlePlay = () => {
      if (!hasStarted) {
        hasStarted = true;
        trackFacebookPixelEvent('VideoView', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          video_type: block.provider || 'direct'
        });
      }
    };

    // Evento: progresso do vídeo
    const handleTimeUpdate = () => {
      if (!videoEl.duration) return;
      
      const percent = (videoEl.currentTime / videoEl.duration) * 100;
      
      if (percent >= 25 && !tracked25) {
        tracked25 = true;
        trackFacebookPixelEvent('VideoProgress25', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          percentage: 25
        });
      }
      
      if (percent >= 50 && !tracked50) {
        tracked50 = true;
        trackFacebookPixelEvent('VideoProgress50', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          percentage: 50
        });
      }
      
      if (percent >= 75 && !tracked75) {
        tracked75 = true;
        trackFacebookPixelEvent('VideoProgress75', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          percentage: 75
        });
      }
      
      if (percent >= 99 && !tracked100) {
        tracked100 = true;
        trackFacebookPixelEvent('VideoComplete', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          percentage: 100
        });
      }
    };

    // Evento: vídeo terminou
    const handleEnded = () => {
      if (!tracked100) {
        tracked100 = true;
        trackFacebookPixelEvent('VideoComplete', {
          content_name: block.caption || 'Quiz Video',
          video_url: block.url,
          percentage: 100
        });
      }
    };

    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('ended', handleEnded);
    };
  }, [trackFacebookPixelEvent]);

  // Para YouTube/Vimeo iframes - tracking básico no load
  const handleIframeLoad = useCallback((block: VideoBlock) => {
    trackFacebookPixelEvent('VideoView', {
      content_name: block.caption || 'Quiz Video',
      video_url: block.url,
      video_type: block.provider || 'iframe',
      note: 'Iframe tracking - eventos de progresso não disponíveis'
    });
  }, [trackFacebookPixelEvent]);

  const renderBlock = (block: QuizBlock) => {
    switch (block.type) {
      case "question":
        const emojis = block.emojis || [];
        const isInteractive = !!onAnswerSelect;
        const currentSelection = selectedAnswer || [];
        const selectedArray = Array.isArray(currentSelection) ? currentSelection : [currentSelection];
        
        const handleOptionClick = (option: string, isMultiple: boolean) => {
          if (onAnswerSelect) {
            onAnswerSelect(option, isMultiple);
          }
        };

        return (
          <div key={block.id} className="space-y-4">
            <div>
              <h3 
                className="text-xl font-semibold mb-2"
                dangerouslySetInnerHTML={{ __html: sanitizeSimpleText(block.questionText) }}
              />
              {block.subtitle && (
                <p 
                  className="text-sm text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: sanitizeSimpleText(block.subtitle) }}
                />
              )}
              {block.hint && (
                <p className="text-xs text-muted-foreground italic mb-4">
                  💡 {block.hint}
                </p>
              )}
            </div>

            {block.answerFormat === "yes_no" && (
              <RadioGroup 
                value={selectedArray[0] || ''} 
                onValueChange={isInteractive ? (v) => handleOptionClick(v, false) : undefined}
                className="space-y-2"
              >
                {(block.options || ['Sim', 'Não']).map((rawOption, idx) => {
                  const option = normalizeOption(rawOption);
                  const isSelected = selectedArray.includes(option);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                        isInteractive ? 'cursor-pointer' : ''
                      } ${isSelected ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                      onClick={isInteractive ? () => handleOptionClick(option, false) : undefined}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {emojis[idx] || (idx === 0 ? '✅' : '❌')}
                      </div>
                      <RadioGroupItem value={option} id={`${block.id}-${idx}`} className="sr-only" />
                      <Label htmlFor={`${block.id}-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {block.answerFormat === "single_choice" && block.options && (
              <RadioGroup 
                value={selectedArray[0] || ''} 
                onValueChange={isInteractive ? (v) => handleOptionClick(v, false) : undefined}
                className="space-y-2"
              >
                {block.options.map((rawOption, idx) => {
                  const option = normalizeOption(rawOption);
                  const isSelected = selectedArray.includes(option);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                        isInteractive ? 'cursor-pointer' : ''
                      } ${isSelected ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                      onClick={isInteractive ? () => handleOptionClick(option, false) : undefined}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {emojis[idx] || String.fromCharCode(65 + idx)}
                      </div>
                      <RadioGroupItem value={option} id={`${block.id}-${idx}`} className="sr-only" />
                      <Label htmlFor={`${block.id}-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </RadioGroup>
            )}

            {block.answerFormat === "multiple_choice" && block.options && (
              <div className="space-y-2">
                {block.options.map((rawOption, idx) => {
                  const option = normalizeOption(rawOption);
                  const isSelected = selectedArray.includes(option);
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                        isInteractive ? 'cursor-pointer' : ''
                      } ${isSelected ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:border-primary/50'}`}
                      onClick={isInteractive ? () => handleOptionClick(option, true) : undefined}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {emojis[idx] || String.fromCharCode(65 + idx)}
                      </div>
                      <Checkbox id={`${block.id}-${idx}`} checked={isSelected} className="sr-only" />
                      <Label htmlFor={`${block.id}-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            )}

            {block.answerFormat === "short_text" && (
              <Input placeholder="Digite sua resposta..." />
            )}
          </div>
        );

      case "text":
        return (
          <div
            key={block.id}
            className={`prose prose-sm max-w-none text-${block.alignment || "left"} ${
              block.fontSize === "small"
                ? "text-sm"
                : block.fontSize === "large"
                ? "text-lg"
                : "text-base"
            }`}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
          />
        );

      case "separator":
        return block.style === "space" ? (
          <div key={block.id} className="my-6 h-8" />
        ) : (
          <div
            key={block.id}
            className="my-6 w-full"
            style={{
              borderTopWidth: block.thickness === "thin" ? "1px" : block.thickness === "thick" ? "4px" : "2px",
              borderTopStyle: block.style === "dots" ? "dotted" : block.style === "dashes" ? "dashed" : "solid",
              borderTopColor: block.color || "hsl(var(--border))",
            }}
          />
        );

      case "image":
        return block.url ? (
          <div key={block.id} className="space-y-2 w-full overflow-hidden">
            <img
              src={block.url}
              alt={block.alt || "Quiz image"}
              className={`rounded-lg w-full h-auto object-contain mx-auto ${
                block.size === "small"
                  ? "max-w-xs"
                  : block.size === "large"
                  ? "max-w-2xl"
                  : block.size === "full"
                  ? "w-full"
                  : "max-w-md"
              }`}
              loading="lazy"
            />
            {block.caption && (
              <p className="text-sm text-center text-muted-foreground">
                {block.caption}
              </p>
            )}
          </div>
        ) : null;

      case "video":
        return block.url ? (
          <div key={block.id} className="space-y-2">
            <div className={`rounded-lg overflow-hidden bg-muted ${
              block.size === "small"
                ? "max-w-xs mx-auto"
                : block.size === "large"
                ? "max-w-2xl mx-auto"
                : block.size === "full"
                ? "w-full"
                : "max-w-md mx-auto"
            }`}>
              {/* YouTube iframe */}
              {block.provider === "youtube" && (
                <div className="aspect-video">
                  <iframe
                    src={`${block.url.replace("watch?v=", "embed/")}${block.autoplay ? '?autoplay=1' : ''}${block.muted ? '&mute=1' : ''}${block.loop ? '&loop=1' : ''}${block.startTime ? `&start=${block.startTime}` : ''}${block.endTime ? `&end=${block.endTime}` : ''}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay"
                    onLoad={() => handleIframeLoad(block)}
                  />
                </div>
              )}
              
              {/* Vimeo iframe */}
              {block.provider === "vimeo" && (
                <div className="aspect-video">
                  <iframe
                    src={`${block.url.replace("vimeo.com/", "player.vimeo.com/video/")}${block.autoplay ? '?autoplay=1' : ''}${block.muted ? '&muted=1' : ''}${block.loop ? '&loop=1' : ''}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay"
                    onLoad={() => handleIframeLoad(block)}
                  />
                </div>
              )}
              
              {/* Custom player for direct, uploaded, and bunny_stream videos */}
              {(block.provider === "direct" || block.provider === "uploaded" || block.provider === "bunny_stream") && (
                <CustomVideoPlayer
                  src={block.url}
                  poster={block.thumbnailUrl}
                  captionsUrl={block.captionsUrl}
                  autoplay={block.autoplay}
                  muted={block.muted}
                  loop={block.loop}
                  hideControls={block.hideControls}
                  hidePlayButton={block.hidePlayButton}
                  startTime={block.startTime}
                  endTime={block.endTime}
                  playbackSpeed={block.playbackSpeed}
                  showCaptions={block.showCaptions}
                  aspectRatio={block.aspectRatio}
                  onPlay={() => {
                    trackFacebookPixelEvent('VideoView', {
                      content_name: block.caption || 'Quiz Video',
                      video_url: block.url,
                      video_type: block.provider || 'direct'
                    });
                  }}
                  onProgress={(percentage) => {
                    if (percentage >= 25 && percentage < 26) {
                      trackFacebookPixelEvent('VideoProgress25', {
                        content_name: block.caption || 'Quiz Video',
                        video_url: block.url,
                        percentage: 25
                      });
                    }
                    if (percentage >= 50 && percentage < 51) {
                      trackFacebookPixelEvent('VideoProgress50', {
                        content_name: block.caption || 'Quiz Video',
                        video_url: block.url,
                        percentage: 50
                      });
                    }
                    if (percentage >= 75 && percentage < 76) {
                      trackFacebookPixelEvent('VideoProgress75', {
                        content_name: block.caption || 'Quiz Video',
                        video_url: block.url,
                        percentage: 75
                      });
                    }
                  }}
                  onEnded={() => {
                    trackFacebookPixelEvent('VideoComplete', {
                      content_name: block.caption || 'Quiz Video',
                      video_url: block.url,
                      percentage: 100
                    });
                  }}
                />
              )}
            </div>
            {block.caption && (
              <p className="text-sm text-center text-muted-foreground">
                {block.caption}
              </p>
            )}
          </div>
        ) : null;

      case "audio":
        return block.url ? (
          <div key={block.id} className="space-y-2">
            <MediaPlayer url={block.url} type="audio" />
            {block.caption && (
              <p className="text-sm text-muted-foreground">{block.caption}</p>
            )}
          </div>
        ) : null;

      case "gallery":
        return block.images.length > 0 ? (
          <div key={block.id} className="space-y-2">
            <div
              className={
                block.layout === "carousel"
                  ? "flex gap-4 overflow-x-auto"
                  : block.layout === "masonry"
                  ? "columns-2 md:columns-3 gap-4"
                  : "grid grid-cols-2 md:grid-cols-3 gap-4"
              }
            >
              {block.images.map((img, idx) => (
                <div key={idx} className="space-y-1">
                  <img
                    src={img.url}
                    alt={img.alt || `Gallery image ${idx + 1}`}
                    className="rounded-lg w-full"
                  />
                  {img.caption && (
                    <p className="text-xs text-muted-foreground">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case "embed":
        return block.html ? (
          <div
            key={block.id}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
            className="rounded-lg overflow-hidden"
          />
        ) : block.url ? (
          <iframe
            key={block.id}
            src={block.url}
            className="w-full aspect-video rounded-lg"
          />
        ) : null;

      case "button": {
        if (!block.text) return null;
        
        const action = block.action || 'link';
        
        // Handler para ações de navegação
        const handleButtonClick = () => {
          if (action === 'next_question' && onNavigateNext) {
            onNavigateNext();
          } else if (action === 'go_to_question' && onNavigateToQuestion && block.targetQuestionIndex) {
            // targetQuestionIndex é 1-based para o usuário, converter para 0-based
            onNavigateToQuestion(block.targetQuestionIndex - 1);
          }
        };
        
        // Se é link externo, usar anchor
        if (action === 'link' && block.url) {
          return (
            <div key={block.id} className="flex justify-center">
              <Button
                variant={block.variant || 'default'}
                size={block.size || 'default'}
                asChild
              >
                <a 
                  href={block.url} 
                  target={block.openInNewTab ? "_blank" : undefined}
                  rel={block.openInNewTab ? "noopener noreferrer" : undefined}
                >
                  {block.text}
                </a>
              </Button>
            </div>
          );
        }
        
        // Para ações de navegação ou link sem URL
        return (
          <div key={block.id} className="flex justify-center">
            <Button
              variant={block.variant || 'default'}
              size={block.size || 'default'}
              onClick={handleButtonClick}
            >
              {block.text}
            </Button>
          </div>
        );
      }

      case "price":
        return (
          <div key={block.id}>
            <Card className={block.highlighted ? "border-2 border-primary shadow-lg" : ""}>
              <CardContent className="p-6 space-y-4">
                {block.discount && (
                  <div className="inline-block bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                    {block.discount}
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold">{block.planName}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    {block.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {block.currency}{block.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary">
                      {block.currency}{block.price}
                    </span>
                    {block.period && (
                      <span className="text-muted-foreground">{block.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2">
                  {block.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {block.buttonText && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    asChild={!!block.buttonUrl}
                  >
                    {block.buttonUrl ? (
                      <a href={block.buttonUrl} target="_blank" rel="noopener noreferrer">
                        {block.buttonText}
                      </a>
                    ) : (
                      <span>{block.buttonText}</span>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "metrics":
        const rawMetricsData = (block as any).data ?? (block as any).dataPoints ?? [];
        const metricsData = Array.isArray(rawMetricsData) ? rawMetricsData : [];
        return metricsData.length > 0 ? (
          <div key={block.id} className="space-y-4">
            <h3 className="text-xl font-semibold text-center">{block.title}</h3>
            <div className="bg-card rounded-lg p-4 border">
              <ResponsiveContainer width="100%" height={300}>
                {(() => {
                  const chartData = metricsData.map((d: any) => ({
                    name: d.label,
                    value: d.value,
                    fill: d.color || '#3b82f6'
                  }));

                  switch (block.chartType) {
                    case 'bar':
                      return (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          {block.showValues && <Tooltip />}
                          {block.showLegend && <Legend />}
                          <Bar dataKey="value">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      );
                    
                    case 'line':
                      return (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          {block.showValues && <Tooltip />}
                          {block.showLegend && <Legend />}
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      );
                    
                    case 'pie':
                    case 'donut':
                      return (
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={block.chartType === 'donut' ? 60 : 0}
                            outerRadius={100}
                            label={block.showValues}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          {block.showValues && <Tooltip />}
                          {block.showLegend && <Legend />}
                        </PieChart>
                      );
                  }
                })()}
              </ResponsiveContainer>
            </div>
          </div>
        ) : null;

      case "loading":
        return <LoadingBlockPreview key={block.id} block={block} />;

      case "progress":
        return <ProgressBlockPreview key={block.id} block={block} currentQuestion={0} totalQuestions={10} />;

      case "countdown":
        return <CountdownBlockPreview key={block.id} block={block} />;

      case "testimonial":
        return <TestimonialBlockPreview key={block.id} block={block} />;

      case "slider":
        return <SliderBlockPreview key={block.id} block={block} />;

      case "textInput":
        return <TextInputBlockPreview key={block.id} block={block} />;

      case "nps":
        return <NPSBlockPreview key={block.id} block={block} />;

      case "accordion":
        return <AccordionBlockPreview key={block.id} block={block} />;

      case "comparison":
        return <ComparisonBlockPreview key={block.id} block={block} />;

      case "socialProof":
        return <SocialProofBlockPreview key={block.id} block={block} />;

      default:
        return null;
    }
  };

  const content = blocks.length === 0 ? (
    <p className="text-center text-muted-foreground">
      Adicione blocos para visualizar o preview
    </p>
  ) : (
    <>
      {blocks.map((block) => renderBlock(block))}
      {showNavigationButton && (
        <Button className="w-full" size="lg" onClick={onNavigateNext}>
          {nextButtonText}
        </Button>
      )}
    </>
  );

  if (!wrapInCard) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card className="border-2">
      <CardContent className="p-8 space-y-8">
        {content}
      </CardContent>
    </Card>
  );
};

// Componente separado para Loading com timer
const LoadingBlockPreview = ({ block }: { block: QuizBlock & { type: 'loading' } }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (block.duration * 10));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [block.duration]);

  const renderSpinner = () => {
    switch (block.spinnerType) {
      case 'spinner':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      
      case 'dots':
        return (
          <div className="flex gap-3">
            <div className="h-4 w-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-4 w-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-4 w-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      case 'pulse':
        return (
          <div className="h-16 w-16 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary animate-pulse" />
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex gap-2 items-end h-12">
            <div className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0ms' }} />
            <div className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '100ms' }} />
            <div className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '200ms' }} />
            <div className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '300ms' }} />
            <div className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '400ms' }} />
          </div>
        );
    }
  };

  const isComplete = progress >= 100;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      {!isComplete ? (
        <>
          {renderSpinner()}
          {block.message && (
            <p className="text-lg text-muted-foreground">{block.message}</p>
          )}
          <div className="w-full max-w-xs space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% • {Math.ceil((100 - progress) / 100 * block.duration)}s restantes
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          {block.completionMessage && (
            <p className="text-lg font-medium text-foreground">{block.completionMessage}</p>
          )}
        </>
      )}
    </div>
  );
};

// Progress Block Preview
const ProgressBlockPreview = ({ 
  block, 
  currentQuestion, 
  totalQuestions 
}: { 
  block: QuizBlock & { type: 'progress' }; 
  currentQuestion: number;
  totalQuestions: number;
}) => {
  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
  const heightClass = block.height === 'thin' ? 'h-1' : block.height === 'thick' ? 'h-3' : 'h-2';

  return (
    <div className="space-y-3">
      {block.style === 'bar' && (
        <div className={`w-full bg-secondary rounded-full ${heightClass}`}>
          <div
            className={`${heightClass} rounded-full ${block.animated ? 'transition-all duration-500' : ''}`}
            style={{ width: `${progress}%`, backgroundColor: block.color }}
          />
        </div>
      )}
      {block.style === 'steps' && (
        <div className="flex gap-2">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${heightClass} rounded-full ${block.animated ? 'transition-all duration-300' : ''}`}
              style={{ backgroundColor: i < currentQuestion ? block.color : '#e5e7eb' }}
            />
          ))}
        </div>
      )}
      {block.style === 'circle' && (
        <div className="flex justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke={block.color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className={block.animated ? 'transition-all duration-500' : ''}
            />
          </svg>
        </div>
      )}
      {block.style === 'percentage' && (
        <div className="text-center text-4xl font-bold" style={{ color: block.color }}>
          {Math.round(progress)}%
        </div>
      )}
      {block.showPercentage && block.style !== 'percentage' && (
        <p className="text-sm text-center font-medium" style={{ color: block.color }}>
          {Math.round(progress)}%
        </p>
      )}
      {block.showCounter && (
        <p className="text-sm text-center text-muted-foreground">
          Pergunta {currentQuestion} de {totalQuestions}
        </p>
      )}
    </div>
  );
};

// Countdown Block Preview
const CountdownBlockPreview = ({ block }: { block: QuizBlock & { type: 'countdown' } }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (block.mode === 'date' && block.targetDate) {
      const target = new Date(block.targetDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      return diff;
    }
    return block.duration || 300;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0 && block.expiryMessage) {
    return (
      <div className="text-center p-6 rounded-lg" style={{ backgroundColor: block.secondaryColor }}>
        <p className="text-xl font-semibold" style={{ color: block.primaryColor }}>
          {block.expiryMessage}
        </p>
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className={`text-center ${block.style === 'card' ? 'p-4 bg-background rounded-lg shadow-md' : ''}`}>
      <div 
        className={`${block.style === 'bold' ? 'text-4xl font-bold' : block.style === 'minimal' ? 'text-2xl font-medium' : 'text-3xl font-semibold'}`}
        style={{ color: block.primaryColor }}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-muted-foreground mt-1 uppercase">{label}</div>
    </div>
  );

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {block.showDays && <TimeUnit value={days} label="dias" />}
      {block.showHours && <TimeUnit value={hours} label="horas" />}
      {block.showMinutes && <TimeUnit value={minutes} label="min" />}
      {block.showSeconds && <TimeUnit value={seconds} label="seg" />}
    </div>
  );
};

// Testimonial Block Preview
const TestimonialBlockPreview = ({ block }: { block: QuizBlock & { type: 'testimonial' } }) => {
  return (
    <div className={`${block.style === 'card' ? 'p-6 bg-background rounded-lg shadow-lg border' : 'py-4'}`}>
      {block.style === 'quote' && (
        <div className="text-6xl text-muted-foreground/30 leading-none mb-2">"</div>
      )}
      <p className={`${block.style === 'minimal' ? 'text-sm' : 'text-base'} italic mb-4 text-foreground`}>
        "{block.quote}"
      </p>
      {block.showRating && block.rating && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${i < block.rating! ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4">
        {block.authorImage && (
          <img
            src={block.authorImage}
            alt={block.authorName}
            className="w-14 h-14 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-base" style={{ color: block.primaryColor }}>
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
  );
};

// Slider Block Preview
const SliderBlockPreview = ({ block }: { block: QuizBlock & { type: 'slider' } }) => {
  const [value, setValue] = useState(block.defaultValue ?? block.min);

  return (
    <div className="space-y-4">
      <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{block.min}{block.unit}</span>
        <Slider
          value={[value]}
          min={block.min}
          max={block.max}
          step={block.step}
          onValueChange={(v) => setValue(v[0])}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground">{block.max}{block.unit}</span>
      </div>
      {block.showValue && (
        <p className="text-center text-2xl font-bold text-primary">
          {value}{block.unit}
        </p>
      )}
    </div>
  );
};

// Text Input Block Preview
const TextInputBlockPreview = ({ block }: { block: QuizBlock & { type: 'textInput' } }) => {
  return (
    <div className="space-y-2">
      <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
      {block.multiline ? (
        <textarea
          placeholder={block.placeholder}
          maxLength={block.maxLength}
          className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-none bg-background"
        />
      ) : (
        <Input
          placeholder={block.placeholder}
          maxLength={block.maxLength}
          type={block.validation === 'email' ? 'email' : block.validation === 'number' ? 'number' : 'text'}
        />
      )}
      {block.maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          Máximo: {block.maxLength} caracteres
        </p>
      )}
    </div>
  );
};

// NPS Block Preview
const NPSBlockPreview = ({ block }: { block: QuizBlock & { type: 'nps' } }) => {
  const [value, setValue] = useState<number | null>(null);

  const getNPSColor = (v: number) => {
    if (v <= 6) return "bg-red-500";
    if (v <= 8) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-center">{block.question}</p>
      
      {block.showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{block.lowLabel}</span>
          <span>{block.highLabel}</span>
        </div>
      )}
      
      <div className="flex justify-center gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => setValue(i)}
            className={`w-9 h-9 rounded-full font-semibold text-sm transition-all ${
              value === i
                ? `${getNPSColor(i)} text-white scale-110 shadow-lg`
                : "bg-muted hover:bg-muted/80 text-foreground"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      
      {value !== null && (
        <p className={`text-center text-sm font-medium ${
          value <= 6 ? "text-red-600" : value <= 8 ? "text-yellow-600" : "text-green-600"
        }`}>
          {value <= 6 ? "Detrator" : value <= 8 ? "Neutro" : "Promotor"} ({value})
        </p>
      )}
    </div>
  );
};

// Accordion Block Preview
const AccordionBlockPreview = ({ block }: { block: QuizBlock & { type: 'accordion' } }) => {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{block.title}</h3>
      <div className="space-y-2">
        {block.items.map((item, index) => (
          <div key={index} className="border rounded-lg">
            <div className="p-3 font-medium bg-muted/50 flex items-center justify-between">
              {item.question}
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Comparison Block Preview
const ComparisonBlockPreview = ({ block }: { block: QuizBlock & { type: 'comparison' } }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={`p-4 rounded-lg ${block.leftStyle === 'negative' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
        <h4 className={`font-semibold mb-3 ${block.leftStyle === 'negative' ? 'text-red-600' : ''}`}>{block.leftTitle}</h4>
        <ul className="space-y-2">
          {block.leftItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <X className="h-4 w-4 text-red-500" />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`p-4 rounded-lg ${block.rightStyle === 'positive' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'}`}>
        <h4 className={`font-semibold mb-3 ${block.rightStyle === 'positive' ? 'text-green-600' : ''}`}>{block.rightTitle}</h4>
        <ul className="space-y-2">
          {block.rightItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <Check className="h-4 w-4 text-green-500" />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Social Proof Block Preview
const SocialProofBlockPreview = ({ block }: { block: QuizBlock & { type: 'socialProof' } }) => {
  const notification = block.notifications[0];
  return (
    <div className="bg-background border shadow-lg rounded-lg p-3 max-w-xs">
      <div className="flex items-center gap-3">
        {block.showAvatar && (
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium">
            <span className="font-semibold">{notification?.name}</span> {notification?.action}
          </p>
          <p className="text-xs text-muted-foreground">{notification?.time}</p>
        </div>
      </div>
    </div>
  );
};
