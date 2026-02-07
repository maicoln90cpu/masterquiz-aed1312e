import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Undo2, Redo2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UndoRedoControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount?: number;
  redoCount?: number;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  showCounts?: boolean;
}

export function UndoRedoControls({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  undoCount = 0,
  redoCount = 0,
  size = "sm",
  variant = "outline",
  showCounts = false
}: UndoRedoControlsProps) {
  const { t } = useTranslation();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const undoShortcut = isMac ? '⌘Z' : 'Ctrl+Z';
  const redoShortcut = isMac ? '⌘⇧Z' : 'Ctrl+Y';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={onUndo}
              disabled={!canUndo}
              className="gap-1"
              aria-label={t('editor.undo', 'Desfazer')}
            >
              <Undo2 className="h-4 w-4" />
              {showCounts && undoCount > 0 && (
                <span className="text-xs text-muted-foreground">({undoCount})</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('editor.undo', 'Desfazer')} ({undoShortcut})</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={onRedo}
              disabled={!canRedo}
              className="gap-1"
              aria-label={t('editor.redo', 'Refazer')}
            >
              <Redo2 className="h-4 w-4" />
              {showCounts && redoCount > 0 && (
                <span className="text-xs text-muted-foreground">({redoCount})</span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('editor.redo', 'Refazer')} ({redoShortcut})</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
