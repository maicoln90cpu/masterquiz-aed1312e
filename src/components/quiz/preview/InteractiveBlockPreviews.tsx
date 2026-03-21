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
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + (100 / (block.duration * 10));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [block.duration]);

  // ✅ Etapa 2E: Mensagens rotativas com fade
  useEffect(() => {
    if (!block.loadingMessages?.length || !block.rotateMessages) return;
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % block.loadingMessages!.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [block.loadingMessages, block.rotateMessages]);

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

  const progressColor = block.progressColor || 'hsl(var(--primary))';
  const messages = block.loadingMessages || [];
  const currentMsg = block.rotateMessages
    ? messages[msgIndex]
    : messages[Math.min(Math.floor(progress / (100 / Math.max(messages.length, 1))), messages.length - 1)];

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {renderSpinner()}
      {block.showProgress && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
          </div>
          <p className="text-sm text-center text-muted-foreground mt-2">{Math.round(progress)}%</p>
        </div>
      )}
      {messages.length > 0 && currentMsg && (
        <AnimatePresence mode="wait">
          <motion.p
            key={block.rotateMessages ? msgIndex : Math.floor(progress)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-muted-foreground text-center"
          >
            {currentMsg}
          </motion.p>
        </AnimatePresence>
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
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // ✅ Etapa 2E: Ação ao expirar (redirect)
  useEffect(() => {
    if (timeLeft === 0 && !hasRedirected) {
      if (block.expiryAction === 'redirect' && block.redirectUrl) {
        setHasRedirected(true);
        window.open(block.redirectUrl, '_blank');
      }
    }
  }, [timeLeft, hasRedirected, block.expiryAction, block.redirectUrl]);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  // ✅ Etapa 2E: Ação 'hide' esconde o bloco
  if (timeLeft === 0 && block.expiryAction === 'hide') {
    return null;
  }

  if (timeLeft === 0 && block.expiryMessage) {
    return (
      <div className="text-center p-8 rounded-xl border-2 border-dashed" style={{ borderColor: block.primaryColor, backgroundColor: block.secondaryColor }}>
        <p className="text-2xl font-bold" style={{ color: block.primaryColor }}>{block.expiryMessage}</p>
        {block.expiryAction === 'redirect' && block.redirectUrl && (
          <p className="text-sm text-muted-foreground mt-2">
            🔗 Redirecionando para {block.redirectUrl}...
          </p>
        )}
      </div>
    );
  }

  // ✅ Etapa 2F: Flip-clock digit component
  const FlipDigit = ({ value, label }: { value: number; label: string }) => {
    const digits = value.toString().padStart(2, '0');
    return (
      <div className="text-center">
        <div className="flex gap-1">
          {digits.split('').map((digit, i) => (
            <div key={`${label}-${i}`} className="relative w-10 h-14 rounded-lg overflow-hidden shadow-lg" style={{ perspective: '200px' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-3xl font-black tabular-nums text-white">{digit}</span>
              </div>
              <div className="absolute inset-x-0 top-1/2 h-px bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">{label}</div>
      </div>
    );
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => {
    if (block.style === 'flip') return <FlipDigit value={value} label={label} />;
    return (
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
  };

  const CountdownSeparator = () => (
    <span className={`text-2xl font-bold self-start ${block.style === 'flip' ? 'mt-4 text-foreground' : 'mt-3'} ${pulse ? 'opacity-100' : 'opacity-40'} transition-opacity`} style={block.style !== 'flip' ? { color: block.primaryColor } : undefined}>:</span>
  );

  return (
    <div className="flex gap-2 justify-center items-start flex-wrap">
      {block.showDays && <><TimeUnit value={days} label="dias" /><CountdownSeparator /></>}
      {block.showHours && <><TimeUnit value={hours} label="horas" />{(block.showMinutes || block.showSeconds) && <CountdownSeparator />}</>}
      {block.showMinutes && <><TimeUnit value={minutes} label="min" />{block.showSeconds && <CountdownSeparator />}</>}
      {block.showSeconds && <TimeUnit value={seconds} label="seg" />}
    </div>
  );
};

// ---- TESTIMONIAL ----
// ✅ Etapa 2F: Carrossel de depoimentos com auto-slide e dots
export const TestimonialBlockPreview = ({ block }: { block: QuizBlock & { type: 'testimonial' } }) => {
  const additional = (block as any).additionalTestimonials || [];
  const allTestimonials = [
    { quote: block.quote, authorName: block.authorName, authorRole: block.authorRole, authorCompany: block.authorCompany, authorImage: block.authorImage, rating: block.rating },
    ...additional,
  ];
  const isCarousel = allTestimonials.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!isCarousel || !(block as any).autoSlide) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % allTestimonials.length);
    }, ((block as any).slideInterval || 5) * 1000);
    return () => clearInterval(interval);
  }, [isCarousel, allTestimonials.length, (block as any).autoSlide, (block as any).slideInterval]);

  const current = allTestimonials[currentIdx];

  const renderTestimonial = (t: typeof current) => (
    <div className={`relative ${
      block.style === 'card' ? 'p-8 bg-background rounded-2xl shadow-xl border'
        : block.style === 'quote' ? 'py-6 px-4'
        : block.style === 'minimal' ? 'py-4'
        : 'p-6 bg-background rounded-xl shadow-md border'
    }`}>
      <div className="absolute -top-3 left-6 text-7xl leading-none opacity-15 select-none pointer-events-none" style={{ color: block.primaryColor || 'hsl(var(--primary))' }}>"</div>
      <div className="relative z-10">
        <p className={`${block.style === 'minimal' ? 'text-sm' : 'text-lg leading-relaxed'} italic mb-6 text-foreground`}>"{t.quote}"</p>
        {block.showRating && t.rating && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`w-5 h-5 transition-colors ${i < t.rating! ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4">
          {t.authorImage ? (
            <img src={t.authorImage} alt={t.authorName} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary ring-offset-2 shadow-md" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-primary-foreground shadow-md" style={{ backgroundColor: block.primaryColor || 'hsl(var(--primary))' }}>
              {t.authorName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="font-bold text-base" style={{ color: block.primaryColor }}>{t.authorName}</p>
            {(t.authorRole || t.authorCompany) && (
              <p className="text-sm text-muted-foreground">
                {t.authorRole}{t.authorRole && t.authorCompany && ' • '}{t.authorCompany}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={isCarousel ? { opacity: 0, x: 20 } : undefined}
          animate={{ opacity: 1, x: 0 }}
          exit={isCarousel ? { opacity: 0, x: -20 } : undefined}
          transition={{ duration: 0.3 }}
        >
          {renderTestimonial(current)}
        </motion.div>
      </AnimatePresence>
      {/* Dots navigation */}
      {isCarousel && (
        <div className="flex justify-center gap-2 pt-2">
          {allTestimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIdx ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
          <div className="min-w-[40px] text-right">
            <span className="text-sm text-muted-foreground font-medium tabular-nums">{block.min}{block.unit}</span>
            {/* ✅ Etapa 2C: Labels nos extremos */}
            {block.minLabel && <p className="text-[10px] text-muted-foreground/70">{block.minLabel}</p>}
          </div>
          <Slider value={[value]} min={block.min} max={block.max} step={block.step} onValueChange={(v) => setValue(v[0])} className="flex-1" />
          <div className="min-w-[40px]">
            <span className="text-sm text-muted-foreground font-medium tabular-nums">{block.max}{block.unit}</span>
            {/* ✅ Etapa 2C: Labels nos extremos */}
            {block.maxLabel && <p className="text-[10px] text-muted-foreground/70">{block.maxLabel}</p>}
          </div>
        </div>
        {/* ✅ Etapa 2C: Steps visuais com dots */}
        {block.showDots ? (
          <div className="flex justify-between px-[20px] mt-2">
            {ticks.map((tick, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full transition-colors ${value >= tick ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                <span className="text-[10px] text-muted-foreground/60 tabular-nums mt-1">{tick}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-between px-[20px] mt-1">
            {ticks.map((tick, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-px h-2 bg-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground/60 tabular-nums mt-0.5">{tick}</span>
              </div>
            ))}
          </div>
        )}
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
// ✅ Etapa 2F: Máscaras de input (CPF, CNPJ, telefone)
const applyMask = (value: string, type?: string): string => {
  const digits = value.replace(/\D/g, '');
  switch (type) {
    case 'cpf':
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
    case 'cnpj':
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .substring(0, 18);
    case 'phone':
      if (digits.length <= 10) {
        return digits
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      }
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
        .substring(0, 15);
    default:
      return value;
  }
};

export const TextInputBlockPreview = ({ block }: { block: QuizBlock & { type: 'textInput' } }) => {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const useMask = (block as any).useMask;

  const handleChange = (rawValue: string) => {
    if (useMask && (block.validation === 'cpf' || block.validation === 'cnpj' || block.validation === 'phone')) {
      setValue(applyMask(rawValue, block.validation));
    } else {
      setValue(rawValue);
    }
  };

  // ✅ Etapa 2E + 2F: Validação em tempo real (com CPF/CNPJ)
  const validate = (val: string): boolean | null => {
    if (!val || !block.showValidationFeedback) return null;
    const digits = val.replace(/\D/g, '');
    if (block.validation === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (block.validation === 'phone') return /^[\d\s\-\+\(\)]{8,}$/.test(val);
    if (block.validation === 'number') return !isNaN(Number(val)) && val.trim() !== '';
    if (block.validation === 'cpf') return digits.length === 11;
    if (block.validation === 'cnpj') return digits.length === 14;
    return null;
  };

  const isValid = validate(value);
  const borderClass = touched && isValid !== null
    ? isValid
      ? 'border-green-500 focus-visible:ring-green-500/30'
      : 'border-red-500 focus-visible:ring-red-500/30'
    : '';

  const getPlaceholder = () => {
    if (block.placeholder) return block.placeholder;
    if (useMask) {
      if (block.validation === 'cpf') return '000.000.000-00';
      if (block.validation === 'cnpj') return '00.000.000/0000-00';
      if (block.validation === 'phone') return '(00) 00000-0000';
    }
    return '';
  };

  return (
    <div className="space-y-2">
      <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
      {block.multiline ? (
        <textarea
          placeholder={block.placeholder}
          maxLength={block.maxLength}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={`w-full min-h-[120px] px-3 py-2 border rounded-md resize-none bg-background transition-colors ${borderClass}`}
        />
      ) : (
        <Input
          placeholder={getPlaceholder()}
          maxLength={block.maxLength}
          type={block.validation === 'email' ? 'email' : block.validation === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={borderClass}
        />
      )}
      <div className="flex items-center justify-between">
        {touched && isValid !== null && (
          <p className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? '✅ Formato válido' : '❌ Formato inválido'}
          </p>
        )}
        {block.maxLength && <p className="text-xs text-muted-foreground text-right ml-auto">{value.length}/{block.maxLength}</p>}
      </div>
    </div>
  );
};

// ---- NPS ----
export const NPSBlockPreview = ({ block }: { block: QuizBlock & { type: 'nps' } }) => {
  const [value, setValue] = useState<number | null>(null);
  const [comment, setComment] = useState('');
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
      {/* ✅ Etapa 2E: Comentário opcional após nota */}
      {block.showComment && value !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={block.commentPlaceholder || 'Conte-nos mais sobre sua nota...'}
            className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none bg-background text-sm mt-2"
          />
        </motion.div>
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

  // ✅ Etapa 2C: Ícone customizável (chevron ou plus/minus)
  const renderIcon = (isOpen: boolean) => {
    if (block.iconType === 'plus') {
      return isOpen
        ? <Minus className="h-4 w-4 shrink-0 transition-transform duration-200" />
        : <Plus className="h-4 w-4 shrink-0 transition-transform duration-200" />;
    }
    return <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />;
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
                {renderIcon(isOpen)}
              </button>
              {/* ✅ Etapa 2C: Animação suave de abertura */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 text-sm text-muted-foreground border-t">{item.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
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
  const highlightWinner = (block as any).highlightWinner || 'none';
  const itemIcons = (block as any).itemIcons || {};
  const leftIcon = itemIcons.left || '✗';
  const rightIcon = itemIcons.right || '✓';

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={`p-4 rounded-lg transition-all ${block.leftStyle === 'negative' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'} ${highlightWinner === 'left' ? 'ring-2 ring-primary shadow-md' : ''}`}>
        <h4 className={`font-semibold mb-3 ${block.leftStyle === 'negative' ? 'text-red-600' : ''}`}>{block.leftTitle || ''}</h4>
        <ul className="space-y-2">
          {leftItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <span className="text-red-500 shrink-0">{leftIcon}</span>}<span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`p-4 rounded-lg transition-all ${block.rightStyle === 'positive' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'} ${highlightWinner === 'right' ? 'ring-2 ring-primary shadow-md' : ''}`}>
        <h4 className={`font-semibold mb-3 ${block.rightStyle === 'positive' ? 'text-green-600' : ''}`}>{block.rightTitle || ''}</h4>
        <ul className="space-y-2">
          {rightItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {block.showIcons && <span className="text-green-500 shrink-0">{rightIcon}</span>}<span>{item}</span>
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

  useEffect(() => {
    if (notifications.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % notifications.length);
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
      {/* ✅ Etapa 2D: Animação slide-in com framer-motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`${
            block.style === 'banner' ? 'bg-primary text-primary-foreground px-4 py-2 rounded-md w-full text-center'
              : block.style === 'floating' ? 'bg-background border-2 border-primary shadow-xl rounded-full px-4 py-2'
              : 'bg-background border shadow-lg rounded-lg p-3 max-w-xs'
          }`}
        >
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
        </motion.div>
      </AnimatePresence>
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
            const rawValue = start + (end - start) * easing(progress);
            // ✅ Etapa 2D: Se currencyFormat, não arredondar durante animação
            setDisplayValue((block as any).currencyFormat ? parseFloat(rawValue.toFixed((block as any).decimalPlaces || 2)) : Math.round(rawValue));
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

  // ✅ Etapa 2D: Formato de moeda
  const formatValue = (val: number) => {
    if ((block as any).currencyFormat) {
      return val.toLocaleString('pt-BR', {
        minimumFractionDigits: (block as any).decimalPlaces || 2,
        maximumFractionDigits: (block as any).decimalPlaces || 2,
      });
    }
    return block.separator ? val.toLocaleString('pt-BR') : val.toString();
  };

  const fontSizeClass = block.fontSize === 'xlarge' ? 'text-6xl' : block.fontSize === 'large' ? 'text-5xl' : block.fontSize === 'medium' ? 'text-3xl' : 'text-2xl';

  return (
    <div ref={ref} className="text-center py-6 space-y-2">
      <p className={`font-black tabular-nums ${fontSizeClass}`} style={{ color: block.color || 'hsl(var(--primary))' }}>
        {block.prefix}{formatValue(displayValue)}{block.suffix}
      </p>
      {block.label && <p className="text-muted-foreground text-sm font-medium">{block.label}</p>}
    </div>
  );
};
