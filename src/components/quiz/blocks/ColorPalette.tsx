import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

// ============================================================
// 🎨 Onda 5 — Paleta de cores reutilizável
// ------------------------------------------------------------
// Single source of truth para escolha de cor em todos os blocos.
// Combina:
//   1. Swatches pré-definidos (12 cores comuns)
//   2. Color picker nativo
//   3. Input de hex livre
//   4. Botão "limpar" para voltar ao padrão
// ============================================================

export interface ColorPaletteProps {
  /** Cor atual (hex) — `undefined` = sem cor / padrão da variante */
  value?: string;
  /** Callback ao alterar — recebe `undefined` quando o usuário limpa */
  onChange: (value: string | undefined) => void;
  /** Cor padrão usada como placeholder visual quando `value` é vazio */
  defaultValue?: string;
  /** Label opcional — quando ausente, o componente renderiza só os controles */
  label?: string;
  /** Texto de ajuda exibido abaixo do componente */
  hint?: string;
  /** Permite limpar (volta para padrão). Default: true */
  allowClear?: boolean;
  /** Override dos swatches pré-definidos */
  swatches?: string[];
}

const DEFAULT_SWATCHES = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#0f172a', // slate-900
  '#64748b', // slate-500
  '#ffffff', // white
];

export const ColorPalette = ({
  value,
  onChange,
  defaultValue = '#3b82f6',
  label,
  hint,
  allowClear = true,
  swatches = DEFAULT_SWATCHES,
}: ColorPaletteProps) => {
  const current = value || defaultValue;

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}

      {/* Swatches grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {swatches.map((color) => {
          const isSelected = value?.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "relative h-7 w-full rounded-md border-2 transition-all",
                "hover:scale-110 hover:shadow-md",
                isSelected ? "border-foreground ring-2 ring-ring" : "border-border"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Selecionar cor ${color}`}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "h-3.5 w-3.5 absolute inset-0 m-auto",
                    color === '#ffffff' ? "text-foreground" : "text-white"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom picker + hex input */}
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 p-1 cursor-pointer shrink-0"
          aria-label="Selecionar cor personalizada"
        />
        <Input
          value={value || ''}
          placeholder={defaultValue}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="flex-1 h-8 text-xs font-mono"
        />
        {allowClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(undefined)}
            aria-label="Limpar cor"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
};