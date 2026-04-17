import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  id: string;
  children: React.ReactNode;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  showOnce?: boolean;
  triggerOn?: 'hover' | 'click' | 'auto';
  className?: string;
}

const STORAGE_KEY = 'masterquiz_tooltips_seen';

const getSeenTooltips = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const markTooltipSeen = (id: string) => {
  try {
    const seen = getSeenTooltips();
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    }
  } catch {
    // Silently fail
  }
};

export const FeatureTooltip = ({
  id,
  children,
  title,
  description,
  position = 'top',
  delay = 500,
  showOnce = true,
  triggerOn = 'auto',
  className,
}: FeatureTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    if (showOnce) {
      const seen = getSeenTooltips();
      setHasBeenSeen(seen.includes(id));
    }
  }, [id, showOnce]);

  useEffect(() => {
    if (triggerOn === 'auto' && !hasBeenSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [triggerOn, hasBeenSeen, delay]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (showOnce) {
      markTooltipSeen(id);
      setHasBeenSeen(true);
    }
  }, [id, showOnce]);

  const handleMouseEnter = () => {
    if (triggerOn === 'hover' && !hasBeenSeen) {
      setIsVisible(true);
    }
  };

  const handleClick = () => {
    if (triggerOn === 'click' && !hasBeenSeen) {
      setIsVisible(true);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent',
  };

  // Don't render tooltip for already-seen items
  if (showOnce && hasBeenSeen) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-50 w-64 p-3 rounded-lg shadow-lg",
              "bg-primary text-primary-foreground",
              "animate-pulse-glow",
              positionClasses[position]
            )}
          >
            {/* Arrow */}
            <div 
              className={cn(
                "absolute w-0 h-0 border-[6px]",
                arrowClasses[position]
              )}
            />
            
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold text-sm">{title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Description */}
            <p className="text-xs opacity-90 leading-relaxed">
              {description}
            </p>
            
            {/* Got it button */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
            >
              Entendi!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Hook to reset all tooltips (useful for testing/debugging)
export const useResetTooltips = () => {
  return useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);
};
