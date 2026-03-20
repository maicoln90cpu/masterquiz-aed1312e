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
          {questions!.map((q) => {
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

// Helper
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
