import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Check, X, ChevronDown, Plus, Minus, User, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizBlock } from "@/types/blocks";

// ---- LOADING ----
export const LoadingBlockPreview = ({ block }: { block: QuizBlock & { type: 'loading' } }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
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
            {[40, 60, 80, 100].map((h, i) => (
              <div key={i} className="w-3 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        );
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {renderSpinner()}
      {block.showProgress && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-center text-muted-foreground mt-2">{Math.round(progress)}%</p>
        </div>
      )}
      {block.loadingMessages && block.loadingMessages.length > 0 && (
        <p className="text-sm text-muted-foreground animate-pulse text-center">
          {block.loadingMessages[Math.min(Math.floor(progress / (100 / block.loadingMessages.length)), block.loadingMessages.length - 1)]}
        </p>
      )}
    </div>
  );
};

// ---- PROGRESS ----
export const ProgressBlockPreview = ({ block, currentQuestion, totalQuestions }: {
  block: QuizBlock & { type: 'progress' };
  currentQuestion: number;
  totalQuestions: number;
}) => {
  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
  const heightClass = block.height === 'thin' ? 'h-1' : block.height === 'thick' ? 'h-4' : 'h-2';

  // ✅ Etapa 2C: Cor por faixa (vermelho→amarelo→verde)
  const getProgressColor = () => {
    if (block.colorByRange) {
      if (progress < 33) return '#ef4444';
      if (progress < 66) return '#f59e0b';
      return '#22c55e';
    }
    return block.color || '#3b82f6';
  };
  const progressColor = getProgressColor();
  const isComplete = progress >= 100;

  return (
    <div className="space-y-2">
      {block.label && <p className="text-sm font-medium">{block.label}</p>}
      {block.style === 'bar' && (
        <div className={`w-full ${heightClass} bg-muted rounded-full overflow-hidden`}>
          <div className={`${heightClass} rounded-full ${block.animated ? 'transition-all duration-500' : ''}`} style={{ width: `${progress}%`, backgroundColor: progressColor }} />
        </div>
      )}
      {block.style === 'steps' && (
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} className={`flex-1 ${heightClass} rounded-full ${block.animated ? 'transition-all duration-300' : ''}`} style={{ backgroundColor: i < currentQuestion ? progressColor : '#e5e7eb' }} />
          ))}
        </div>
      )}
      {block.style === 'circle' && (
        <div className="flex justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle cx="48" cy="48" r="40" stroke={progressColor} strokeWidth="8" fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className={block.animated ? 'transition-all duration-500' : ''}
            />
          </svg>
        </div>
      )}
      {block.style === 'percentage' && (
        <div className="text-center text-4xl font-bold" style={{ color: progressColor }}>{Math.round(progress)}%</div>
      )}
      {/* ✅ Etapa 2C: Ícone de conclusão ao 100% */}
      {block.showCompletionIcon && isComplete && (
        <div className="flex justify-center">
          <CheckCircle className="h-8 w-8 text-green-500 animate-in zoom-in duration-300" />
        </div>
      )}
      {block.showPercentage && block.style !== 'percentage' && (
        <p className="text-sm text-center font-medium" style={{ color: progressColor }}>{Math.round(progress)}%</p>
      )}
      {block.showCounter && (
        <p className="text-sm text-center text-muted-foreground">Pergunta {currentQuestion} de {totalQuestions}</p>
      )}
    </div>
  );
};

// ---- COUNTDOWN ----
export const CountdownBlockPreview = ({ block }: { block: QuizBlock & { type: 'countdown' } }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (block.mode === 'date' && block.targetDate) {
      const diff = Math.max(0, Math.floor((new Date(block.targetDate).getTime() - Date.now()) / 1000));
      return diff;
    }
    return block.duration || 300;
  });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0 && block.expiryMessage) {
    return (
      <div className="text-center p-8 rounded-xl border-2 border-dashed" style={{ borderColor: block.primaryColor, backgroundColor: block.secondaryColor }}>
        <p className="text-2xl font-bold" style={{ color: block.primaryColor }}>{block.expiryMessage}</p>
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className={`text-center ${
      block.style === 'card' ? 'p-4 bg-background rounded-xl shadow-lg border-2 min-w-[80px]'
        : block.style === 'bold' ? 'p-3 min-w-[70px]'
        : 'p-2 min-w-[60px]'
    }`} style={block.style === 'card' ? { borderColor: `${block.primaryColor}30` } : undefined}>
      <div className={`tabular-nums transition-transform duration-300 ${pulse ? 'scale-110' : 'scale-100'} ${
        block.style === 'bold' ? 'text-5xl font-black' : block.style === 'minimal' ? 'text-2xl font-medium' : 'text-4xl font-bold'
      }`} style={{ color: block.primaryColor }}>
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );

  const Separator = () => (
    <span className={`text-2xl font-bold self-start mt-3 ${pulse ? 'opacity-100' : 'opacity-40'} transition-opacity`} style={{ color: block.primaryColor }}>:</span>
  );

  return (
    <div className="flex gap-2 justify-center items-start flex-wrap">
      {block.showDays && <><TimeUnit value={days} label="dias" /><Separator /></>}
      {block.showHours && <><TimeUnit value={hours} label="horas" />{(block.showMinutes || block.showSeconds) && <Separator />}</>}
      {block.showMinutes && <><TimeUnit value={minutes} label="min" />{block.showSeconds && <Separator />}</>}
      {block.showSeconds && <TimeUnit value={seconds} label="seg" />}
    </div>
  );
};

// ---- TESTIMONIAL ----
export const TestimonialBlockPreview = ({ block }: { block: QuizBlock & { type: 'testimonial' } }) => (
  <div className={`relative ${
    block.style === 'card' ? 'p-8 bg-background rounded-2xl shadow-xl border'
      : block.style === 'quote' ? 'py-6 px-4'
      : block.style === 'minimal' ? 'py-4'
      : 'p-6 bg-background rounded-xl shadow-md border'
  }`}>
    <div className="absolute -top-3 left-6 text-7xl leading-none opacity-15 select-none pointer-events-none" style={{ color: block.primaryColor || 'hsl(var(--primary))' }}>"</div>
    <div className="relative z-10">
      <p className={`${block.style === 'minimal' ? 'text-sm' : 'text-lg leading-relaxed'} italic mb-6 text-foreground`}>"{block.quote}"</p>
      {block.showRating && block.rating && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className={`w-5 h-5 transition-colors ${i < block.rating! ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4">
        {block.authorImage ? (
          <img src={block.authorImage} alt={block.authorName} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary ring-offset-2 shadow-md" />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-primary-foreground shadow-md" style={{ backgroundColor: block.primaryColor || 'hsl(var(--primary))' }}>
            {block.authorName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div>
          <p className="font-bold text-base" style={{ color: block.primaryColor }}>{block.authorName}</p>
          {(block.authorRole || block.authorCompany) && (
            <p className="text-sm text-muted-foreground">
              {block.authorRole}{block.authorRole && block.authorCompany && ' • '}{block.authorCompany}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ---- SLIDER ----
export const SliderBlockPreview = ({ block }: { block: QuizBlock & { type: 'slider' } }) => {
  const [value, setValue] = useState(block.defaultValue ?? block.min);
  const range = block.max - block.min;
  const tickCount = Math.min(10, Math.floor(range / block.step));
  const tickStep = tickCount > 0 ? range / tickCount : range;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round(block.min + i * tickStep));

  return (
    <div className="space-y-4">
      <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
      <div className="px-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-medium tabular-nums min-w-[40px] text-right">{block.min}{block.unit}</span>
          <Slider value={[value]} min={block.min} max={block.max} step={block.step} onValueChange={(v) => setValue(v[0])} className="flex-1" />
          <span className="text-sm text-muted-foreground font-medium tabular-nums min-w-[40px]">{block.max}{block.unit}</span>
        </div>
        <div className="flex justify-between px-[20px] mt-1">
          {ticks.map((tick, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-px h-2 bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/60 tabular-nums mt-0.5">{tick}</span>
            </div>
          ))}
        </div>
      </div>
      {block.showValue && (
        <div className="text-center">
          <span className="inline-block text-3xl font-bold text-primary tabular-nums transition-all duration-150">{value}{block.unit}</span>
        </div>
      )}
    </div>
  );
};

// ---- TEXT INPUT ----
export const TextInputBlockPreview = ({ block }: { block: QuizBlock & { type: 'textInput' } }) => (
  <div className="space-y-2">
    <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
    {block.multiline ? (
      <textarea placeholder={block.placeholder} maxLength={block.maxLength} className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-none bg-background" />
    ) : (
      <Input placeholder={block.placeholder} maxLength={block.maxLength} type={block.validation === 'email' ? 'email' : block.validation === 'number' ? 'number' : 'text'} />
    )}
    {block.maxLength && <p className="text-xs text-muted-foreground text-right">Máximo: {block.maxLength} caracteres</p>}
  </div>
);

// ---- NPS ----
export const NPSBlockPreview = ({ block }: { block: QuizBlock & { type: 'nps' } }) => {
  const [value, setValue] = useState<number | null>(null);
  const getNPSColor = (v: number) => v <= 6 ? "bg-red-500" : v <= 8 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-4">
      <p className="font-medium text-center">{block.question}</p>
      {block.showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>{block.lowLabel}</span><span>{block.highLabel}</span>
        </div>
      )}
      <div className="flex justify-center gap-1 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button key={i} onClick={() => setValue(i)} className={`w-9 h-9 rounded-full font-semibold text-sm transition-all ${
            value === i ? `${getNPSColor(i)} text-white scale-110 shadow-lg` : "bg-muted hover:bg-muted/80 text-foreground"
          }`}>{i}</button>
        ))}
      </div>
      {value !== null && (
        <p className={`text-center text-sm font-medium ${value <= 6 ? "text-red-600" : value <= 8 ? "text-yellow-600" : "text-green-600"}`}>
          {value <= 6 ? "Detrator" : value <= 8 ? "Neutro" : "Promotor"} ({value})
        </p>
      )}
    </div>
  );
};

// ---- ACCORDION ----
export const AccordionBlockPreview = ({ block }: { block: QuizBlock & { type: 'accordion' } }) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const items = block.items || [];

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) { next.delete(index); }
      else { if (!block.allowMultiple) next.clear(); next.add(index); }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{block.title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => {
          const isOpen = openItems.has(index);
          return (
            <div key={index} className={`border rounded-lg overflow-hidden ${block.style === 'bordered' ? 'border-2' : ''}`}>
              <button onClick={() => toggleItem(index)} className="w-full p-3 font-medium bg-muted/50 flex items-center justify-between text-left hover:bg-muted/70 transition-colors">
                {item.question}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-3 text-sm text-muted-foreground border-t animate-in slide-in-from-top-1 duration-200">{item.answer}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- COMPARISON ----
export const ComparisonBlockPreview = ({ block }: { block: QuizBlock & { type: 'comparison' } }) => {
  const leftItems = block.leftItems || [];
  const rightItems = block.rightItems || [];
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={`p-4 rounded-lg ${block.leftStyle === 'negative' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
        <h4 className={`font-semibold mb-3 ${block.leftStyle === 'negative' ? 'text-red-600' : ''}`}>{block.leftTitle || ''}</h4>
        <ul className="space-y-2">
          {leftItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <X className="h-4 w-4 text-red-500" />}<span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`p-4 rounded-lg ${block.rightStyle === 'positive' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'}`}>
        <h4 className={`font-semibold mb-3 ${block.rightStyle === 'positive' ? 'text-green-600' : ''}`}>{block.rightTitle || ''}</h4>
        <ul className="space-y-2">
          {rightItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <Check className="h-4 w-4 text-green-500" />}<span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ---- SOCIAL PROOF ----
export const SocialProofBlockPreview = ({ block }: { block: QuizBlock & { type: 'socialProof' } }) => {
  const notifications = block.notifications || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (notifications.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % notifications.length);
        setVisible(true);
      }, 300);
    }, (block.interval || 5) * 1000);
    return () => clearInterval(interval);
  }, [notifications.length, block.interval]);

  const notification = notifications[currentIdx];
  if (!notification) return null;

  const positionClasses: Record<string, string> = {
    'bottom-left': 'justify-start', 'bottom-right': 'justify-end',
    'top-left': 'justify-start', 'top-right': 'justify-end',
  };

  return (
    <div className={`flex ${positionClasses[block.position || 'bottom-left'] || 'justify-start'}`}>
      <div className={`transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${
        block.style === 'banner' ? 'bg-primary text-primary-foreground px-4 py-2 rounded-md w-full text-center'
          : block.style === 'floating' ? 'bg-background border-2 border-primary shadow-xl rounded-full px-4 py-2'
          : 'bg-background border shadow-lg rounded-lg p-3 max-w-xs'
      }`}>
        <div className="flex items-center gap-3">
          {block.showAvatar && (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm"><span className="font-semibold">{notification.name}</span> {notification.action}</p>
            <p className="text-xs text-muted-foreground">{notification.time}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- ANIMATED COUNTER ----
export const AnimatedCounterBlockPreview = ({ block }: { block: QuizBlock & { type: 'animatedCounter' } }) => {
  const [displayValue, setDisplayValue] = useState(block.startValue);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = block.startValue;
          const end = block.endValue;
          const duration = (block.duration || 2) * 1000;
          const startTime = performance.now();

          const easing = (t: number) => {
            if (block.easing === 'linear') return t;
            if (block.easing === 'easeInOut') return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            return 1 - Math.pow(1 - t, 3);
          };

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setDisplayValue(Math.round(start + (end - start) * easing(progress)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated, block.startValue, block.endValue, block.duration, block.easing]);

  const formatted = block.separator ? displayValue.toLocaleString('pt-BR') : displayValue.toString();
  const fontSizeClass = block.fontSize === 'xlarge' ? 'text-6xl' : block.fontSize === 'large' ? 'text-5xl' : block.fontSize === 'medium' ? 'text-3xl' : 'text-2xl';

  return (
    <div ref={ref} className="text-center py-6 space-y-2">
      <p className={`font-black tabular-nums ${fontSizeClass}`} style={{ color: block.color || 'hsl(var(--primary))' }}>
        {block.prefix}{formatted}{block.suffix}
      </p>
      {block.label && <p className="text-muted-foreground text-sm font-medium">{block.label}</p>}
    </div>
  );
};
