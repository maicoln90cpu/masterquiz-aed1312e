import { VisitorFormConfigStep } from '@/components/quiz/VisitorFormConfigStep';
import { ResultsConfigStep } from '@/components/quiz/ResultsConfigStep';
import { FunnelStepInfo } from '@/components/quiz/FunnelStepInfo';

interface EditorDataCollectionStepProps {
  showResults: boolean;
  onBackToQuestions: () => void;
  collectionTiming: 'before' | 'after' | 'none';
  onCollectionTimingChange: (v: 'before' | 'after' | 'none') => void;
  collectName: boolean;
  onCollectNameChange: (v: boolean) => void;
  collectEmail: boolean;
  onCollectEmailChange: (v: boolean) => void;
  collectWhatsapp: boolean;
  onCollectWhatsappChange: (v: boolean) => void;
}

/**
 * Componente compartilhado da Etapa 4 (Coleta de Dados) entre Classic e Modern.
 * - Modo Funil (showResults=false): mostra FunnelStepInfo + form bloqueado.
 * - Modo Padrão: mostra VisitorFormConfigStep editável.
 *
 * Centraliza a UI para evitar divergência entre os 2 editores.
 */
export const EditorDataCollectionStep = (props: EditorDataCollectionStepProps) => {
  if (!props.showResults) {
    return (
      <div className="space-y-4">
        <FunnelStepInfo variant="collection" onBackToQuestions={props.onBackToQuestions} />
        <div className="opacity-50 pointer-events-none select-none" aria-hidden="true">
          <VisitorFormConfigStep
            collectionTiming="none"
            onCollectionTimingChange={() => { /* bloqueado em modo funil */ }}
            collectName={props.collectName}
            onCollectNameChange={() => { /* bloqueado */ }}
            collectEmail={props.collectEmail}
            onCollectEmailChange={() => { /* bloqueado */ }}
            collectWhatsapp={props.collectWhatsapp}
            onCollectWhatsappChange={() => { /* bloqueado */ }}
          />
        </div>
      </div>
    );
  }

  return (
    <VisitorFormConfigStep
      collectionTiming={props.collectionTiming}
      onCollectionTimingChange={props.onCollectionTimingChange}
      collectName={props.collectName}
      onCollectNameChange={props.onCollectNameChange}
      collectEmail={props.collectEmail}
      onCollectEmailChange={props.onCollectEmailChange}
      collectWhatsapp={props.collectWhatsapp}
      onCollectWhatsappChange={props.onCollectWhatsappChange}
    />
  );
};

interface EditorResultsStepProps {
  showResults: boolean;
  onBackToQuestions: () => void;
  quizId?: string;
  deliveryTiming: string;
  onDeliveryTimingChange: (v: string) => void;
}

/**
 * Componente compartilhado da Etapa 5 (Resultados) entre Classic e Modern.
 * - Modo Funil: substitui ResultsConfigStep por FunnelStepInfo.
 * - Modo Padrão: mostra ResultsConfigStep normal.
 */
export const EditorResultsStep = (props: EditorResultsStepProps) => {
  if (!props.showResults) {
    return <FunnelStepInfo variant="results" onBackToQuestions={props.onBackToQuestions} />;
  }

  return (
    <ResultsConfigStep
      quizId={props.quizId}
      deliveryTiming={props.deliveryTiming}
      onDeliveryTimingChange={props.onDeliveryTimingChange}
    />
  );
};
