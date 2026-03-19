import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { QuizBlock, VideoBlock } from "@/types/blocks";
import { sanitizeHtml } from "@/lib/sanitize";
import { MediaPlayer } from "./MediaPreviews";
import { CustomVideoPlayer } from "@/components/video/CustomVideoPlayer";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

// ---- TEXT ----
export const TextBlockPreview = ({ block }: { block: QuizBlock & { type: 'text' } }) => (
  <div
    className={`prose prose-sm max-w-none text-${block.alignment || "left"} ${
      block.fontSize === "small" ? "text-sm" : block.fontSize === "large" ? "text-lg" : "text-base"
    }`}
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
  />
);

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

export const VideoBlockPreview = ({ block, trackFacebookPixelEvent, handleIframeLoad }: VideoBlockPreviewProps) =>
  block.url ? (
    <div className="space-y-2">
      <div className={`rounded-lg overflow-hidden ${
        block.size === "small" ? "max-w-xs mx-auto"
          : block.size === "large" ? "max-w-2xl mx-auto"
          : block.size === "full" ? "w-full"
          : "max-w-md mx-auto"
      }`}>
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
  ) : null;

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

// ---- METRICS ----
export const MetricsBlockPreview = ({ block }: { block: QuizBlock & { type: 'metrics' } }) => {
  const rawData = (block as any).data ?? (block as any).dataPoints ?? [];
  const metricsData = Array.isArray(rawData) ? rawData : [];
  if (metricsData.length === 0) return null;

  const chartData = metricsData.map((d: any) => ({
    name: d.label,
    value: d.value,
    fill: d.color || '#3b82f6'
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">{block.title}</h3>
      <div className="bg-card rounded-lg p-4 border">
        <ResponsiveContainer width="100%" height={300}>
          {(() => {
            switch (block.chartType) {
              case 'bar':
                return (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis />
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                    <Bar dataKey="value">
                      {chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                );
              case 'line':
                return (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis />
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                );
              case 'pie':
              case 'donut':
                return (
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={block.chartType === 'donut' ? 60 : 0} outerRadius={100} label={block.showValues}>
                      {chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Pie>
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                  </PieChart>
                );
              default:
                return <BarChart data={chartData}><Bar dataKey="value" /></BarChart>;
            }
          })()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
