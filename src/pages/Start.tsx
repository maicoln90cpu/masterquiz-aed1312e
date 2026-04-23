import { logger } from '@/lib/logger';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Rocket, TrendingUp, Megaphone, FlaskConical, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { useAuth } from "@/contexts/AuthContext";
import { quizTemplates } from "@/data/quizTemplates";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

// Mapeamento objetivo → template ID
const OBJECTIVE_TEMPLATE_MAP: Record<string, string> = {
  lead_capture_launch: "funil-captacao-leads",
  vsl_conversion: "funil-pre-vsl",
  paid_traffic: "funil-trafego-pago",
  offer_validation: "funil-validacao-oferta",
  educational: "funil-educacional",
};

// Segmentação ON/OFF para GTM — ON = comercial (público comprador), OFF = educacional
const COMMERCIAL_OBJECTIVES = ['lead_capture_launch', 'vsl_conversion', 'paid_traffic', 'offer_validation'];

interface ObjectiveCard {
  value: string;
  icon: React.ReactNode;
  labelKey: string;
  descKey: string;
  emoji: string;
}

const OBJECTIVES: ObjectiveCard[] = [
  {
    value: "lead_capture_launch",
    icon: <Rocket className="h-7 w-7" />,
    labelKey: "start.objectives.leadCapture",
    descKey: "start.objectives.leadCaptureDesc",
    emoji: "🎯",
  },
  {
    value: "vsl_conversion",
    icon: <TrendingUp className="h-7 w-7" />,
    labelKey: "start.objectives.vslConversion",
    descKey: "start.objectives.vslConversionDesc",
    emoji: "📈",
  },
  {
    value: "paid_traffic",
    icon: <Megaphone className="h-7 w-7" />,
    labelKey: "start.objectives.paidTraffic",
    descKey: "start.objectives.paidTrafficDesc",
    emoji: "📣",
  },
  {
    value: "offer_validation",
    icon: <FlaskConical className="h-7 w-7" />,
    labelKey: "start.objectives.offerValidation",
    descKey: "start.objectives.offerValidationDesc",
    emoji: "🧪",
  },
  {
    value: "educational",
    icon: <GraduationCap className="h-7 w-7" />,
    labelKey: "start.objectives.educational",
    descKey: "start.objectives.educationalDesc",
    emoji: "📚",
  },
];

const Start = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkQuizLimit } = useSubscriptionLimits();
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  const handleSelectObjective = async (objective: string) => {
    if (loading || !user) return;
    setSelectedObjective(objective);
    setLoading(true);

    try {
      // 0. Deduplicação do evento objective_selected — só dispara na PRIMEIRA seleção.
      // Se o usuário voltar a /start e trocar de objetivo, profile.user_objectives já
      // estará preenchido e o evento NÃO é re-disparado (evita inflar conversões no Ads).
      // O UPDATE em user_objectives continua acontecendo normalmente abaixo.
      let alreadyFired = false;
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_objectives')
          .eq('id', user.id)
          .maybeSingle();
        const existing = (existingProfile?.user_objectives ?? []) as unknown;
        alreadyFired = Array.isArray(existing) && existing.length > 0;
      } catch (dedupErr) {
        // Falha transitória → fallback seguro: dispara o evento (comportamento legado)
        logger.warn('[Start] dedup check failed, firing event as fallback:', dedupErr);
      }

      if (!alreadyFired) {
        const isCommercial = COMMERCIAL_OBJECTIVES.includes(objective);
        pushGTMEvent('objective_selected', {
          value: isCommercial ? 'ON' : 'OFF',
          objective_type: objective,
          user_id: user.id,
        });
      }

      // 1. Salvar objetivo no perfil
      await supabase
        .from("profiles")
        .update({ user_objectives: [objective] } as any)
        .eq("id", user.id);

      // 2. Buscar template correspondente
      const templateId = OBJECTIVE_TEMPLATE_MAP[objective] || "funil-captacao-leads";
      const template = quizTemplates.find((t) => t.id === templateId);

      if (!template) {
        toast.error(t("common.errorGeneric"));
        setLoading(false);
        return;
      }

      // 3. Verificar se já existe draft express_auto do mesmo usuário
      const { data: existingDraft } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', user.id)
        .eq('creation_source', 'express_auto')
        .eq('status', 'draft' as any)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDraft) {
        navigate(`/create-quiz?id=${existingDraft.id}&mode=express`);
        return;
      }

      // 4. Verificar limite de quizzes antes de criar
      const canCreate = await checkQuizLimit();
      if (!canCreate) {
        toast.error(t("start.quizLimitReached", "Você atingiu o limite de quizzes do seu plano. Faça upgrade para criar mais."));
        navigate('/dashboard', { replace: true });
        setLoading(false);
        return;
      }

      // 🎯 GTM: express_started — track when Express flow creates a quiz
      pushGTMEvent('express_started', {
        user_id: user.id,
        objective,
        template_id: templateId,
      });

      // 5. Criar quiz rascunho com slug aleatório numérico
      const expressSlug = 'exp-' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title: template.config.title,
          description: template.config.description,
          template: template.config.template,
          question_count: Math.min(template.config.questions.length, 8),
          status: "draft" as any,
          is_public: true,
          creation_source: "express_auto",
          slug: expressSlug,
        })
        .select("id")
        .single();

      if (quizError || !quiz) {
        logger.error("Error creating quiz:", quizError);
        toast.error(t("common.errorSaving"));
        setLoading(false);
        return;
      }

      // 4. Inserir perguntas do template (limitado a 8 no express)
      const maxExpressQuestions = 8;
      const limitedQuestions = template.config.questions.slice(0, maxExpressQuestions);
      const questionsToInsert = limitedQuestions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        answer_format: q.answer_format,
        options: q.options || [],
        blocks: q.blocks || [],
        order_number: q.order_number || index,
        custom_label: q.custom_label || null,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) {
        logger.error("Error inserting questions:", questionsError);
      }

      // 5. Inserir form config padrão
      const { error: formError } = await supabase
        .from("quiz_form_config")
        .insert({
          quiz_id: quiz.id,
          collect_name: template.config.formConfig?.collect_name ?? true,
          collect_email: template.config.formConfig?.collect_email ?? true,
          collect_whatsapp: template.config.formConfig?.collect_whatsapp ?? false,
          collection_timing: template.config.formConfig?.collection_timing ?? "after",
        });

      if (formError) {
        logger.error("Error inserting form config:", formError);
      }

      // 6. Inserir resultado padrão
      if (template.config.results?.length > 0) {
        const resultsToInsert = template.config.results.map((r) => ({
          quiz_id: quiz.id,
          result_text: r.result_text,
          button_text: r.button_text || "Ver resultado",
          condition_type: r.condition_type || "always",
          order_number: r.order_number || 0,
        }));

        const { error: resultsError } = await supabase
          .from("quiz_results")
          .insert(resultsToInsert);

        if (resultsError) {
          logger.error("Error inserting results:", resultsError);
        }
      }

      // 7. Marcar que o usuário completou o /start (skip modais no dashboard)
      localStorage.setItem("mq_start_completed", "true");
      // NÃO remover mq_just_registered aqui — o Dashboard precisa dela para disparar account_created

      // 8. Redirecionar para editor em modo express
      navigate(`/create-quiz?id=${quiz.id}&mode=express`);
    } catch (err) {
      logger.error("Error in start flow:", err);
      toast.error(t("common.errorGeneric"));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("start.title", "Qual dessas situações descreve você hoje?")}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t("start.subtitle", "Vamos montar um quiz estruturado automaticamente pra você — em poucos cliques.")}
          </p>
        </motion.div>

        {/* Objective Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OBJECTIVES.map((obj, i) => {
            const isSelected = selectedObjective === obj.value;
            const isDisabled = loading && !isSelected;

            return (
              <motion.button
                key={obj.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectObjective(obj.value)}
                className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30 scale-[1.02]"
                    : isDisabled
                    ? "border-border opacity-50 cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:bg-muted/50 hover:shadow-md cursor-pointer"
                }`}
              >
                {isSelected && loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm text-primary font-medium">
                        {t("start.creating", "Criando seu quiz...")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-2xl">{obj.emoji}</span>
                  <span className={`${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    {obj.icon}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t(obj.labelKey, obj.value)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(obj.descKey, "")}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          {t("start.hint", "Você poderá alterar tudo depois no editor completo")}
        </motion.p>
      </div>
    </main>
  );
};

export default Start;
