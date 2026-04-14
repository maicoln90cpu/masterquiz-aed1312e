import { useEffect, useState } from 'react';
import { useSupportMode } from '@/contexts/SupportModeContext';
import { Button } from '@/components/ui/button';
import { Shield, X, Clock } from 'lucide-react';

export const SupportModeBanner = () => {
  const { isSupportMode, target, exitSupportMode, startTime } = useSupportMode();
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!isSupportMode || !target) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-bold text-sm">MODO SUPORTE ATIVO</span>
          <span className="text-xs sm:text-sm">
            Visualizando: <strong>{target.fullName || target.email}</strong> ({target.planType})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 text-xs font-mono bg-amber-600/30 px-2 py-1 rounded">
          <Clock className="h-3 w-3" />
          {elapsed}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exitSupportMode}
          className="bg-amber-950 text-amber-100 border-amber-700 hover:bg-amber-900 hover:text-white"
        >
          <X className="h-4 w-4 mr-1" />
          Sair do Suporte
        </Button>
      </div>
    </div>
  );
};
