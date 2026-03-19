import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { BlockType } from "@/types/blocks";
import { blockCatalogSections } from "./blockPaletteCatalog";

interface ModernBlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

/**
 * ModernBlockPalette — Coluna 2 exclusiva do modo Modern.
 * 
 * Replica exatamente a mesma lista e lógica do dropdown "Adicionar"
 * do BlockEditor, sem HoverCards, Tooltips ou TemplatePreview.
 * Cada clique chama onAddBlock(type) de forma síncrona e leve.
 */
export const ModernBlockPalette = memo(function ModernBlockPalette({ onAddBlock }: ModernBlockPaletteProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">
          {t('createQuiz.blockEditor.addBlock', 'Adicionar Bloco')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('createQuiz.blockEditor.clickToAdd', 'Clique para adicionar')}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {blockCatalogSections.map((section, sIdx) => (
            <div key={section.titleKey}>
              {sIdx > 0 && <Separator className="my-2" />}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                {t(section.titleKey, section.defaultTitle)}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.type}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs font-normal"
                    onClick={() => onAddBlock(item.type)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {t(item.labelKey, item.defaultLabel)}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});
