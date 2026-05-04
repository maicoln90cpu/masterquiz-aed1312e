/**
 * Calcula a "temperatura" de um lead.
 *
 * v2 (Pendência 2): combina completude de contato (40%) + score das respostas (60%).
 * Se o quiz não tiver pontuação configurada (nenhum bloco/option com `points`), cai
 * de volta para a lógica antiga (somente completude).
 *
 * - hot  → score final ≥ 0.7
 * - warm → score final ≥ 0.4
 * - cold → score final < 0.4
 */
export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface LeadTemperatureInput {
  respondent_name?: string | null;
  respondent_email?: string | null;
  respondent_whatsapp?: string | null;
  /** Respostas do lead (formato livre — geralmente { [questionId]: optionId | optionId[] | string }). */
  answers?: Record<string, unknown> | null;
  /** Perguntas do quiz (vindo do JOIN no CRM). Cada uma pode ter `blocks` com `options[].points`. */
  questions?: Array<{
    id?: string;
    blocks?: Array<{
      options?: Array<{ id?: string; value?: string | number; points?: number | null }>;
      points?: number | null;
    }> | null;
  }> | null;
}

export interface LeadScoreResult {
  temperature: LeadTemperature;
  /** Pontuação final 0–100 combinando completude + respostas. */
  score0to100: number;
  /** 0–1, completude dos campos de contato. */
  completeness: number;
  /** 0–1 ou null se quiz não tem pontuação configurada. */
  answersScore: number | null;
  /** True se conseguimos calcular score de respostas (havia points configurados). */
  hasPoints: boolean;
}

const isFilled = (v?: string | null): boolean => {
  if (!v) return false;
  const s = v.trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  if (lower === 'sem nome' || lower === 'no name' || lower === 'sin nombre') return false;
  return true;
};

const computeCompleteness = (lead: LeadTemperatureInput): number => {
  let count = 0;
  if (isFilled(lead.respondent_name)) count++;
  if (isFilled(lead.respondent_email)) count++;
  if (isFilled(lead.respondent_whatsapp)) count++;
  // 3→1.0, 2→0.67, 1→0.33, 0→0
  return Math.round((count / 3) * 100) / 100;
};

/**
 * Extrai pontuação das respostas de forma defensiva. Sem assumir um formato fixo
 * — varre `questions[].blocks[].options[]` procurando por `points` numérico e
 * tenta casar com valores presentes em `answers`.
 * Retorna { earned, max, hasPoints }. hasPoints=false ⇒ caller deve cair p/ completude.
 */
const computeAnswersScore = (
  lead: LeadTemperatureInput
): { earned: number; max: number; hasPoints: boolean } => {
  const questions = lead.questions ?? [];
  const answers = lead.answers ?? {};

  // Conjunto serializado das respostas (ids ou valores) — busca tolerante.
  const answerTokens = new Set<string>();
  try {
    const collect = (v: unknown): void => {
      if (v == null) return;
      if (Array.isArray(v)) { v.forEach(collect); return; }
      if (typeof v === 'object') { Object.values(v as Record<string, unknown>).forEach(collect); return; }
      answerTokens.add(String(v));
    };
    collect(answers);
  } catch {
    // ignore — fallback gracioso
  }

  let earned = 0;
  let max = 0;
  let hasPoints = false;

  for (const q of questions) {
    const blocks = q?.blocks ?? [];
    for (const block of blocks) {
      const options = Array.isArray(block?.options) ? block.options : [];
      if (options.length === 0) continue;

      // Soma o maior `points` configurado entre as opções (ceiling teórico p/ a pergunta).
      const optionPoints = options
        .map((o) => (typeof o?.points === 'number' && Number.isFinite(o.points) ? o.points : null))
        .filter((n): n is number => n !== null);

      if (optionPoints.length === 0) continue;

      hasPoints = true;
      max += Math.max(...optionPoints);

      // Pontos efetivamente ganhos: opção(ões) selecionada(s) presente(s) nos tokens.
      for (const opt of options) {
        if (typeof opt?.points !== 'number' || !Number.isFinite(opt.points)) continue;
        const idMatch = opt.id != null && answerTokens.has(String(opt.id));
        const valMatch = opt.value != null && answerTokens.has(String(opt.value));
        if (idMatch || valMatch) {
          earned += opt.points;
        }
      }
    }
  }

  return { earned, max, hasPoints };
};

export const getLeadScore = (lead: LeadTemperatureInput): LeadScoreResult => {
  const completeness = computeCompleteness(lead);
  const { earned, max, hasPoints } = computeAnswersScore(lead);
  const answersScore = hasPoints && max > 0 ? Math.max(0, Math.min(1, earned / max)) : null;

  const final =
    answersScore === null ? completeness : completeness * 0.4 + answersScore * 0.6;

  const temperature: LeadTemperature =
    final >= 0.7 ? 'hot' : final >= 0.4 ? 'warm' : 'cold';

  return {
    temperature,
    score0to100: Math.round(final * 100),
    completeness,
    answersScore,
    hasPoints,
  };
};

/** Wrapper retrocompatível — mantém assinatura antiga. */
export const getLeadTemperature = (lead: LeadTemperatureInput): LeadTemperature =>
  getLeadScore(lead).temperature;
