import { useState, type CSSProperties } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";
import type { QuizBlock } from "@/types/blocks";

// ---- CALLOUT ----
const CALLOUT_DEFAULTS = {
  warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: AlertTriangle },
  info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: Info },
  success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: CheckCircle },
  error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: XCircle },
};

export const CalloutBlockPreview = ({ block }: { block: QuizBlock & { type: 'callout' } }) => {
  const [dismissed, setDismissed] = useState(false); // ✅ Etapa 2D: Dismissível
  if (dismissed || (block as any).hidden) return null;

  const defaults = CALLOUT_DEFAULTS[block.variant || 'warning'];
  const Icon = defaults.icon;
  const bg = block.backgroundColor || defaults.bg;
  const border = block.borderColor || defaults.border;
  const text = block.textColor || defaults.text;

  return (
    <div
      className="rounded-lg p-4 space-y-2 relative"
      style={{ backgroundColor: bg, borderLeft: `4px solid ${border}`, color: text }}
    >
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-5 w-5 shrink-0" style={{ color: border }} />
        <span className={`flex-1 ${(block as any).titleBold !== false ? 'font-bold' : 'font-normal'}`}>{block.title}</span>
        {/* ✅ Etapa 2D: Botão X para callout dismissível */}
        {block.dismissible && (
          <button type="button" onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {block.items && block.items.length > 0 && (
        <ul className="space-y-1 ml-7">
          {block.items.map((item, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="shrink-0 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {block.footnote && (
        <p className="text-xs opacity-75 ml-7 italic">{block.footnote}</p>
      )}
    </div>
  );
};

// ---- ICON LIST ----
export const IconListBlockPreview = ({ block }: { block: QuizBlock & { type: 'iconList' } }) => {
  const items = block.items || [];
  const isHorizontal = block.layout === 'horizontal';
  const iconSizeClass = (block as any).iconSize === 'sm' ? 'text-sm' : (block as any).iconSize === 'lg' ? 'text-2xl' : (block as any).iconSize === 'xl' ? 'text-3xl' : 'text-lg';
  const textSizeClass = (block as any).iconSize === 'sm' ? 'text-xs' : (block as any).iconSize === 'lg' ? 'text-base' : (block as any).iconSize === 'xl' ? 'text-lg' : 'text-sm';

  return (
    <div className={`${isHorizontal ? 'flex flex-wrap gap-4' : 'space-y-2'}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className={`${iconSizeClass} shrink-0`}>
            {item.icon}
          </span>
          <span className={textSizeClass} style={{ color: item.color || block.iconColor || 'hsl(var(--primary))' }}>{item.text}</span>
        </div>
      ))}
    </div>
  );
};

// ---- QUOTE ----
export const QuoteBlockPreview = ({ block }: { block: QuizBlock & { type: 'quote' } }) => {
  const borderColor = block.borderColor || 'hsl(var(--primary))';
  const isLarge = block.style === 'large';
  const isMinimal = block.style === 'minimal';
  const hasBgImage = !!(block as any).backgroundImageUrl;

  return (
    <div
      className={`${isMinimal ? 'py-2' : 'py-4'} relative overflow-hidden rounded-lg`}
      style={{
        borderLeft: `${isLarge ? '6px' : '4px'} solid ${borderColor}`,
        paddingLeft: '1rem',
        ...(hasBgImage ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${(block as any).backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          padding: '1.5rem',
        } : {}),
      }}
    >
      {!isMinimal && (
        <span className="text-4xl font-serif leading-none opacity-20 select-none" style={{ color: hasBgImage ? '#fff' : borderColor }}>"</span>
      )}
      <p className={`${isLarge ? 'text-xl font-medium' : isMinimal ? 'text-sm' : 'text-base'} italic ${hasBgImage ? '' : 'text-foreground'} leading-relaxed`}>
        {block.text}
      </p>
      {block.author && (
        <p className={`text-sm ${hasBgImage ? 'text-white/80' : 'text-muted-foreground'} mt-2`}>— {block.author}</p>
      )}
    </div>
  );
};

// ---- BADGE ROW ----
export const BadgeRowBlockPreview = ({ block }: { block: QuizBlock & { type: 'badgeRow' } }) => {
  const badges = block.badges || [];
  const isFilled = block.variant === 'filled';
  const sizeClass = block.size === 'sm' ? 'text-xs px-2 py-1' : block.size === 'lg' ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5';

  const renderBadge = (badge: { icon: string; text: string; tooltip?: string; color?: string }, idx: number) => {
    const badgeColor = badge.color;
    const badgeEl = (
      <span
        key={idx}
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${
          isFilled
            ? 'text-white'
            : 'border-2 text-foreground'
        }`}
        style={
          badgeColor
            ? isFilled
              ? { backgroundColor: badgeColor }
              : { borderColor: `${badgeColor}50`, color: badgeColor }
            : isFilled
              ? { backgroundColor: 'hsl(var(--primary))' }
              : { borderColor: 'hsl(var(--primary) / 0.3)' }
        }
      >
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </span>
    );

    // ✅ Etapa 2C: Tooltip por badge
    if (badge.tooltip) {
      return (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>{badgeEl}</TooltipTrigger>
            <TooltipContent><p className="text-xs">{badge.tooltip}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badgeEl;
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {badges.map((badge, idx) => renderBadge(badge, idx))}
    </div>
  );
};

// ---- BANNER ----
const BANNER_STYLES = {
  promo: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  warning: 'bg-yellow-100 text-yellow-900 border border-yellow-300',
  success: 'bg-green-100 text-green-900 border border-green-300',
  info: 'bg-blue-100 text-blue-900 border border-blue-300',
};

export const BannerBlockPreview = ({ block, onCtaClick }: { block: QuizBlock & { type: 'banner' }; onCtaClick?: (ctaText: string, ctaUrl: string, blockId?: string) => void }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const customBg = (block as any).bgColor as string | undefined;
  const customText = (block as any).textColor as string | undefined;
  // Onda 7 — quando há override de cor, descarta a classe de variante para evitar conflito
  const style = customBg ? '' : BANNER_STYLES[block.variant || 'promo'];
  const inlineStyle: CSSProperties = {
    ...(customBg ? { backgroundColor: customBg, backgroundImage: 'none' } : {}),
    ...(customText ? { color: customText } : {}),
  };

  // ✅ Etapa 2D: Banner clicável com link
  const handleClick = () => {
    if ((block as any).linkUrl) {
      if (onCtaClick) {
        onCtaClick(block.text || 'Banner CTA', (block as any).linkUrl, block.id);
      } else {
        window.open((block as any).linkUrl, (block as any).linkTarget || '_blank');
      }
    }
  };

  const hasLink = !!(block as any).linkUrl;

  return (
    <div
      className={`rounded-lg px-4 py-3 text-center font-semibold text-sm relative ${style} ${hasLink ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      style={inlineStyle}
      onClick={hasLink ? handleClick : undefined}
    >
      <span>{block.text}</span>
      {hasLink && <span className="ml-1 text-xs opacity-75">→</span>}
      {block.dismissible && (
        <button
type="button" className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
