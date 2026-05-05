/**
 * AIQuizFeedbackCard — Onda 2 (feedback loop)
 *
 * Card discreto exibido após a geração de um quiz pela IA. Coleta nota 1-5,
 * tags rápidas e comentário opcional para alimentar o dashboard de qualidade
 * do admin (Conteúdo → IA → Feedback).
 *
 * REGRESSION SHIELD (PII): O campo `comment` é livre, mas NÃO deve ser usado
 * para perguntar nada que induza coleta de dados pessoais (email, telefone,
 * CPF). O placeholder é genérico de propósito — não alterar para perguntas
 * que peçam contato.
 *
 * REGRESSION SHIELD (GTM funnel — M4.2): este card dispara 3 eventos GTM
 * que alimentam o funil de adoção do feedback de IA. Não remover sem
 * substituir:
 *   - `ai_feedback_shown`     → mount do card
 *   - `ai_feedback_skipped`   → fechar/pular sem submeter
 *   - `ai_feedback_submitted` → INSERT bem-sucedido
 * `submittedRef` evita duplo disparo (submitted + skipped no mesmo ciclo).
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { pushGTMEvent } from "@/lib/gtmLogger";

const QUICK_TAGS = [
  { id: "questions_made_sense", label: "Perguntas faziam sentido" },
  { id: "funnel_well_distributed", label: "Funil estava bem distribuído" },
  { id: "will_use_as_is", label: "Vou usar do jeito que está" },
  { id: "will_edit_a_lot", label: "Vou editar bastante antes de publicar" },
];

interface AIQuizFeedbackCardProps {
  generationId: string;
  quizMode: "form" | "pdf" | "educational" | "traffic";
  modelUsed: string;
  questionsCount: number;
  /** Called after submit/skip so o pai pode esconder o card */
  onDone: () => void;
}

export const AIQuizFeedbackCard = ({
  generationId,
  quizMode,
  modelUsed,
  questionsCount,
  onDone,
}: AIQuizFeedbackCardProps) => {
  const { user } = useCurrentUser();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());
  const submittedRef = useRef<boolean>(false);

  // M4.2 — dispara `ai_feedback_shown` quando o card aparece (sem dedup)
  useEffect(() => {
    pushGTMEvent("ai_feedback_shown", {
      generation_id: generationId,
      quiz_mode: quizMode,
      questions_count: questionsCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = () => {
    if (!submittedRef.current) {
      pushGTMEvent("ai_feedback_skipped", {
        generation_id: generationId,
        quiz_mode: quizMode,
        time_visible_ms: Date.now() - mountTimeRef.current,
      });
    }
    onDone();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar feedback");
      return;
    }
    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas");
      return;
    }
    setSubmitting(true);
    try {
      const wouldUseAsIs = selectedTags.includes("will_use_as_is");
      const { error } = await supabase.from("ai_quiz_feedback").insert({
        generation_id: generationId,
        user_id: user.id,
        rating,
        tags: selectedTags,
        comment: comment.trim() || null,
        would_use_as_is: wouldUseAsIs,
        quiz_mode: quizMode,
        model_used: modelUsed,
        questions_count: questionsCount,
      });
      if (error) throw error;
      toast.success("Obrigado pelo feedback!");
      submittedRef.current = true;
      pushGTMEvent("ai_feedback_submitted", {
        generation_id: generationId,
        quiz_mode: quizMode,
        rating,
        tags_count: selectedTags.length,
        has_comment: comment.trim().length > 0,
      });
      onDone();
    } catch (err: any) {
      // Conflict (já existe feedback p/ esse generation_id) — comporta-se como sucesso silencioso
      if (err?.code === "23505") {
        toast.info("Você já avaliou esse quiz");
        // Não conta como submit novo, mas suprime o `skipped` no onDone
        submittedRef.current = true;
        onDone();
        return;
      }
      logger.error("[AIQuizFeedbackCard] failed to submit:", err);
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Como ficou esse quiz?
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleSkip}
            disabled={submitting}
            aria-label="Pular feedback"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sua avaliação ajuda a IA a gerar quizzes melhores no futuro
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estrelas */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`${n} estrelas`}
            >
              <Star
                className={`h-6 w-6 ${
                  n <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {rating}/5
            </span>
          )}
        </div>

        {/* Tags rápidas */}
        <div className="space-y-2">
          {QUICK_TAGS.map(tag => (
            <label
              key={tag.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selectedTags.includes(tag.id)}
                onCheckedChange={() => toggleTag(tag.id)}
              />
              {tag.label}
            </label>
          ))}
        </div>

        {/* Comentário opcional — placeholder genérico (sem PII) */}
        <Textarea
          placeholder="Comentário opcional sobre o quiz gerado..."
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 500))}
          className="resize-none text-sm"
          rows={2}
          maxLength={500}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {comment.length}/500
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={submitting}
            >
              Pular
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};