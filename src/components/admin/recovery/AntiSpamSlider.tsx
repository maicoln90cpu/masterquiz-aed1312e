import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AntiSpamSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  idealMin: number;
  idealMax: number;
  unit: string;
  tooltip: string;
  onChange: (value: number) => void;
  /** 
   * true = valor ALTO é risco (para limites: diário, por hora, batch size)
   * false = valor BAIXO é risco (para delays: segundos, minutos)
   */
  invertLogic?: boolean;
}

export function AntiSpamSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  idealMin,
  idealMax,
  unit,
  tooltip,
  onChange,
  invertLogic = false,
}: AntiSpamSliderProps) {
  // Determine zone color based on value and logic direction
  const getZoneColor = () => {
    if (invertLogic) {
      // Para limites: valor ALTO = risco de bloqueio
      if (value > idealMax) return "text-destructive"; // Red - too high (risk)
      if (value < idealMin) return "text-yellow-600 dark:text-yellow-500"; // Yellow - too conservative
      return "text-primary"; // Green - ideal
    } else {
      // Para delays: valor BAIXO = risco de bloqueio
      if (value < idealMin) return "text-destructive"; // Red - too low (risk)
      if (value > idealMax) return "text-yellow-600 dark:text-yellow-500"; // Yellow - too slow
      return "text-primary"; // Green - ideal
    }
  };

  const getZoneLabel = () => {
    if (invertLogic) {
      // Para limites: alto = risco, baixo = conservador
      if (value > idealMax) return "⚠️ Risco de bloqueio";
      if (value < idealMin) return "⚡ Muito conservador";
      return "✅ Ideal";
    } else {
      // Para delays: baixo = risco, alto = lento
      if (value < idealMin) return "⚠️ Risco de bloqueio";
      if (value > idealMax) return "⚡ Lentidão desnecessária";
      return "✅ Ideal";
    }
  };

  // Calculate ideal zone position for visual indicator
  const idealStartPercent = ((idealMin - min) / (max - min)) * 100;
  const idealWidthPercent = ((idealMax - idealMin) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold tabular-nums", getZoneColor())}>
            {value}
            <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
          </span>
        </div>
      </div>

      {/* Slider with ideal zone indicator */}
      <div className="relative">
      {/* Background zone indicator */}
        <div className="absolute top-1/2 -translate-y-1/2 h-2 w-full rounded-full overflow-hidden pointer-events-none">
          {invertLogic ? (
            <>
              {/* Para limites: Yellow (conservador) -> Green (ideal) -> Red (risco) */}
              <div
                className="absolute h-full bg-yellow-500/20"
                style={{ left: 0, width: `${idealStartPercent}%` }}
              />
              <div
                className="absolute h-full bg-primary/20"
                style={{ left: `${idealStartPercent}%`, width: `${idealWidthPercent}%` }}
              />
              <div
                className="absolute h-full bg-destructive/20"
                style={{ left: `${idealStartPercent + idealWidthPercent}%`, right: 0 }}
              />
            </>
          ) : (
            <>
              {/* Para delays: Red (risco) -> Green (ideal) -> Yellow (lento) */}
              <div
                className="absolute h-full bg-destructive/20"
                style={{ left: 0, width: `${idealStartPercent}%` }}
              />
              <div
                className="absolute h-full bg-primary/20"
                style={{ left: `${idealStartPercent}%`, width: `${idealWidthPercent}%` }}
              />
              <div
                className="absolute h-full bg-yellow-500/20"
                style={{ left: `${idealStartPercent + idealWidthPercent}%`, right: 0 }}
              />
            </>
          )}
        </div>

        <Slider
          id={id}
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={(values) => onChange(values[0])}
          className="relative z-10"
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span className={cn("font-medium", getZoneColor())}>{getZoneLabel()}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
