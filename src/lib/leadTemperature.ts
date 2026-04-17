/**
 * Calcula a "temperatura" de um lead com base nos dados de contato disponíveis.
 *
 * Lógica simples e determinística (sem query ao banco):
 * - hot  → tem nome + email + whatsapp
 * - warm → tem 2 dos 3 campos
 * - cold → tem 1 ou 0 campos
 *
 * Usado no CRM para o usuário ver rapidamente em quem focar primeiro.
 */
export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface LeadTemperatureInput {
  respondent_name?: string | null;
  respondent_email?: string | null;
  respondent_whatsapp?: string | null;
}

const isFilled = (v?: string | null): boolean => {
  if (!v) return false;
  const s = v.trim();
  if (!s) return false;
  // Evitar contar placeholders genéricos como "Sem nome"
  const lower = s.toLowerCase();
  if (lower === 'sem nome' || lower === 'no name' || lower === 'sin nombre') return false;
  return true;
};

export const getLeadTemperature = (lead: LeadTemperatureInput): LeadTemperature => {
  let count = 0;
  if (isFilled(lead.respondent_name)) count++;
  if (isFilled(lead.respondent_email)) count++;
  if (isFilled(lead.respondent_whatsapp)) count++;

  if (count >= 3) return 'hot';
  if (count === 2) return 'warm';
  return 'cold';
};
