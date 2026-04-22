import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import type { QuizBlock } from "@/types/blocks";

interface BlockQuickEditFieldsProps {
  block: QuizBlock;
  onChange: (block: QuizBlock) => void;
}

/**
 * ✅ Onda 3 — Faixa de "Edição rápida" para blocos preview-only.
 *
 * Os blocos `recommendation`, `answerSummary`, `progressMessage`, `avatarGroup`,
 * `conditionalText`, `comparisonResult`, `personalizedCTA` historicamente só
 * mostravam um preview no editor — o usuário precisava ir ao painel direito para
 * editar até o título. Esta faixa expõe os 1-2 campos de texto principais
 * direto no cartão (label + input enxutos), preservando o preview abaixo.
 *
 * Configurações avançadas (regras, condições, cores, paleta) permanecem
 * exclusivamente no painel de Propriedades para não poluir o cartão.
 */
export const BlockQuickEditFields = ({ block, onChange }: BlockQuickEditFieldsProps) => {
  const fields: { label: string; key: string; placeholder: string; value: string }[] = [];

  switch (block.type) {
    case 'answerSummary':
      fields.push(
        { label: 'Título', key: 'title', placeholder: 'Suas respostas', value: (block as any).title || '' },
        { label: 'Subtítulo', key: 'subtitle', placeholder: 'Confira o que você selecionou', value: (block as any).subtitle || '' }
      );
      break;
    case 'recommendation':
      fields.push(
        { label: 'Título', key: 'title', placeholder: 'Recomendado para você', value: (block as any).title || '' },
        { label: 'Subtítulo', key: 'subtitle', placeholder: 'Baseado nas suas respostas', value: (block as any).subtitle || '' }
      );
      break;
    case 'progressMessage':
      fields.push(
        { label: 'Ícone (opcional)', key: 'icon', placeholder: '🎉', value: (block as any).icon || '' }
      );
      break;
    case 'avatarGroup':
      fields.push(
        { label: 'Texto / Label', key: 'label', placeholder: 'Mais de 1.000 pessoas já participaram', value: (block as any).label || '' }
      );
      break;
    case 'conditionalText':
      fields.push(
        { label: 'Texto padrão (fallback)', key: 'fallbackText', placeholder: 'Texto exibido se nenhuma condição corresponder', value: (block as any).fallbackText || '' }
      );
      break;
    case 'comparisonResult':
      fields.push(
        { label: 'Título "Antes"', key: 'beforeTitle', placeholder: 'Antes', value: (block as any).beforeTitle || '' },
        { label: 'Título "Depois"', key: 'afterTitle', placeholder: 'Depois', value: (block as any).afterTitle || '' }
      );
      break;
    case 'personalizedCTA':
      fields.push(
        { label: 'Texto padrão (fallback)', key: 'fallbackText', placeholder: 'Quero saber mais', value: (block as any).fallbackText || '' }
      );
      break;
    default:
      return null;
  }

  if (fields.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-2 border-b bg-muted/30 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
        <Pencil className="h-3 w-3" />
        Edição rápida
      </div>
      <div className={fields.length === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "space-y-2"}>
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-[11px]">{f.label}</Label>
            <Input
              className="h-8 text-sm"
              value={f.value}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...(block as any), [f.key]: e.target.value })}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
