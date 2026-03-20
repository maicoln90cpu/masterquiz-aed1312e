import { useState } from "react";
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
  if (dismissed) return null;

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
      <div className="flex items-center gap-2 font-bold text-sm">
        <Icon className="h-5 w-5 shrink-0" style={{ color: border }} />
        <span className="flex-1">{block.title}</span>
        {/* ✅ Etapa 2D: Botão X para callout dismissível */}
        {block.dismissible && (
          <button onClick={() => setDismissed(true)} className="opacity-60 hover:opacity-100 transition-opacity">
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

  return (
    <div className={`${isHorizontal ? 'flex flex-wrap gap-4' : 'space-y-2'}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-lg shrink-0" style={{ color: block.iconColor || 'hsl(var(--primary))' }}>
            {item.icon}
          </span>
          <span className="text-sm">{item.text}</span>
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

  return (
    <div
      className={`${isMinimal ? 'py-2' : 'py-4'}`}
      style={{ borderLeft: `${isLarge ? '6px' : '4px'} solid ${borderColor}`, paddingLeft: '1rem' }}
    >
      {!isMinimal && (
        <span className="text-4xl font-serif leading-none opacity-20 select-none" style={{ color: borderColor }}>"</span>
      )}
      <p className={`${isLarge ? 'text-xl font-medium' : isMinimal ? 'text-sm' : 'text-base'} italic text-foreground leading-relaxed`}>
        {block.text}
      </p>
      {block.author && (
        <p className="text-sm text-muted-foreground mt-2">— {block.author}</p>
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

export const BannerBlockPreview = ({ block }: { block: QuizBlock & { type: 'banner' } }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const style = BANNER_STYLES[block.variant || 'promo'];

  return (
    <div className={`rounded-lg px-4 py-3 text-center font-semibold text-sm relative ${style}`}>
      <span>{block.text}</span>
      {block.dismissible && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
