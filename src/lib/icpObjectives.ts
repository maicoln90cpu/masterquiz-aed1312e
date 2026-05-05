/**
 * ICP Objectives — fonte única de verdade ON/OFF.
 *
 * `user_objectives` em profiles guarda o tipo de quiz desejado.
 * Os 4 valores abaixo classificam o usuário como ICP comercial (ON);
 * `educational` classifica como OFF.
 *
 * Reusado por:
 * - `src/pages/Start.tsx` (gravação inicial + GTM `objective_selected`)
 * - `src/components/UserObjectiveModal.tsx` (modal legado)
 * - Backfill SQL em migration (mesmos 4 valores)
 */
export const COMMERCIAL_OBJECTIVES = [
  'lead_capture_launch',
  'vsl_conversion',
  'paid_traffic',
  'offer_validation',
] as const;

export type CommercialObjective = (typeof COMMERCIAL_OBJECTIVES)[number];

/** TRUE = ICP comercial (ON), FALSE = educacional (OFF). */
export const isCommercialObjective = (objective: string): boolean =>
  (COMMERCIAL_OBJECTIVES as readonly string[]).includes(objective);
