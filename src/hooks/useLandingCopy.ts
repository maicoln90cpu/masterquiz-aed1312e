import { useLandingContent } from "./useLandingContent";
import { useLandingABTest } from "./useLandingABTest";

/**
 * Helper centralizado de prioridade de copy da landing.
 *
 * REGRA ÚNICA (definida na Etapa 1.1 do refactor da landing):
 *   1. Se existe um teste A/B ATIVO para o `element`, o conteúdo da variante
 *      atribuída (A ou B) tem prioridade — independente do que houver em
 *      `landing_content`.
 *   2. Se o teste A/B existe mas está INATIVO (ou não existe nenhum teste),
 *      usamos o valor estático de `landing_content` (chave = `cmsKey`).
 *   3. Se nenhuma das fontes acima retornar texto, caímos no `fallback`.
 *
 * Centralizar essa regra evita que cada componente reimplemente a lógica e
 * crie inconsistências futuras (ex.: hero mostrando A/B, pricing ignorando).
 */
export const useLandingCopy = () => {
  const { getContent } = useLandingContent();
  const { getContentForElement, getTestByElement } = useLandingABTest();

  /**
   * Retorna o texto correto para um elemento da landing.
   *
   * @param element  Nome do `target_element` em `landing_ab_tests`.
   * @param cmsKey   Chave correspondente em `landing_content`.
   * @param fallback Texto de último recurso (hardcoded no componente).
   */
  const getCopy = (element: string, cmsKey: string, fallback = ""): string => {
    const test = getTestByElement(element);

    // 1) Teste A/B ativo → variante manda
    if (test?.is_active) {
      const abContent = getContentForElement(element);
      const abText = abContent?.text;
      if (typeof abText === "string" && abText.trim() !== "") {
        return abText;
      }
    }

    // 2) Conteúdo estático do CMS (landing_content)
    const cmsValue = getContent(cmsKey);
    if (cmsValue && cmsValue.trim() !== "") {
      return cmsValue;
    }

    // 3) Fallback hardcoded
    return fallback;
  };

  /**
   * Retorna o objeto inteiro da variante (ex.: `{ text, style }`) quando o
   * teste está ativo, ou `null` se o teste estiver inativo / inexistente.
   * Útil quando o componente precisa do `style` além do `text`.
   */
  const getActiveVariantContent = (
    element: string
  ): Record<string, any> | null => {
    const test = getTestByElement(element);
    if (!test?.is_active) return null;
    return getContentForElement(element);
  };

  return { getCopy, getActiveVariantContent };
};
