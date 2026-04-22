/**
 * 🎚️ Sistema semântico de z-index — Onda 8.1
 *
 * Centraliza TODAS as camadas de empilhamento da aplicação.
 * Use os tokens (`Z.modal`, `Z.toast`, ...) ou as classes Tailwind equivalentes
 * (`z-modal`, `z-toast`, ...) — nunca `z-[123]` ou números mágicos.
 *
 * Escala (do fundo para o topo):
 *   base       0   → conteúdo padrão
 *   dropdown  10   → menus dropdown, comboboxes
 *   sticky    20   → headers/footers fixos no scroll
 *   fixed     30   → elementos fixos (sidebar mobile, FABs)
 *   overlay   40   → overlays/backdrops semitransparentes
 *   modal     50   → diálogos modais
 *   popover   60   → popovers, tooltips
 *   toast     70   → notificações sonner (sempre no topo)
 *
 * @see mem://design/responsive-system
 */
export const Z = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
} as const;

export type ZLayer = keyof typeof Z;

/** Retorna o valor numérico para uso em estilos inline. */
export function zIndex(layer: ZLayer): number {
  return Z[layer];
}

/** Retorna a classe Tailwind correspondente (ex: `z-modal`). */
export function zClass(layer: ZLayer): string {
  return `z-${layer}`;
}