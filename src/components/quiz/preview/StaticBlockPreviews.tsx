import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { QuizBlock, VideoBlock } from "@/types/blocks";
import { sanitizeHtml } from "@/lib/sanitize";
import { MediaPlayer } from "./MediaPreviews";
import { CustomVideoPlayer } from "@/components/video/CustomVideoPlayer";
// ✅ FASE 12: Recharts removido - MetricsBlockPreview extraído para lazy loading

// ---- TEXT ----
// ✅ Etapa 2E: Suporte a variáveis dinâmicas {nome}, {resposta_P1}, etc.
interface TextBlockPreviewProps {
  block: QuizBlock & { type: 'text' };
  answers?: Record<string, any>;
  questions?: Array<{ id: string; question_text?: string; blocks?: any[] }>;
  respondentName?: string;
}

export const TextBlockPreview = ({ block, answers, questions, respondentName }: TextBlockPreviewProps) => {
  let content = block.content;
  
  // Replace {nome} with respondent name
  if (respondentName) {
    content = content.replace(/\{nome\}/gi, respondentName);
  }
  
  // Replace {resposta_P1}, {resposta_P2}, etc. with actual answers
  if (answers && questions) {
    questions.forEach((q, idx) => {
      const answer = answers[q.id];
      if (answer) {
        const answerStr = Array.isArray(answer) ? answer.join(', ') : String(answer);
        content = content.replace(new RegExp(`\\{resposta_P${idx + 1}\\}`, 'gi'), answerStr);
        content = content.replace(new RegExp(`\\{resposta\\}`, 'i'), answerStr); // first match only
      }
    });
  }

  return (
    <div
      className={`prose prose-sm max-w-none text-${block.alignment || "left"} ${
        block.fontSize === "small" ? "text-sm" : block.fontSize === "large" ? "text-lg" : "text-base"
      }`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
};

// ---- SEPARATOR ----
export const SeparatorBlockPreview = ({ block }: { block: QuizBlock & { type: 'separator' } }) =>
  block.style === "space" ? (
    <div className="my-6 h-8" />
  ) : (
    <div
      className="my-6 w-full"
      style={{
        borderTopWidth: block.thickness === "thin" ? "1px" : block.thickness === "thick" ? "4px" : "2px",
        borderTopStyle: block.style === "dots" ? "dotted" : block.style === "dashes" ? "dashed" : "solid",
        borderTopColor: block.color || "hsl(var(--border))",
      }}
    />
  );

// ---- IMAGE ----
export const ImageBlockPreview = ({ block }: { block: QuizBlock & { type: 'image' } }) =>
  block.url ? (
    <div className="space-y-2 w-full overflow-hidden">
      <img
        src={block.url}
        alt={block.alt || "Quiz image"}
        className={`rounded-lg w-full h-auto object-contain mx-auto ${
          block.size === "small" ? "max-w-xs"
            : block.size === "large" ? "max-w-2xl"
            : block.size === "full" ? "w-full"
            : "max-w-md"
        }`}
        loading="lazy"
      />
      {block.caption && <p className="text-sm text-center text-muted-foreground">{block.caption}</p>}
    </div>
  ) : null;

// ---- VIDEO ----
interface VideoBlockPreviewProps {
  block: QuizBlock & { type: 'video' };
  trackFacebookPixelEvent: (eventName: string, params: Record<string, any>) => void;
  handleIframeLoad: (block: VideoBlock) => void;
}

export const VideoBlockPreview = ({ block, trackFacebookPixelEvent, handleIframeLoad }: VideoBlockPreviewProps) => {
  // ✅ Etapa 2C: Auto-detect Loom URLs
  const detectProvider = () => {
    if (block.provider && block.provider !== 'direct') return block.provider;
    const url = block.url || '';
    if (url.includes('loom.com')) return 'loom' as const;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube' as const;
    if (url.includes('vimeo.com')) return 'vimeo' as const;
    return block.provider || 'direct';
  };
  const provider = detectProvider();

  // ✅ Etapa 2C: Extract Loom embed URL
  const getLoomEmbedUrl = (url: string) => {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (match) return `https://www.loom.com/embed/${match[1]}`;
    if (url.includes('/embed/')) return url;
    return url;
  };

  if (!block.url) return null;

  return (
    <div className="space-y-2">
      <div className={`rounded-lg overflow-hidden ${
        block.size === "small" ? "max-w-xs mx-auto"
          : block.size === "large" ? "max-w-2xl mx-auto"
          : block.size === "full" ? "w-full"
          : "max-w-md mx-auto"
      }`}>
        {provider === "youtube" && (
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
        {provider === "vimeo" && (
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
        {/* ✅ Etapa 2C: Loom embed support */}
        {provider === "loom" && (
          <div className="aspect-video">
            <iframe
              src={getLoomEmbedUrl(block.url)}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay"
              onLoad={() => handleIframeLoad(block)}
            />
          </div>
        )}
        {(provider === "direct" || provider === "uploaded" || provider === "bunny_stream") && (
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
              const thresholds = [25, 50, 75];
              for (const t of thresholds) {
                if (percentage >= t && percentage < t + 1) {
                  trackFacebookPixelEvent(`VideoProgress${t}`, {
                    content_name: block.caption || 'Quiz Video',
                    video_url: block.url,
                    percentage: t
                  });
                }
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
      {block.caption && <p className="text-sm text-center text-muted-foreground">{block.caption}</p>}
    </div>
  );
};

// ---- AUDIO ----
export const AudioBlockPreview = ({ block }: { block: QuizBlock & { type: 'audio' } }) =>
  block.url ? (
    <div className="space-y-2">
      <MediaPlayer url={block.url} type="audio" />
      {block.caption && <p className="text-sm text-muted-foreground">{block.caption}</p>}
    </div>
  ) : null;

// ---- GALLERY ----
export const GalleryBlockPreview = ({ block }: { block: QuizBlock & { type: 'gallery' } }) => {
  const images = block.images || [];
  return images.length > 0 ? (
    <div className="space-y-2">
      <div className={
        block.layout === "carousel" ? "flex gap-4 overflow-x-auto"
          : block.layout === "masonry" ? "columns-2 md:columns-3 gap-4"
          : "grid grid-cols-2 md:grid-cols-3 gap-4"
      }>
        {images.map((img, idx) => (
          <div key={idx} className="space-y-1">
            <img src={img.url} alt={img.alt || `Gallery image ${idx + 1}`} className="rounded-lg w-full" />
            {img.caption && <p className="text-xs text-muted-foreground">{img.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

// ---- EMBED ----
export const EmbedBlockPreview = ({ block }: { block: QuizBlock & { type: 'embed' } }) =>
  block.html ? (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }} className="rounded-lg overflow-hidden" />
  ) : block.url ? (
    <iframe src={block.url} className="w-full aspect-video rounded-lg" />
  ) : null;

// ---- BUTTON ----
interface ButtonBlockPreviewProps {
  block: QuizBlock & { type: 'button' };
  onNavigateNext?: () => void;
  onNavigateToQuestion?: (index: number) => void;
}

export const ButtonBlockPreview = ({ block, onNavigateNext, onNavigateToQuestion }: ButtonBlockPreviewProps) => {
  if (!block.text) return null;
  const action = block.action || 'link';

  const handleButtonClick = () => {
    if (action === 'next_question' && onNavigateNext) onNavigateNext();
    else if (action === 'go_to_question' && onNavigateToQuestion && block.targetQuestionIndex)
      onNavigateToQuestion(block.targetQuestionIndex - 1);
  };

  if (action === 'link' && block.url) {
    return (
      <div className="flex justify-center">
        <Button variant={block.variant || 'default'} size={block.size || 'default'} asChild>
          <a href={block.url} target={block.openInNewTab ? "_blank" : undefined} rel={block.openInNewTab ? "noopener noreferrer" : undefined}>
            {block.text}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <Button variant={block.variant || 'default'} size={block.size || 'default'} onClick={handleButtonClick}>
        {block.text}
      </Button>
    </div>
  );
};

// ---- PRICE ----
export const PriceBlockPreview = ({ block }: { block: QuizBlock & { type: 'price' } }) => (
  <div>
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
              <span className="text-lg text-muted-foreground line-through">{block.currency}{block.originalPrice}</span>
            )}
            <span className="text-4xl font-bold text-primary">{block.currency}{block.price}</span>
            {block.period && <span className="text-muted-foreground">{block.period}</span>}
          </div>
        </div>
        <ul className="space-y-2">
          {(block.features || []).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {block.buttonText && (
          <Button className="w-full" size="lg" asChild={!!block.buttonUrl}>
            {block.buttonUrl ? (
              <a href={block.buttonUrl} target="_blank" rel="noopener noreferrer">{block.buttonText}</a>
            ) : (
              <span>{block.buttonText}</span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  </div>
);

// ✅ FASE 12: MetricsBlockPreview movido para MetricsBlockPreview.tsx (lazy loaded)
// Re-export para manter compatibilidade
export { MetricsBlockPreview } from "./MetricsBlockPreview";
