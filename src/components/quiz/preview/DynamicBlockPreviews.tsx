import { ClipboardList, TrendingUp, Users, CheckCircle2, X, Check, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizBlock } from "@/types/blocks";
import type { QuizQuestion } from "@/types/quiz";

// ---- ANSWER SUMMARY ----
interface AnswerSummaryPreviewProps {
  block: QuizBlock & { type: 'answerSummary' };
  answers?: Record<string, any>;
  questions?: QuizQuestion[];
}

export const AnswerSummaryBlockPreview = ({ block, answers, questions }: AnswerSummaryPreviewProps) => {
  const hasRuntimeData = answers && questions && Object.keys(answers).length > 0;

  const styleClass = block.style === 'minimal' 
    ? 'space-y-2' 
    : block.style === 'list' 
      ? 'space-y-1' 
      : 'p-4 rounded-xl border bg-card shadow-sm space-y-3';

  const formatAnswer = (val: any): string => {
    if (Array.isArray(val)) return val.join(', ');
    return String(val || '');
  };

  return (
    <div className={styleClass}>
      {block.title && (
        <h4 className="text-base font-semibold flex items-center gap-2">
          {block.showIcon !== false && <ClipboardList className="h-5 w-5 text-primary" />}
          {block.title}
        </h4>
      )}

      {hasRuntimeData ? (
        <div className="space-y-2">
          {questions!
            .filter((q) => {
              // Filter by selectedQuestionIds if defined
              const selectedIds = (block as any).selectedQuestionIds;
              if (selectedIds && selectedIds.length > 0) {
                return selectedIds.includes(q.id);
              }
              return true;
            })
            .map((q) => {
            const answer = answers![q.id];
            if (!answer) return null;
            const questionBlock = q.blocks?.find((b: any) => b.type === 'question') as any;
            const qText = questionBlock?.questionText || q.question_text;
            const displayAnswer = formatAnswer(answer);
            if (!displayAnswer) return null;

            return (
              <div key={q.id} className="flex items-start gap-2 text-sm">
                {block.showIcon !== false && (
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  {block.showQuestionText !== false && (
                    <span className="text-muted-foreground">{stripHtml(qText)} → </span>
                  )}
                  <span className="font-medium">{displayAnswer}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {['Qual seu objetivo? → Emagrecer', 'Há quanto tempo treina? → 6 meses', 'Quantas vezes por semana? → 3x'].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {block.showIcon !== false && (
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              )}
              <span className="text-muted-foreground italic">{item}</span>
            </div>
          ))}
          <p className="text-xs text-muted-foreground/70 italic mt-2">
            ⚡ Preview — dados reais aparecerão no quiz publicado
          </p>
        </div>
      )}

      {block.subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{block.subtitle}</p>
      )}
    </div>
  );
};

// ---- PROGRESS MESSAGE ----
interface ProgressMessagePreviewProps {
  block: QuizBlock & { type: 'progressMessage' };
  currentStep?: number;
  totalQuestions?: number;
}

export const ProgressMessageBlockPreview = ({ block, currentStep = 0, totalQuestions = 10 }: ProgressMessagePreviewProps) => {
  const percent = totalQuestions > 0 ? Math.round(((currentStep + 1) / totalQuestions) * 100) : 0;
  const messages = block.messages || [];
  
  // Find the message for current threshold
  const activeMessage = [...messages]
    .sort((a, b) => b.threshold - a.threshold)
    .find(m => percent >= m.threshold);

  const displayText = activeMessage?.text || messages[0]?.text || '💪 Continue respondendo!';

  const styleClass = block.style === 'inline'
    ? 'text-sm text-muted-foreground'
    : block.style === 'toast'
      ? 'px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium inline-flex items-center gap-2'
      : 'p-4 rounded-xl border bg-card shadow-sm';

  return (
    <div className={styleClass}>
      {block.style === 'card' && (
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">{percent}% completo</span>
        </div>
      )}
      <p className={block.style === 'card' ? 'text-sm font-medium' : ''}>{displayText}</p>
    </div>
  );
};

// ---- AVATAR GROUP ----
export const AvatarGroupBlockPreview = ({ block }: { block: QuizBlock & { type: 'avatarGroup' } }) => {
  const maxVisible = block.maxVisible || 5;
  const count = block.count || 1234;
  const isCircle = block.avatarStyle !== 'square';
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
  ];

  const initials = ['AS', 'MR', 'JP', 'LF', 'CO', 'RB', 'TM', 'VN'];

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {Array.from({ length: Math.min(maxVisible, 8) }).map((_, i) => (
          <div
            key={i}
            className={`w-9 h-9 ${colors[i % colors.length]} ${isCircle ? 'rounded-full' : 'rounded-md'} border-2 border-background flex items-center justify-center text-white text-xs font-bold shadow-sm`}
          >
            {initials[i % initials.length]}
          </div>
        ))}
      </div>
      {block.showCount !== false && (
        <div className="text-sm">
          <span className="font-bold text-foreground">+{count.toLocaleString('pt-BR')}</span>
          {block.label && <span className="text-muted-foreground ml-1">{block.label}</span>}
        </div>
      )}
    </div>
  );
};

// ---- CONDITIONAL TEXT ----
interface ConditionalTextPreviewProps {
  block: QuizBlock & { type: 'conditionalText' };
  answers?: Record<string, any>;
  questions?: QuizQuestion[];
}

export const ConditionalTextBlockPreview = ({ block, answers, questions }: ConditionalTextPreviewProps) => {
  const conditions = block.conditions || [];
  const sourceId = (block as any).sourceQuestionId;
  
  let displayText = block.fallbackText || '';
  
  if (answers && sourceId && answers[sourceId]) {
    const userAnswer = String(answers[sourceId]);
    const matched = conditions.find(c => userAnswer.toLowerCase().includes(c.answer.toLowerCase()));
    if (matched) displayText = matched.text;
  }

  const hasRuntimeData = answers && sourceId && answers[sourceId];

  const styleClass = block.style === 'highlighted'
    ? 'p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm'
    : block.style === 'card'
      ? 'p-4 rounded-xl border bg-card shadow-sm text-sm'
      : 'text-sm';

  if (!hasRuntimeData) {
    return (
      <div className={styleClass}>
        <p className="text-muted-foreground italic">
          🔀 Texto condicional — exibirá conteúdo baseado na resposta do usuário
        </p>
        {conditions.length > 0 && (
          <div className="mt-2 space-y-1">
            {conditions.map((c, i) => (
              <div key={i} className="text-xs text-muted-foreground/70">
                Se "{c.answer}" → {c.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className={styleClass}>{displayText}</div>;
};

// ---- COMPARISON RESULT ----
interface ComparisonResultPreviewProps {
  block: QuizBlock & { type: 'comparisonResult' };
  answers?: Record<string, any>;
}

export const ComparisonResultBlockPreview = ({ block, answers }: ComparisonResultPreviewProps) => {
  const beforeItems = block.beforeItems || [];
  const afterItems = block.afterItems || [];
  const showIcons = block.showIcons !== false;
  const sourceIds = (block as any).sourceQuestionIds || [];

  // Replace {resposta} placeholders with actual answers
  const replaceVars = (text: string): string => {
    if (!answers) return text;
    let result = text;
    sourceIds.forEach((id: string, idx: number) => {
      if (answers[id]) {
        result = result.replace(`{resposta${idx + 1}}`, String(answers[id]));
        result = result.replace(`{resposta}`, String(answers[id]));
      }
    });
    return result;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-destructive flex items-center gap-1">
          {showIcons && <X className="h-4 w-4" />}
          {block.beforeTitle || 'Antes'}
        </h5>
        {beforeItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            {showIcons && <X className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />}
            <span>{replaceVars(item)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-primary flex items-center gap-1">
          {showIcons && <Check className="h-4 w-4" />}
          {block.afterTitle || 'Depois'}
        </h5>
        {afterItems.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            {showIcons && <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />}
            <span className="font-medium">{replaceVars(item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- PERSONALIZED CTA ----
interface PersonalizedCTAPreviewProps {
  block: QuizBlock & { type: 'personalizedCTA' };
  answers?: Record<string, any>;
}

export const PersonalizedCTABlockPreview = ({ block, answers }: PersonalizedCTAPreviewProps) => {
  const sourceId = (block as any).sourceQuestionId;
  const conditions = block.conditions || [];
  
  let buttonText = block.fallbackText || block.textTemplate || 'Ver mais';
  let buttonUrl = block.url || '#';
  
  if (answers && sourceId && answers[sourceId]) {
    const userAnswer = String(answers[sourceId]);
    // Check conditions first
    const matched = conditions.find((c: any) => userAnswer.toLowerCase().includes(c.answer.toLowerCase()));
    if (matched) {
      buttonText = matched.text;
      if (matched.url) buttonUrl = matched.url;
    } else {
      // Template replacement
      buttonText = block.textTemplate.replace(/\{resposta\}/g, userAnswer);
    }
  }

  const sizeClass = block.size === 'sm' ? 'h-8 px-3 text-xs' : block.size === 'lg' ? 'h-12 px-8 text-base' : 'h-10 px-4 text-sm';

  const variantClass = block.variant === 'outline'
    ? 'border-2 border-primary text-primary bg-transparent hover:bg-primary/5'
    : block.variant === 'secondary'
      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      : block.variant === 'ghost'
        ? 'text-primary hover:bg-primary/10'
        : 'bg-primary text-primary-foreground hover:bg-primary/90';

  const handleClick = () => {
    if (buttonUrl && buttonUrl !== '#') {
      window.open(buttonUrl, block.openInNewTab ? '_blank' : '_self');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${sizeClass} ${variantClass}`}
    >
      {buttonText}
      {block.openInNewTab ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
    </button>
  );
};

// Helper
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
