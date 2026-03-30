import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Cloud, 
  CloudOff, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error' | 'offline' | 'disabled';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  hasQuizId?: boolean;
  className?: string;
  compact?: boolean;
}

export const AutoSaveIndicator = ({
  status,
  lastSavedAt,
  hasQuizId = false,
  className,
  compact = false
}: AutoSaveIndicatorProps) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          label: t('autoSave.saving', 'Salvando...'),
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          pulse: true
        };
      case 'saved':
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          label: lastSavedAt 
            ? t('autoSave.savedAt', 'Salvo às {{time}}', { 
                time: lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
              })
            : t('autoSave.saved', 'Salvo'),
          color: 'bg-green-500/10 text-green-600 border-green-500/30',
          pulse: false
        };
      case 'unsaved':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          label: t('autoSave.unsaved', 'Alterações não salvas'),
          color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
          pulse: true
        };
      case 'error':
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          label: t('autoSave.error', 'Erro ao salvar'),
          color: 'bg-destructive/10 text-destructive border-destructive/30',
          pulse: false
        };
      case 'offline':
        return {
          icon: <CloudOff className="h-3.5 w-3.5" />,
          label: t('autoSave.offline', 'Offline - salvo localmente'),
          color: 'bg-muted text-muted-foreground border-muted',
          pulse: false
        };
      default:
        return {
          icon: hasQuizId ? <Cloud className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />,
          label: hasQuizId 
            ? t('autoSave.ready', 'Pronto para salvar')
            : t('autoSave.publishFirst', 'Publique para habilitar'),
          color: 'bg-muted/50 text-muted-foreground border-muted',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("flex items-center", className)}
            >
              <Badge 
                variant="outline" 
                className={cn(
                  "h-7 px-2 gap-1.5 font-normal transition-all",
                  config.color
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={status}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center"
                  >
                    {config.icon}
                  </motion.span>
                </AnimatePresence>
                {config.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      status === 'unsaved' ? 'bg-yellow-400' : 'bg-blue-400'
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      status === 'unsaved' ? 'bg-yellow-500' : 'bg-blue-500'
                    )} />
                  </span>
                )}
              </Badge>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{config.label}</p>
            {lastSavedAt && status !== 'saving' && (
              <p className="text-xs text-muted-foreground">
                Último salvamento: {lastSavedAt.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn("flex items-center gap-2", className)}
    >
      <Badge 
        variant="outline" 
        className={cn(
          "h-8 px-3 gap-2 font-normal transition-all",
          config.color
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center"
          >
            {config.icon}
          </motion.span>
        </AnimatePresence>
        
        <span className="text-sm">{config.label}</span>
        
        {config.pulse && (
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              status === 'unsaved' ? 'bg-yellow-400' : 'bg-blue-400'
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              status === 'unsaved' ? 'bg-yellow-500' : 'bg-blue-500'
            )} />
          </span>
        )}
      </Badge>
    </motion.div>
  );
};
