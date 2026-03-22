import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { List, Plus, Settings2 } from "lucide-react";
import { QuestionsList } from "@/components/quiz/QuestionsList";
import { ModernBlockPalette } from "@/components/quiz/blocks/ModernBlockPalette";
import { BlockPropertiesPanel } from "@/components/quiz/blocks/BlockPropertiesPanel";
import { BlockErrorBoundary } from "@/components/quiz/blocks/BlockErrorBoundary";
import type { BlockType, QuizBlock } from "@/types/blocks";

interface MobileEditorToolbarProps {
  questions: any[];
  currentQuestionIndex: number;
  step: number;
  questionsLimit: number;
  editorState: any;
  onQuestionClick: (idx: number) => void;
  onAddQuestion: () => void;
  onDeleteQuestion: (idx: number) => void;
  onUpdateQuestion: (idx: number, data: any) => void;
  onAddBlock: (type: BlockType) => void;
  updateCurrentQuestionBlocks: (blocks: QuizBlock[]) => void;
  updateEditor: (data: any) => void;
}

export const MobileEditorToolbar = memo(function MobileEditorToolbar({
  questions,
  currentQuestionIndex,
  step,
  questionsLimit,
  editorState,
  onQuestionClick,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateQuestion,
  onAddBlock,
  updateCurrentQuestionBlocks,
  updateEditor,
}: MobileEditorToolbarProps) {
  const { t } = useTranslation();
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);

  const currentQ = questions[currentQuestionIndex];
  const selectedIdx = editorState.selectedBlockIndex ?? 0;
  const selectedBlock = currentQ?.blocks?.[selectedIdx] || null;

  return (
    <>
      {/* Sticky toolbar visible only below lg */}
      <div className="flex lg:hidden items-center gap-2 px-3 py-2 border-b bg-card shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-9 text-xs"
          onClick={() => setQuestionsOpen(true)}
        >
          <List className="h-3.5 w-3.5" />
          {t('createQuiz.mobile.questions', 'Perguntas')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-9 text-xs"
          onClick={() => setPaletteOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          {t('createQuiz.mobile.addBlock', 'Bloco')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 h-9 text-xs"
          onClick={() => setPropertiesOpen(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {t('createQuiz.mobile.properties', 'Props')}
        </Button>
      </div>

      {/* Questions Sheet (left) */}
      <Sheet open={questionsOpen} onOpenChange={setQuestionsOpen}>
        <SheetContent side="left" className="p-0 w-[300px] sm:max-w-[300px]">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm">{t('createQuiz.mobile.questionsList', 'Lista de Perguntas')}</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-y-auto">
            <QuestionsList
              questions={questions}
              currentStep={step}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionClick={(idx) => {
                onQuestionClick(idx);
                setQuestionsOpen(false);
              }}
              onAddQuestion={onAddQuestion}
              onDeleteQuestion={onDeleteQuestion}
              onUpdateQuestion={onUpdateQuestion}
              questionsPerQuizLimit={questionsLimit}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Block Palette Sheet (bottom) */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="bottom" className="p-0 h-[60vh]">
          <ModernBlockPalette onAddBlock={(type) => {
            onAddBlock(type);
            setPaletteOpen(false);
          }} />
        </SheetContent>
      </Sheet>

      {/* Properties Sheet (right) */}
      <Sheet open={propertiesOpen} onOpenChange={setPropertiesOpen}>
        <SheetContent side="right" className="p-0 w-[320px] sm:max-w-[320px]">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t('createQuiz.blockProperties', 'Propriedades')}
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-y-auto">
            <BlockErrorBoundary blockType="properties-panel">
              {selectedBlock ? (
                <BlockPropertiesPanel
                  block={selectedBlock}
                  questions={questions}
                  onChange={(updatedBlock) => {
                    const blocks = [...(currentQ.blocks || [])];
                    blocks[selectedIdx] = updatedBlock;
                    updateCurrentQuestionBlocks(blocks);
                  }}
                />
              ) : (
                <div className="p-4 text-center">
                  <Settings2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('createQuiz.noBlockSelected', 'Nenhum bloco disponível')}
                  </p>
                </div>
              )}
            </BlockErrorBoundary>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});
