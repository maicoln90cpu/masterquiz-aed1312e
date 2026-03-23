import { Trophy, Star, ArrowRight, ExternalLink, Package } from "lucide-react";
import type { QuizBlock } from "@/types/blocks";
import type { QuizQuestion } from "@/types/quiz";

interface RecommendationRule {
  questionId: string;
  answers: string[];
  weight: number;
}

interface RecommendationItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  badge?: string;
  rules: RecommendationRule[];
}

interface RecommendationPreviewProps {
  block: QuizBlock & { type: 'recommendation' };
  answers?: Record<string, any>;
  questions?: QuizQuestion[];
  onCtaClick?: (ctaText: string, ctaUrl: string, blockId?: string) => void;
}

/** Calculates score for a recommendation based on matching rules */
const calculateScore = (item: RecommendationItem, answers: Record<string, any>): number => {
  if (!answers || Object.keys(answers).length === 0) return 0;

  let score = 0;
  for (const rule of item.rules) {
    const answer = answers[rule.questionId];
    if (answer === undefined || answer === null) continue;

    const answerValues = Array.isArray(answer)
      ? answer.map(a => String(a).toLowerCase())
      : [String(answer).toLowerCase()];

    const matches = rule.answers.some(ra =>
      answerValues.some(av => av.includes(ra.toLowerCase()))
    );

    if (matches) {
      score += rule.weight;
    }
  }
  return score;
};

export const RecommendationBlockPreview = ({ block, answers, questions, onCtaClick }: RecommendationPreviewProps) => {
  const recommendations: RecommendationItem[] = (block as any).recommendations || [];
  const displayMode = (block as any).displayMode || 'best_match';
  const style = (block as any).style || 'card';
  const showScore = (block as any).showScore || false;
  const fallbackText = (block as any).fallbackText || 'Não encontramos uma recomendação específica para você.';
  const maxDisplay = (block as any).maxDisplay || 0; // ✅ Etapa 2D: Limite máximo
  const hasRuntimeData = answers && Object.keys(answers).length > 0;

  // Calculate scores
  const scored = recommendations.map(item => ({
    ...item,
    score: hasRuntimeData ? calculateScore(item, answers!) : 0,
  })).sort((a, b) => b.score - a.score);

  // Filter based on display mode
  let visible = scored;
  if (hasRuntimeData) {
    if (displayMode === 'best_match') {
      visible = scored.filter(s => s.score > 0).slice(0, 1);
    } else if (displayMode === 'top_3') {
      visible = scored.filter(s => s.score > 0).slice(0, 3);
    }
    if (displayMode === 'all_scored') {
      visible = scored.filter(s => s.score > 0);
    }
    // ✅ Etapa 2D: Aplicar limite máximo
    if (maxDisplay > 0) {
      visible = visible.slice(0, maxDisplay);
    }
  }

  // Editor placeholder
  if (!hasRuntimeData) {
    return (
      <div className="space-y-3">
        {block.title && (
          <h4 className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {block.title}
          </h4>
        )}
        {recommendations.length === 0 ? (
          <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              🎯 Motor de Recomendação — configure produtos/serviços no painel de propriedades
            </p>
          </div>
        ) : (
          <div className={style === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {recommendations.map((item, i) => (
              <RecommendationCard key={item.id || i} item={item} style={style} isPreview showScore={false} score={0} rank={i + 1} />
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground/70 italic">
          ⚡ Preview — recomendações reais aparecerão no quiz publicado ({recommendations.length} produto{recommendations.length !== 1 ? 's' : ''} configurado{recommendations.length !== 1 ? 's' : ''})
        </p>
      </div>
    );
  }

  // No matches
  if (visible.length === 0) {
    return (
      <div className="p-4 rounded-xl border bg-card shadow-sm text-center">
        {block.title && <h4 className="text-base font-semibold mb-2">{block.title}</h4>}
        <p className="text-sm text-muted-foreground">{fallbackText}</p>
      </div>
    );
  }

  // Runtime render
  return (
    <div className="space-y-3">
      {block.title && (
        <h4 className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {block.title}
        </h4>
      )}
      {(block as any).subtitle && (
        <p className="text-sm text-muted-foreground">{(block as any).subtitle}</p>
      )}
      <div className={style === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {visible.map((item, i) => (
          <RecommendationCard
            key={item.id || i}
            item={item}
            style={style}
            isPreview={false}
            showScore={showScore}
            score={item.score}
            rank={i + 1}
            onCtaClick={onCtaClick}
          />
        ))}
      </div>
    </div>
  );
};

// ---- Sub-component: Card ----
interface RecommendationCardProps {
  item: RecommendationItem & { score?: number };
  style: string;
  isPreview: boolean;
  showScore: boolean;
  score: number;
  rank: number;
}

const RecommendationCard = ({ item, style, isPreview, showScore, score, rank }: RecommendationCardProps) => {
  const handleClick = () => {
    if (item.buttonUrl) {
      window.open(item.buttonUrl, '_blank');
    }
  };

  if (style === 'list') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{item.name}</span>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{item.badge}</span>
            )}
          </div>
          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
          {showScore && score > 0 && <p className="text-[10px] text-primary font-medium mt-0.5">Compatibilidade: {score} pts</p>}
        </div>
        {item.buttonText && (
          <button onClick={handleClick} className="text-xs text-primary font-medium hover:underline flex-shrink-0 flex items-center gap-1">
            {item.buttonText} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  // Card / Grid style
  return (
    <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow relative">
      {rank === 1 && !isPreview && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Star className="h-3.5 w-3.5" />
        </div>
      )}
      {item.badge && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mb-2">{item.badge}</span>
      )}
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.name} className="w-full h-32 rounded-lg object-cover mb-3" />
      )}
      <h5 className="font-semibold text-sm">{item.name}</h5>
      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
      {showScore && score > 0 && (
        <p className="text-xs text-primary font-medium mt-1">⭐ Compatibilidade: {score} pts</p>
      )}
      {item.buttonText && (
        <button
          onClick={handleClick}
          className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          {item.buttonText}
          {item.buttonUrl ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};
