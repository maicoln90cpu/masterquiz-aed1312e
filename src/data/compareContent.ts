/**
 * Conteúdo estático da página /compare
 * Centraliza dados da tabela comparativa e blocos vs InLead
 * Verificado em abril/2026
 */

export type CompareValue = {
  type: "yes" | "no" | "warn" | "text";
  text?: string;
};

export type CompareRow = {
  id: string;
  feature: string;
  masterquizz: CompareValue;
  inlead: CompareValue;
  typeform: CompareValue;
  outgrow: CompareValue;
};

/** 18 linhas conforme especificação verificada do usuário */
export const COMPARE_ROWS: CompareRow[] = [
  {
    id: "free_plan",
    feature: "Plano gratuito real",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "no", text: "Não" },
    typeform: { type: "warn", text: "10 respostas/mês" },
    outgrow: { type: "warn", text: "Sem quiz no free" },
  },
  {
    id: "min_price",
    feature: "Menor plano pago",
    masterquizz: { type: "text", text: "R$ 37/mês" },
    inlead: { type: "text", text: "R$ 97/mês" },
    typeform: { type: "text", text: "~R$ 165/mês" },
    outgrow: { type: "text", text: "~R$ 80/mês" },
  },
  {
    id: "lang_pt",
    feature: "Interface em português",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "no", text: "Inglês" },
    outgrow: { type: "no", text: "Inglês" },
  },
  {
    id: "br_focus",
    feature: "Foco em infoprodutores BR",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "no", text: "Não" },
    outgrow: { type: "no", text: "Não" },
  },
  {
    id: "ai_quiz",
    feature: "Geração de quiz com IA",
    masterquizz: { type: "yes", text: "Nativo" },
    inlead: { type: "no", text: "Não tem" },
    typeform: { type: "warn", text: "Limitado" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "crm",
    feature: "CRM visual integrado",
    masterquizz: { type: "yes", text: "Kanban completo" },
    inlead: { type: "no", text: "Só download" },
    typeform: { type: "no", text: "Não tem" },
    outgrow: { type: "no", text: "Não tem" },
  },
  {
    id: "video",
    feature: "Vídeo hospedado integrado",
    masterquizz: { type: "yes", text: "Incluído" },
    inlead: { type: "no", text: "Externo" },
    typeform: { type: "no", text: "Não tem" },
    outgrow: { type: "no", text: "Não tem" },
  },
  {
    id: "funnel",
    feature: "Analytics com funil",
    masterquizz: { type: "yes", text: "Por pergunta" },
    inlead: { type: "no", text: "Básico" },
    typeform: { type: "warn", text: "Limitado" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "heatmap",
    feature: "Heatmap de respostas",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "no", text: "Não" },
    typeform: { type: "no", text: "Não" },
    outgrow: { type: "no", text: "Não" },
  },
  {
    id: "ab",
    feature: "A/B testing de quiz",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "no", text: "Não" },
    typeform: { type: "no", text: "Não" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "conditional",
    feature: "Perguntas condicionais",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "yes", text: "Sim" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "recovery",
    feature: "Recuperação automática de leads",
    masterquizz: { type: "yes", text: "WhatsApp + Email" },
    inlead: { type: "no", text: "Não" },
    typeform: { type: "no", text: "Não" },
    outgrow: { type: "no", text: "Não" },
  },
  {
    id: "integrations",
    feature: "Integrações nativas",
    masterquizz: { type: "yes", text: "8 ferramentas" },
    inlead: { type: "warn", text: "Webhook apenas" },
    typeform: { type: "yes", text: "300+" },
    outgrow: { type: "yes", text: "1.000+" },
  },
  {
    id: "fb_pixel",
    feature: "Facebook Pixel por quiz",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "yes", text: "Sim" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "gtm",
    feature: "Google Tag Manager",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "yes", text: "Sim" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "white_label",
    feature: "White label",
    masterquizz: { type: "yes", text: "Plano Partner+" },
    inlead: { type: "yes", text: "Todos os planos" },
    typeform: { type: "yes", text: "Plano Plus+" },
    outgrow: { type: "yes", text: "Sim" },
  },
  {
    id: "support_pt",
    feature: "Suporte em português",
    masterquizz: { type: "yes", text: "Sim" },
    inlead: { type: "yes", text: "Sim" },
    typeform: { type: "no", text: "Inglês" },
    outgrow: { type: "no", text: "Inglês" },
  },
];

export const VS_INLEAD = {
  inlead: {
    title: "InLead",
    subtitle: "A partir de R$ 97/mês — sem plano gratuito",
    points: [
      "Sem CRM visual — leads só por download de lista",
      "Sem IA para criar quiz",
      "Vídeo precisa de plataforma externa (Vimeo, YouTube, etc.)",
      "Sem heatmap de respostas",
      "Sem A/B testing",
      "Sem recuperação automática de leads inativos",
      "Menor plano: 2 funis, 5.000 leads",
    ],
  },
  masterquizz: {
    title: "MasterQuizz",
    subtitle: "Grátis para começar — plano pago a partir de R$ 37/mês",
    points: [
      "CRM Kanban visual integrado com drag-and-drop",
      "IA para criar quiz completo em segundos",
      "Vídeo hospedado incluso — sem precisar de outras plataformas",
      "Heatmap de respostas por pergunta",
      "A/B testing de quiz",
      "Recuperação automática via WhatsApp e email",
      "Plano Pro: 3 quizzes, 500 leads, 2.500 respostas",
    ],
  },
  conclusion:
    "Se você usa quiz no funil de vendas para qualificar leads antes do checkout, o MasterQuizz entrega tudo que precisa em uma plataforma só — por menos da metade do preço de entrada do InLead, e com um plano gratuito para começar sem risco.",
};

export const COMPARE_TABLE_FOOTNOTE =
  "Dados verificados em abril de 2026. Preços do Typeform e Outgrow convertidos com câmbio de R$ 5,70.";
