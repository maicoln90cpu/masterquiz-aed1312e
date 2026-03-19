import { CountdownBlock as CountdownBlockType } from "@/types/blocks";
import { useEffect, useState } from "react";

interface CountdownBlockProps {
  block: CountdownBlockType;
  onChange: (block: CountdownBlockType) => void;
}

export default function CountdownBlock({ block, onChange }: CountdownBlockProps) {
  const [previewTime, setPreviewTime] = useState({ days: 0, hours: 1, minutes: 30, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewTime(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>⏱️ Countdown</span>
      </div>

      {/* Preview only — all config in properties panel */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview</p>
        <div className={`flex gap-2 justify-center ${block.style === 'card' ? 'flex-wrap' : ''}`}>
          {block.showDays && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.days.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">dias</div>
            </div>
          )}
          {block.showHours && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">horas</div>
            </div>
          )}
          {block.showMinutes && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">min</div>
            </div>
          )}
          {block.showSeconds && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">seg</div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          {block.mode === 'duration' ? `${block.duration || 300}s` : 'Data alvo'} • {block.style || 'default'}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Configure modo, duração, estilo, cores e ação ao expirar no painel de propriedades →
      </p>
    </div>
  );
}
